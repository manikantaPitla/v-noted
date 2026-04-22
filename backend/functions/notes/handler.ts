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
        return respond(200, result.Item)
      }
    }

    // Auth check
    const token = extractToken(event)
    if (!token) return respond(401, { error: 'Unauthorized' })
    
    const { userId } = verifyJwt(token)
    const PK = `USER#${userId}`

    // ─── ACCOUNT RESET ───
    if (path === '/auth/reset' && httpMethod === 'POST') {
      try {
        const result = await db.query(PK, undefined, true) // Consistent read for base table
        const items = result.Items || []
        
        // 1. Batch delete everything (optimized)
        if (items.length > 0) {
          await db.batchDelete(PK, items.map(i => i.SK))
        }
        
        // 2. Re-seed default data from shared utility
        const { categories, tags, welcomeNote } = getDefaultData(userId)
        
        await Promise.all([
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
        return respond(200, (result.Items || []).filter(i => i.SK.startsWith('TAG#')))
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
        await db.delete(PK, `TAG#${entityId}`)
        return respond(200, { success: true })
      }
    }

    // ─── NOTES ───
    if (path.startsWith('/notes')) {
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


