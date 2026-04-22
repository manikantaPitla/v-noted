import { randomUUID } from 'crypto'
import { DEFAULT_COLORS, POPULAR_TAGS } from './defaults/constants'

export const getDefaultData = (userId: string) => {
  const PK = `USER#${userId}`
  const now = new Date().toISOString()
  
  const catWorkId = randomUUID()
  const catPersonalId = randomUUID()
  const catOthersId = randomUUID()

  // 1. Categories (Using numeric prefixes for guaranteed DynamoDB sort order)
  const categories = [
    { PK, SK: `CATEGORY#1_${catWorkId}`, id: catWorkId, user_id: userId, name: 'Work', color: DEFAULT_COLORS.WORK, created_at: now },
    { PK, SK: `CATEGORY#2_${catPersonalId}`, id: catPersonalId, user_id: userId, name: 'Personal', color: DEFAULT_COLORS.PERSONAL, created_at: now },
    { PK, SK: `CATEGORY#3_${catOthersId}`, id: catOthersId, user_id: userId, name: 'Others', color: DEFAULT_COLORS.OTHERS, created_at: now }
  ]

  // 2. Popular Tags (5 Requested)
  const tags = POPULAR_TAGS.map(tagName => {
    const id = randomUUID()
    return {
      PK,
      SK: `TAG#${id}`,
      id,
      user_id: userId,
      name: tagName,
      created_at: now
    }
  })

  // 3. Welcome Note
  const welcomeNoteId = randomUUID()
  const welcomeNote = {
    PK,
    SK: `NOTE#${welcomeNoteId}`,
    id: welcomeNoteId,
    user_id: userId,
    category: catWorkId, // Changed to Work as it's the first category
    tags: ['urgent', 'ideas'], // Using the new popular tags
    title: 'Welcome to Vnoted! 🚀',
    content_text: 'Welcome to your new digital playground. Create, organize, and retrieve your thoughts with speed.',
    content_json: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Welcome to Vnoted! 🚀' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Vnoted is a fast, minimal note-taking app designed for clarity and speed.' }] }
      ]
    },
    created_at: now,
    updated_at: now
  }

  return { categories, tags, welcomeNote }
}
