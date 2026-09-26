import { Note, NotesGroup } from '../types/note.types'
import { getDateGroup, formatDateGroupLabel } from '@/utils/formatDate'

export function groupNotesByDate(notes: Note[]): NotesGroup[] {
  const groups: Record<string, Note[]> = {}

  for (const note of notes) {
    const group = getDateGroup(note.created_at)
    if (!groups[group]) groups[group] = []
    groups[group].push(note)
  }

  const order: Array<'today' | 'yesterday' | 'older'> = ['today', 'yesterday', 'older']
  return order
    .filter((g) => groups[g]?.length > 0)
    .map((g) => ({
      label: formatDateGroupLabel(g),
      notes: groups[g],
    }))
}

export function extractTextFromJson(contentJson: Record<string, unknown>): string {
  let text = ''
  const extract = (node: unknown): void => {
    if (!node || typeof node !== 'object') return
    const n = node as Record<string, unknown>
    if (n.type === 'text' && typeof n.text === 'string') {
      text += n.text + ' '
    }
    if (Array.isArray(n.content)) {
      n.content.forEach(extract)
    }
  }
  extract(contentJson)
  return text.trim()
}

type RichTextNode = {
  type?: string
  text?: string
  attrs?: Record<string, unknown>
  content?: RichTextNode[]
}

function serializeNodes(nodes: RichTextNode[] = [], depth = 0): string {
  const lines: string[] = []
  let orderedIndex = 1

  for (const node of nodes) {
    const children = node.content || []

    if (node.type === 'text') {
      lines.push(node.text || '')
    } else if (node.type === 'paragraph' || node.type === 'heading') {
      lines.push(serializeNodes(children, depth).trim())
    } else if (node.type === 'bulletList') {
      lines.push(serializeList(children, depth, 'bullet'))
    } else if (node.type === 'orderedList') {
      lines.push(serializeList(children, depth, 'ordered', orderedIndex))
      orderedIndex += children.length
    } else if (node.type === 'taskList') {
      lines.push(serializeList(children, depth, 'task'))
    } else if (node.type === 'codeBlock') {
      lines.push(serializeNodes(children, depth).trimEnd())
    } else if (node.type === 'blockquote') {
      lines.push(
        serializeNodes(children, depth)
          .trim()
          .split('\n')
          .map((line) => `> ${line}`)
          .join('\n')
      )
    } else if (node.type === 'horizontalRule') {
      lines.push('---')
    } else {
      lines.push(serializeNodes(children, depth))
    }
  }

  return lines
    .filter((line) => line !== '')
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
}

function serializeList(
  items: RichTextNode[],
  depth: number,
  kind: 'bullet' | 'ordered' | 'task',
  start = 1
): string {
  return items
    .map((item, index) => {
      const indent = '  '.repeat(depth)
      const marker =
        kind === 'ordered'
          ? `${start + index}.`
          : kind === 'task'
            ? item.attrs?.checked
              ? '- [x]'
              : '- [ ]'
            : '-'
      const body = serializeNodes(item.content || [], depth + 1).trim()
      const [firstLine = '', ...rest] = body.split('\n')
      const continuation = rest.map((line) => `${indent}  ${line}`).join('\n')
      return `${indent}${marker} ${firstLine}${continuation ? `\n${continuation}` : ''}`.trimEnd()
    })
    .join('\n')
}

export function serializeNoteToPlainText(contentJson: Record<string, unknown>): string {
  const root = contentJson as RichTextNode
  return serializeNodes(root.content || [], 0).trim()
}

export function serializeProseMirrorFragmentToPlainText(slice: {
  content: {
    forEach: (callback: (node: { toJSON: () => RichTextNode }) => void) => void
  }
}): string {
  const content: RichTextNode[] = []
  slice.content.forEach((node) => content.push(node.toJSON()))
  return serializeNodes(content, 0).trim()
}

export function getPreviewSnippet(note: Note, maxLength = 100): string {
  const text = note.content_text || serializeNoteToPlainText(note.content_json)
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '…'
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}
