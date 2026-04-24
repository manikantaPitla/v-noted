import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { getTiptapExtensions, tiptapEditorProps } from "@/lib/tiptap";
import { Note, NoteViewer, UpdateNoteDto } from "../types/note.types";
import { useUpdateNote } from "../hooks/useUpdateNote";
import { useDeleteNote } from "../hooks/useDeleteNote";
import { notesApi } from "../api/notes.api";
import { extractTextFromJson, serializeNoteToPlainText } from "../utils/note.utils";
import { CategorySelector } from "./CategorySelector";
import { TagEditor } from "./TagEditor";
import { formatFullDate } from "@/utils/formatDate";
import { AUTOSAVE_DELAY } from "@/utils/constants";
import { useUIStore } from "@/store/ui.store";
import { usePreferences } from "@/store/preferences.store";
import { useToast } from "@/app/providers/ToastProvider";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Modal } from "@/components/ui/modal";
import { defaultUser } from "@/assets/images";
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
  Download,
  ExternalLink,
  FileText,
  FileType,
  Printer,
  QrCode,
  Users,
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
  const [showQrModal, setShowQrModal] = useState(false);
  const [viewers, setViewers] = useState<NoteViewer[]>([]);

  const [title, setTitle] = useState(note.title);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef(note.title);
  const noteIdRef = useRef(note.id);

  const shareUrl = `${window.location.origin}/shared/${note.user_id}/${note.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=10&data=${encodeURIComponent(shareUrl)}`;

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

  const getExportTitle = () => (titleRef.current || "Untitled Note").trim();
  const getExportFileBase = () =>
    getExportTitle()
      .replace(/[\\/:*?"<>|]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 80) || "untitled-note";

  const downloadBlob = (content: BlobPart, fileName: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const buildExportHtml = () => {
    const body = editor?.getHTML() || "";
    const escapedTitle = getExportTitle()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapedTitle}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; line-height: 1.6; margin: 40px; }
    h1, h2, h3 { line-height: 1.25; }
    pre { background: #f3f4f6; padding: 12px; border-radius: 6px; overflow-wrap: break-word; white-space: pre-wrap; }
    code { font-family: Consolas, monospace; }
    blockquote { border-left: 3px solid #d1d5db; margin-left: 0; padding-left: 14px; color: #4b5563; }
    ul, ol { padding-left: 24px; }
  </style>
</head>
<body>
  <h1>${escapedTitle}</h1>
  ${body}
</body>
</html>`;
  };

  const exportAsText = () => {
    const plainText = `${getExportTitle()}\n\n${serializeNoteToPlainText(editor?.getJSON() as Record<string, unknown>)}`;
    downloadBlob(plainText, `${getExportFileBase()}.txt`, "text/plain;charset=utf-8");
    success("Text file downloaded");
  };

  const exportAsWord = () => {
    downloadBlob(buildExportHtml(), `${getExportFileBase()}.doc`, "application/msword;charset=utf-8");
    success("Word file downloaded");
  };

  const exportAsHtml = () => {
    downloadBlob(buildExportHtml(), `${getExportFileBase()}.html`, "text/html;charset=utf-8");
    success("HTML file downloaded");
  };

  const exportAsPdf = () => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      window.alert("Please allow popups to export this note as PDF.");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(buildExportHtml());
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  useEffect(() => {
    setTitle(note.title);
    titleRef.current = note.title;
    noteIdRef.current = note.id;
    setSaveStatus("idle");
    editor?.commands.setContent(note.content_json || { type: "doc", content: [] });
  }, [note.id]);

  useEffect(() => {
    if (!note.is_public) {
      setViewers([]);
      return;
    }

    const loadViewers = () => {
      notesApi.getViewers(note.id)
        .then(setViewers)
        .catch((err) => console.warn("Failed to load note viewers:", err));
    };

    loadViewers();
    const interval = window.setInterval(loadViewers, 10000);
    return () => window.clearInterval(interval);
  }, [note.id, note.is_public]);

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
          <LiveViewers viewers={viewers} />

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
                title="Export note"
              >
                <Download size={14} />
              </button>
            </DD.Trigger>

            <DD.Content align="end" sideOffset={12} className="w-48">
              <DD.Label>Download</DD.Label>
              <DD.Item onClick={exportAsPdf}>
                <Printer size={14} className="opacity-70" />PDF
              </DD.Item>
              <DD.Item onClick={exportAsWord}>
                <FileType size={14} className="opacity-70" />Word
              </DD.Item>
              <DD.Item onClick={exportAsText}>
                <FileText size={14} className="opacity-70" />Plain text
              </DD.Item>
              <DD.Item onClick={exportAsHtml}>
                <Code size={14} className="opacity-70" />HTML
              </DD.Item>
            </DD.Content>
          </DD.Root>

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
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyShareLink();
                      }}
                      className="flex items-center justify-center gap-1.5 py-1.5 bg-accent text-white rounded-xl text-xs font-bold hover:bg-accent-hover transition-colors"
                    >
                      <Copy size={12} /> Copy
                    </button>
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 py-1.5 bg-surface-active text-text-secondary border border-surface-border rounded-xl text-xs font-bold hover:text-text-primary hover:bg-surface-hover transition-colors"
                    >
                      <ExternalLink size={12} /> Open
                    </a>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowQrModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-surface-active text-text-secondary border border-surface-border rounded-xl text-xs font-bold hover:text-text-primary hover:bg-surface-hover transition-colors"
                  >
                    <QrCode size={13} /> Show QR Code
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

      <Modal
        open={showQrModal}
        onOpenChange={setShowQrModal}
        title="Share QR Code"
        description="Scan this code to open the shared note link."
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-full rounded-2xl bg-white p-4">
            <img src={qrUrl} alt="QR code for shared note" className="mx-auto w-full max-w-[320px] aspect-square" />
          </div>
          <div className="grid w-full grid-cols-2 gap-2">
            <button
              onClick={copyShareLink}
              className="flex items-center justify-center gap-2 rounded-xl bg-accent px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-accent-hover"
            >
              <Copy size={13} /> Copy
            </button>
            <a
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-surface-border bg-surface-active px-3 py-2 text-xs font-bold text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
            >
              <ExternalLink size={13} /> Open
            </a>
          </div>
        </div>
      </Modal>

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

function LiveViewers({ viewers }: { viewers: NoteViewer[] }) {
  if (viewers.length === 0) return null;

  const visible = viewers.slice(0, 3);
  const overflow = viewers.length - visible.length;

  return (
    <div className="flex items-center gap-1.5 rounded-full border border-surface-border bg-surface px-2 py-1">
      <Users size={12} className="text-emerald-400" />
      <div className="flex -space-x-2">
        {visible.map((viewer) => (
          <div key={viewer.viewer_id} className="relative group/viewer">
            <img
              src={viewer.avatar || defaultUser}
              alt={viewer.name}
              className="h-6 w-6 rounded-full border-2 border-background bg-surface-active object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = defaultUser;
              }}
            />
            <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-surface-border bg-surface-elevated p-3 opacity-0 shadow-panel transition-opacity group-hover/viewer:opacity-100">
              <div className="flex items-center gap-3">
                <img
                  src={viewer.avatar || defaultUser}
                  alt={viewer.name}
                  className="h-10 w-10 rounded-2xl border border-surface-border bg-surface-active object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = defaultUser;
                  }}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-text-primary">{viewer.name}</p>
                  {viewer.email ? (
                    <p className="mt-0.5 truncate text-[11px] text-text-muted">{viewer.email}</p>
                  ) : (
                    <p className="mt-0.5 text-[11px] text-text-muted">Viewing this note</p>
                  )}
                  <p className="mt-1 text-[10px] font-semibold text-emerald-400">Live now</p>
                </div>
              </div>
            </div>
          </div>
        ))}
        {overflow > 0 && (
          <div className="flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-background bg-surface-active px-1 text-[10px] font-bold text-text-secondary">
            +{overflow}
          </div>
        )}
      </div>
    </div>
  );
}
