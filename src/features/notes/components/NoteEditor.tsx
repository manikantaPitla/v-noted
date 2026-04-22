import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { getTiptapExtensions, tiptapEditorProps } from "@/lib/tiptap";
import { Note, UpdateNoteDto } from "../types/note.types";
import { useUpdateNote } from "../hooks/useUpdateNote";
import { useDeleteNote } from "../hooks/useDeleteNote";
import { extractTextFromJson } from "../utils/note.utils";
import { CategorySelector } from "./CategorySelector";
import { TagEditor } from "./TagEditor";
import { formatFullDate } from "@/utils/formatDate";
import { AUTOSAVE_DELAY } from "@/utils/constants";
import { useUIStore } from "@/store/ui.store";
import { usePreferences } from "@/store/preferences.store";
import { useToast } from "@/app/providers/ToastProvider";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  Bold,
  Italic,
  Underline,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code2,
  Trash2,
  CheckSquare,
  Check,
  Clock,
  Share2,
  Globe,
  Link,
  Copy,
  Strikethrough,
  Highlighter,
  Quote,
  Minus,
  Undo,
  Redo,
} from "lucide-react";
import * as DD from "@/components/ui/dropdown-menu";

interface NoteEditorProps {
  note: Note;
}

type SaveStatus = "idle" | "saving" | "saved";

export function NoteEditor({ note }: NoteEditorProps) {
  const { mutate: updateNote } = useUpdateNote();
  const { mutate: deleteNote, isPending: isDeleting } = useDeleteNote();
  const setSelectedNoteId = useUIStore((s) => s.setSelectedNoteId);
  const { autoSave } = usePreferences();
  const { success } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [title, setTitle] = useState(note.title);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef(note.title);
  const noteIdRef = useRef(note.id);

  const shareUrl = `${window.location.origin}/shared/${note.user_id}/${note.id}`;

  const togglePublicSharing = () => {
    const is_public = !note.is_public;
    updateNote({ id: note.id, dto: { is_public } }, { onSuccess: () => success(is_public ? "Sharing enabled" : "Sharing disabled") });
  };

  const copyShareLink = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
        success("Link copied to clipboard");
      } else {
        throw new Error("Clipboard API unavailable");
      }
    } catch (err) {
      console.warn("Clipboard API failed, trying fallback:", err);
      try {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        
        // Ensure textarea is off-screen but in DOM
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);
        
        if (successful) {
          success("Link copied to clipboard");
        } else {
          throw new Error("execCommand copy failed");
        }
      } catch (fallbackErr) {
        console.error("Copy failed:", fallbackErr);
        // Last resort: alert with the link so user can manual copy
        window.prompt("Could not copy automatically. Please copy the link below:", shareUrl);
      }
    }
  };

  useEffect(() => {
    setTitle(note.title);
    titleRef.current = note.title;
    noteIdRef.current = note.id;
    setSaveStatus("idle");
    editor?.commands.setContent(note.content_json || { type: "doc", content: [] });
  }, [note.id]);

  const scheduleAutoSave = useCallback(
    (dto: UpdateNoteDto) => {
      if (!autoSave) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaveStatus("saving");
      saveTimer.current = setTimeout(() => {
        updateNote(
          { id: noteIdRef.current, dto },
          {
            onSuccess: () => {
              setSaveStatus("saved");
              setTimeout(() => setSaveStatus("idle"), 2000);
            },
          },
        );
      }, AUTOSAVE_DELAY);
    },
    [updateNote, autoSave],
  );

  const editor = useEditor({
    extensions: getTiptapExtensions("Write something amazing…"),
    content: note.content_json || { type: "doc", content: [] },
    editorProps: tiptapEditorProps,
    onUpdate: ({ editor }) => {
      const content_json = editor.getJSON() as Record<string, unknown>;
      const content_text = extractTextFromJson(content_json);
      scheduleAutoSave({ title: titleRef.current, content_json, content_text });
    },
    autofocus: "end",
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    titleRef.current = newTitle;
    const content_json = editor?.getJSON() as Record<string, unknown>;
    const content_text = extractTextFromJson(content_json || {});
    scheduleAutoSave({ title: newTitle, content_json, content_text });
  };

  const handleManualSave = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const content_json = editor?.getJSON() as Record<string, unknown>;
    const content_text = extractTextFromJson(content_json || {});
    updateNote(
      { id: noteIdRef.current, dto: { title: titleRef.current, content_json, content_text } },
      {
        onSuccess: () => {
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2000);
        },
      },
    );
  };

  const handleDelete = () => {
    deleteNote(note.id);
    success("Note deleted");
    setSelectedNoteId(null);
  };

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full bg-background relative">
      <div className="flex items-center gap-1 px-6 py-1.5 border-b border-surface-border flex-wrap">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
          <Bold size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
          <Italic size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
          <Underline size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
          <Strikethrough size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Code">
          <Code size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")} title="Highlight">
          <Highlighter size={14} />
        </ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="H1">
          <Heading1 size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="H2">
          <Heading2 size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="H3">
          <Heading3 size={14} />
        </ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List">
          <List size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered List">
          <ListOrdered size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive("taskList")} title="Task List">
          <CheckSquare size={14} />
        </ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Quote">
          <Quote size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code Block">
          <Code2 size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
          <Minus size={14} />
        </ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo" disabled={!editor.can().undo()}>
          <Undo size={14} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo" disabled={!editor.can().redo()}>
          <Redo size={14} />
        </ToolbarButton>

        <div className="ml-auto flex items-center gap-2">
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1.5 text-xs animate-pulse-soft" style={{ color: "var(--text-muted)" }}>
              <Clock size={12} />
              Saving…
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 animate-fade-in">
              <Check size={12} />
              Saved
            </span>
          )}
          {!autoSave && (
            <button
              onClick={handleManualSave}
              className="px-3 py-1 rounded-lg text-xs font-medium border transition-all"
              style={{ borderColor: "var(--surface-border)", color: "var(--text-secondary)", background: "var(--surface-hover)" }}
            >
              Save
            </button>
          )}

          <DD.Root>
            <DD.Trigger asChild>
              <button
                className="p-1 rounded-lg transition-all duration-150 data-[state=open]:bg-accent/10 data-[state=open]:text-accent text-text-muted hover:text-text-primary hover:bg-surface-active"
                title="Share note"
              >
                <Share2 size={14} />
              </button>
            </DD.Trigger>

            <DD.Content align="end" sideOffset={12} className="w-64 p-4 bg-surface border border-surface-border rounded-2xl shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-text-primary">Share Note</h4>
                <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${note.is_public ? "bg-emerald-500/10 text-emerald-500" : "bg-text-muted/10 text-text-muted"}`}>
                  {note.is_public ? "Public" : "Private"}
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-surface-active border border-surface-border mb-4">
                <div className="flex items-center gap-2">
                  <Globe size={14} className="text-text-muted" />
                  <span className="text-[11px] font-medium text-text-secondary">Link Sharing</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePublicSharing();
                  }}
                  className={`relative inline-flex h-4 w-9 items-center rounded-full transition-colors ${note.is_public ? "bg-accent" : "bg-surface-active border border-surface-border"}`}
                >
                  <span className={`inline-block h-3 w-3 rounded-full bg-white transition-transform ${note.is_public ? "translate-x-5" : "translate-x-1"}`} />
                </button>
              </div>

              {note.is_public && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-surface border border-surface-border truncate">
                    <Link size={12} className="text-text-muted flex-shrink-0" />
                    <span className="text-[10px] text-text-muted truncate select-all">{shareUrl}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyShareLink();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-1.5 bg-accent text-white rounded-xl text-xs font-bold hover:bg-accent-hover transition-colors"
                  >
                    <Copy size={12} /> Copy Link
                  </button>
                  <p className="text-[10px] text-center text-text-muted">Anyone with the link can view this note.</p>
                </div>
              )}
            </DD.Content>
          </DD.Root>

          <button
            id="delete-note-btn"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
            className="p-1 rounded-lg transition-all duration-150 hover:bg-red-500/10"
            style={{ color: "var(--text-muted)" }}
            title="Delete note"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Note"
        description="Are you sure you want to delete this note? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl px-6 py-4">
          <input
            id="note-title-input"
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Note title…"
            className="w-full text-xl font-bold bg-transparent outline-none border-none resize-none mb-1"
            style={{ color: "var(--text-primary)" }}
          />
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {formatFullDate(note.updated_at)}
            </span>
            <div className="w-px h-3" style={{ background: "var(--surface-border)" }} />
            <CategorySelector note={note} />
            <TagEditor note={note} />
          </div>
          <EditorContent editor={editor} className="min-h-[400px]" />
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({ children, onClick, active, title, disabled }: { children: React.ReactNode; onClick: () => void; active?: boolean; title?: string; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`p-1 rounded-lg transition-all duration-150 ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
      style={active ? { background: "var(--accent-muted)", color: "var(--accent)" } : { color: "var(--text-muted)" }}
      onMouseEnter={(e) => {
        if (!active && !disabled) (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
      }}
      onMouseLeave={(e) => {
        if (!active && !disabled) (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
      }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-4 mx-1 flex-shrink-0" style={{ background: "var(--surface-border)" }} />;
}
