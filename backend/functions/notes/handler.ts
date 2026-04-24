import { extractToken, verifyJwt } from '../../lib/auth'
import { db } from '../../lib/dynamodb'
import { randomUUID } from 'crypto'
import { getDefaultData } from '../../lib/defaults'

type LambdaEvent = {
  httpMethod: string
  path: string
  pathParameters?: Record<string, string>
  queryStringParameters?: Record<string, string>
  body?: string
  headers?: Record<string, string | undefined>
}

type PresenceViewer = {
  viewer_id?: string
  name?: string
  email?: string
  avatar?: string
}

const respond = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { 
    'Content-Type': 'application/json', 
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
  },
  body: JSON.stringify(body),
})

export const handler = async (event: LambdaEvent) => {
  try {
    const { httpMethod, path, pathParameters, queryStringParameters } = event
    const entityId = pathParameters?.id

    // 1. Check for public share link (GET /notes/:id?u=USERID)
    if (httpMethod === 'GET' && path.startsWith('/notes/') && entityId && queryStringParameters?.u) {
      const publicPk = `USER#${queryStringParameters.u}`
      const result = await db.get(publicPk, `NOTE#${entityId}`)
      if (result.Item && result.Item.is_public) {
        const profile = await db.get(publicPk, 'PROFILE')
        return respond(200, {
          ...result.Item,
          owner_profile: profile.Item
            ? {
                name: profile.Item.name,
                email: profile.Item.email,
                avatar: profile.Item.avatar,
              }
            : undefined,
        })
      }
    }

    if (httpMethod === 'POST' && path.startsWith('/presence/') && entityId && queryStringParameters?.u) {
      const ownerPk = `USER#${queryStringParameters.u}`
      const note = await db.get(ownerPk, `NOTE#${entityId}`)
      if (!note.Item || !note.Item.is_public) return respond(404, { error: 'Note not available' })

      const body = JSON.parse(event.body || '{}') as PresenceViewer
      const token = extractToken(event)
      let viewer: PresenceViewer = body

      if (token) {
        try {
          const jwtUser = verifyJwt(token)
          const viewerProfile = await db.get(`USER#${jwtUser.userId}`, 'PROFILE')
          viewer = {
            viewer_id: jwtUser.userId,
            name: String(viewerProfile.Item?.name || jwtUser.name || 'Viewer'),
            email: String(viewerProfile.Item?.email || jwtUser.email || ''),
            avatar: typeof viewerProfile.Item?.avatar === 'string' ? viewerProfile.Item.avatar : undefined,
          }
        } catch {
          viewer = body
        }
      }

      const viewerId = viewer.viewer_id?.trim()
      if (!viewerId) return respond(400, { error: 'Missing viewer id' })

      const now = new Date()
      await db.put({
        PK: ownerPk,
        SK: `PRESENCE#${entityId}#${viewerId}`,
        note_id: entityId,
        viewer_id: viewerId,
        name: viewer.name?.trim() || 'Guest Viewer',
        email: viewer.email || '',
        avatar: viewer.avatar || '',
        last_seen_at: now.toISOString(),
        expires_at: Math.floor(now.getTime() / 1000) + 45,
      })

      return respond(200, { success: true })
    }

    // Auth check
    const token = extractToken(event)
    if (!token) return respond(401, { error: 'Unauthorized' })
    
    const { userId, email, name } = verifyJwt(token)
    const PK = `USER#${userId}`

    // ─── ACCOUNT RESET ───
    if (path === '/auth/reset' && httpMethod === 'POST') {
      try {
        const result = await db.query(PK, undefined, true) // Consistent read for base table
        const items = result.Items || []
        const existingProfile = items.find((item) => item.SK === 'PROFILE')
        const now = new Date().toISOString()
        
        // 1. Batch delete everything (optimized)
        if (items.length > 0) {
          await db.batchDelete(PK, items.map(i => i.SK))
        }
        
        // 2. Re-seed default data from shared utility while preserving profile/preferences
        const { categories, tags, welcomeNote } = getDefaultData(userId)
        const profile = {
          PK,
          SK: 'PROFILE',
          email,
          name,
          accent_color: '#818CF8',
          theme: 'dark',
          created_at: now,
          ...existingProfile,
          updated_at: now,
        }
        
        await Promise.all([
          db.put(profile),
          ...categories.map(cat => db.put(cat)),
          ...tags.map(t => db.put(t)),
          db.put(welcomeNote)
        ])
        
        return respond(200, { success: true, message: 'Account reset and re-seeded' })
      } catch (e) {
        console.error('[reset]', e)
        return respond(500, { error: 'Failed to reset account' })
      }
    }

    // Protection against malformed/missing entity IDs (e.g. "undefined")
    const isMalformedId = entityId === 'undefined' || entityId === 'null'

    // ─── CATEGORIES ───
    if (path.startsWith('/categories')) {
      if (httpMethod === 'GET') {
        const result = await db.query(PK)
        return respond(200, (result.Items || []).filter(i => i.SK.startsWith('CATEGORY#')))
      }
      if (httpMethod === 'POST') {
        const dto = JSON.parse(event.body || '{}')
        if (!dto.name?.trim()) return respond(400, { error: 'Category name is required' })
        
        const id = randomUUID()
        const category = { PK, SK: `CATEGORY#${id}`, id, user_id: userId, ...dto, name: dto.name.trim(), created_at: new Date().toISOString() }
        await db.put(category)
        return respond(201, category)
      }
      if (!entityId || isMalformedId) {
        if (httpMethod !== 'GET' && httpMethod !== 'POST') return respond(400, { error: 'Invalid ID' })
      } else {
        if (httpMethod === 'PUT') {
          const dto = JSON.parse(event.body || '{}')
          const result = await db.update(PK, `CATEGORY#${entityId}`, { ...dto, updated_at: new Date().toISOString() })
          return respond(200, result.Attributes)
        }
        if (httpMethod === 'DELETE') {
          await db.delete(PK, `CATEGORY#${entityId}`)
          return respond(200, { success: true })
        }
      }
    }

    // ─── TAGS ───
    if (path.startsWith('/tags')) {
      if (httpMethod === 'GET') {
        const result = await db.query(PK)
        const tagsByName = new Map<string, Record<string, unknown>>()
        for (const item of result.Items || []) {
          if (item.SK.startsWith('TAG#') && typeof item.name === 'string') {
            tagsByName.set(item.name, item)
          }
        }
        return respond(200, Array.from(tagsByName.values()))
      }
      if (httpMethod === 'POST') {
        const dto = JSON.parse(event.body || '{}')
        if (!dto.name?.trim()) return respond(400, { error: 'Tag name is required' })
        
        const name = dto.name.trim().toLowerCase().replace(/\s+/g, '-')
        const tag = { PK, SK: `TAG#${name}`, user_id: userId, name, created_at: new Date().toISOString() }
        await db.put(tag)
        return respond(201, tag)
      }
      if (httpMethod === 'DELETE') {
        if (!entityId || isMalformedId) return respond(400, { error: 'Invalid ID' })
        const result = await db.query(PK)
        const matchingTags = (result.Items || []).filter((item) =>
          item.SK.startsWith('TAG#') && item.name === entityId
        )
        await Promise.all([
          db.delete(PK, `TAG#${entityId}`),
          ...matchingTags
            .filter((item) => item.SK !== `TAG#${entityId}`)
            .map((item) => db.delete(PK, item.SK)),
        ])
        return respond(200, { success: true })
      }
    }

    // ─── NOTES ───
    if (path.startsWith('/notes')) {
      if (httpMethod === 'GET' && path.endsWith('/viewers') && entityId) {
        const note = await db.get(PK, `NOTE#${entityId}`)
        if (!note.Item) return respond(404, { error: 'Note not found' })

        const now = Math.floor(Date.now() / 1000)
        const result = await db.query(PK)
        const presenceItems = (result.Items || []).filter((item) =>
          item.SK.startsWith(`PRESENCE#${entityId}#`) &&
          item.viewer_id !== userId &&
          typeof item.expires_at === 'number' &&
          item.expires_at > now
        )
        const expiredItems = (result.Items || []).filter((item) =>
          item.SK.startsWith(`PRESENCE#${entityId}#`) &&
          typeof item.expires_at === 'number' &&
          item.expires_at <= now
        )

        if (expiredItems.length > 0) {
          await db.batchDelete(PK, expiredItems.map((item) => item.SK))
        }

        return respond(200, presenceItems
          .sort((a, b) => String(b.last_seen_at).localeCompare(String(a.last_seen_at)))
          .map((item) => ({
            viewer_id: item.viewer_id,
            name: item.name || 'Guest Viewer',
            email: item.email || '',
            avatar: item.avatar || '',
            last_seen_at: item.last_seen_at,
          }))
        )
      }

      if (httpMethod === 'GET' && !entityId) {
        const result = await db.query(PK, 'created_at-index')
        const notes = (result.Items || []).filter((item) => item.SK.startsWith('NOTE#'))
        const { search, category, tags } = queryStringParameters || {}
        let filtered = notes
        if (category) filtered = filtered.filter((n) => n.category === category)
        if (search) {
          const q = search.toLowerCase()
          filtered = filtered.filter(n => n.title?.toLowerCase().includes(q) || n.content_text?.toLowerCase().includes(q))
        }
        if (tags) {
          const tagList = tags.split(',')
          filtered = filtered.filter((n) => tagList.some((t: string) => n.tags?.includes(t)))
        }
        return respond(200, filtered)
      }
      
      if (!entityId || isMalformedId) {
        if (httpMethod !== 'GET' && httpMethod !== 'POST') return respond(400, { error: 'Invalid ID' })
      } else {
        if (httpMethod === 'GET') {
          const result = await db.get(PK, `NOTE#${entityId}`)
          if (!result.Item) return respond(404, { error: 'Note not found' })
          return respond(200, result.Item)
        }
        if (httpMethod === 'PUT') {
          const dto = JSON.parse(event.body || '{}')
          const result = await db.update(PK, `NOTE#${entityId}`, { ...dto, updated_at: new Date().toISOString() })
          return respond(200, result.Attributes)
        }
        if (httpMethod === 'DELETE') {
          await db.delete(PK, `NOTE#${entityId}`)
          return respond(200, { success: true })
        }
      }

      if (httpMethod === 'POST') {
        const dto = JSON.parse(event.body || '{}')
        const id = randomUUID()
        const now = new Date().toISOString()
        const note = { PK, SK: `NOTE#${id}`, id, user_id: userId, ...dto, created_at: now, updated_at: now }
        await db.put(note)
        return respond(201, note)
      }
    }

    // ─── PROFILE ───
    if (path === '/auth/profile' && httpMethod === 'PUT') {
      const dto = JSON.parse(event.body || '{}')
      const profile = await db.get(PK, 'PROFILE')
      if (!profile.Item) return respond(404, { error: 'Profile not found' })

      const updated = {
        ...profile.Item,
        ...dto,
        updated_at: new Date().toISOString(),
      }
      await db.put(updated)
      return respond(200, updated)
    }

    return respond(405, { error: 'Method not allowed' })
  } catch (err) {
    console.error('[handler]', err)
    return respond(500, { error: 'Internal server error' })
  }
}
