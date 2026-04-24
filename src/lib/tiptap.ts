import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Highlight from '@tiptap/extension-highlight'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { serializeProseMirrorFragmentToPlainText } from '@/features/notes/utils/note.utils'

const lowlight = createLowlight(common)

export const getTiptapExtensions = (placeholder = 'Start writing... (use / for commands)') => [
  StarterKit.configure({
    codeBlock: false, // replaced by CodeBlockLowlight
    heading: {
      levels: [1, 2, 3],
    },
  }),
  Placeholder.configure({
    placeholder,
  }),
  Underline,
  TaskList,
  TaskItem.configure({
    nested: true,
  }),
  Highlight.configure({
    multicolor: true,
  }),
  CodeBlockLowlight.configure({
    lowlight,
    defaultLanguage: 'typescript',
  }),
]

export const tiptapEditorProps = {
  attributes: {
    class: 'tiptap-editor focus:outline-none',
    spellcheck: 'true',
  },
  clipboardTextSerializer: serializeProseMirrorFragmentToPlainText,
}
