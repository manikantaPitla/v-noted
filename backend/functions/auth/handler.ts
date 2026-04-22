import { verifyGoogleToken, signJwt } from '../../lib/auth'
import { db } from '../../lib/dynamodb'
import { getDefaultData } from '../../lib/defaults'

const respond = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
  body: JSON.stringify(body),
})

export const handler = async (event: { body?: string }) => {
  try {
    const { credential } = JSON.parse(event.body || '{}')
    if (!credential) return respond(400, { error: 'Missing credential' })

    const googleUser = await verifyGoogleToken(credential)
    const userId = `USER#${googleUser.googleId}`

    // 2. Check if user is new and seed data if needed
    const profile = await db.get(userId, 'PROFILE')
    if (!profile.Item) {
      console.log(`[auth] New user detected: ${userId}. Seeding default data...`)
      const { categories, tags, welcomeNote } = getDefaultData(googleUser.googleId)
      
      // Save profile (with default accent), default categories, tags, and welcome note
      await Promise.all([
        db.put({
          PK: userId,
          SK: 'PROFILE',
          email: googleUser.email,
          name: googleUser.name,
          avatar: googleUser.avatar,
          accent_color: '#818CF8', // Default Premium Indigo
          theme: 'dark',
          created_at: new Date().toISOString(),
        }),
        ...categories.map(c => db.put(c)),
        ...tags.map(t => db.put(t)),
        db.put(welcomeNote)
      ])
    } else {
      // Update profile info (keep existing theme preferences)
      const currentProfile = profile.Item
      await db.put({
        ...currentProfile,
        PK: userId,
        SK: 'PROFILE',
        email: googleUser.email,
        name: googleUser.name,
        avatar: googleUser.avatar,
        updated_at: new Date().toISOString(),
      })
    }

    const token = signJwt({
      userId: googleUser.googleId,
      email: googleUser.email,
      name: googleUser.name,
    })

    const finalProfile = await db.get(userId, 'PROFILE')
    const profileData = finalProfile.Item || {}

    return respond(200, {
      user: {
        id: googleUser.googleId,
        email: googleUser.email,
        name: googleUser.name,
        avatar: googleUser.avatar,
        accent_color: profileData.accent_color,
        theme: profileData.theme,
      },
      token,
    })
  } catch (err) {
    console.error('[auth/handler]', err)
    return respond(401, { error: 'Authentication failed' })
  }
}
