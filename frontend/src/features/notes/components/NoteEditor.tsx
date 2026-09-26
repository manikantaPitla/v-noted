import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { getTiptapExtensions, tiptapEditorProps } from "@/lib/tiptap";
import { Note, NoteViewer, UpdateNoteDto } from "../types/note.types";
import { useUpdateNote } from "../hooks/useUpdateNote";
import { useDeleteNote } from "../hooks/useDeleteNote";
import { notesApi } from "../api/notes.api";
import { extractTextFromJson } from "../utils/note.utils";
import { CategorySelector } from "./CategorySelector";
import { TagEditor } from "./TagEditor";
import { formatFullDate } from "@/utils/formatDate";
import { AUTOSAVE_DELAY } from "@/utils/constants";
import { useUIStore } from "@/store/ui.store";
import { usePreferences } from "@/store/preferences.store";
import { useToast } from "@/app/providers/ToastProvider";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Modal } from "@/components/ui/modal";
import { userAvatar } from "@/assets/images";
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
  Copy,
  Download,
  FileText,
  FileType,
  FileType2,
  Users,
  Strikethrough,
  Highlighter,
  Quote,
  Minus,
  Undo,
  Redo,
  X,
  MoreVertical,
  ChevronRight,
  Type,
  QrCode,
  ExternalLink,
  Link,
  Loader2
} from "lucide-react";
import * as DD from "@/components/ui/dropdown-menu";

interface NoteEditorProps {
  note: Note;
}

type SaveStatus = "idle" | "saving" | "saved";

export function NoteEditor({ note }: NoteEditorProps) {
  const { mutate: updateNote, isPending: isUpdating } = useUpdateNote();
  const { mutate: deleteNote, isPending: isDeleting } = useDeleteNote();
  const setSelectedNoteId = useUIStore((s) => s.setSelectedNoteId);
  const { autoSave } = usePreferences();
  const { success, error: toastError } = useToast();
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [viewers, setViewers] = useState<NoteViewer[]>([]);
  const [copied, setCopied] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  const [title, setTitle] = useState(note.title);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef(note.title);
  const noteIdRef = useRef(note.id);

  const shareUrl = `${window.location.origin}/shared/${note.user_id}/${note.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=10&data=${encodeURIComponent(shareUrl)}`;

  const togglePublic = () => {
    const is_public = !note.is_public;
    updateNote({ id: note.id, dto: { is_public } }, { onSuccess: () => success(is_public ? "Sharing enabled" : "Sharing disabled") });
  };

  const copyShareLink = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        success("Link copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const getExportTitle = () => (titleRef.current || "Untitled Note").trim();
  const getExportFileBase = () =>
    getExportTitle()
      .replace(/[\\/:*?"<>|]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 80) || "untitled-note";

  const exportNote = async (id: string, format: string) => {
    setDownloadingFormat(format);
    try {
      const token = localStorage.getItem("v_noted_token");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/notes/${id}/export?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Export failed");
      const data = await response.json();
      const byteCharacters = atob(data.base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: data.contentType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.fileName || `${getExportFileBase()}.${format === "word" ? "docx" : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      success(`${format.toUpperCase()} downloaded`);
    } catch (err) {
      console.error("Export failed:", err);
      toastError(`Failed to download ${format.toUpperCase()}. Please try again.`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const exportAsText = () => exportNote(note.id, "txt");
  const exportAsWord = () => exportNote(note.id, "word");
  const exportAsPdf = () => exportNote(note.id, "pdf");

  useEffect(() => {
    setTitle(note.title);
    titleRef.current = note.title;
    noteIdRef.current = note.id;
    setSaveStatus("idle");
    editor?.commands.setContent(note.content_json || { type: "doc", content: [] });
  }, [note.id]);

  useEffect(() => {
    if (!note.is_public) { setViewers([]); return; }
    const loadViewers = () => { notesApi.getViewers(note.id).then(setViewers).catch(console.warn); };
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
        updateNote({ id: noteIdRef.current, dto }, {
          onSuccess: () => { setSaveStatus("saved"); setTimeout(() => setSaveStatus("idle"), 2000); },
        });
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
    updateNote({ id: noteIdRef.current, dto: { title: titleRef.current, content_json, content_text } }, {
      onSuccess: () => { setSaveStatus("saved"); setTimeout(() => setSaveStatus("idle"), 2000); },
    });
  };

  const handleDelete = () => { deleteNote(note.id); success("Note deleted"); setSelectedNoteId(null); };

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full bg-background relative">
      <div className="flex items-center gap-1 px-4 sm:px-6 py-2 border-b border-surface-border flex-wrap min-h-[52px]">
        {/* Core Formatting */}
        <div className="flex items-center gap-0.5 sm:gap-1">
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
        </div>

        <Divider />

        {/* Highlights & Code */}
        <div className="flex items-center gap-1">
          <DD.Root>
            <DD.Trigger asChild>
              <button className={`p-1.5 rounded-lg transition-all ${editor.isActive("highlight") ? "bg-accent/10 text-accent" : "text-text-muted hover:text-text-primary hover:bg-surface-active"}`} title="Highlight">
                <Highlighter size={14} />
              </button>
            </DD.Trigger>
            <DD.Content align="start" sideOffset={12} className="w-40 p-1">
              <div className="grid grid-cols-5 gap-1 p-1">
                <ColorButton color="#fef08a" onClick={() => editor.chain().focus().setHighlight({ color: "#fef08a" }).run()} />
                <ColorButton color="#bbf7d0" onClick={() => editor.chain().focus().setHighlight({ color: "#bbf7d0" }).run()} />
                <ColorButton color="#bfdbfe" onClick={() => editor.chain().focus().setHighlight({ color: "#bfdbfe" }).run()} />
                <ColorButton color="#e9d5ff" onClick={() => editor.chain().focus().setHighlight({ color: "#e9d5ff" }).run()} />
                <ColorButton color="#fecaca" onClick={() => editor.chain().focus().setHighlight({ color: "#fecaca" }).run()} />
              </div>
              <DD.Separator />
              <DD.Item onClick={() => editor.chain().focus().unsetHighlight().run()}><X size={14} /> Clear Highlight</DD.Item>
            </DD.Content>
          </DD.Root>
          <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline Code">
            <Code size={14} />
          </ToolbarButton>
        </div>

        <Divider />

        {/* Structure - Hidden on very small screens, moved to "Type" menu if needed? No, let's keep them and let them wrap */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="H1">
            <Heading1 size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="H2">
            <Heading2 size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="H3">
            <Heading3 size={14} />
          </ToolbarButton>
        </div>

        <Divider className="hidden xs:block" />

        <div className="flex items-center gap-0.5 sm:gap-1">
          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List">
            <List size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered List">
            <ListOrdered size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive("taskList")} title="Task List">
            <CheckSquare size={14} />
          </ToolbarButton>
        </div>

        <Divider className="hidden md:block" />

        <div className="hidden md:flex items-center gap-0.5 sm:gap-1">
          <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Quote">
            <Quote size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code Block">
            <Code2 size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Line">
            <Minus size={14} />
          </ToolbarButton>
        </div>

        {/* Undo / Redo */}
        <div className="hidden lg:flex items-center gap-0.5">
          <Divider />
          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
            <Undo size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
            <Redo size={14} />
          </ToolbarButton>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <LiveViewers viewers={viewers} />

          {saveStatus === "saving" && (
            <span className="flex items-center gap-1.5 text-xs animate-pulse-soft text-text-muted">
              <Clock size={15} />
              <span className="hidden sm:inline">Saving…</span>
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 animate-fade-in">
              <Check size={15} />
              <span className="hidden sm:inline">Saved</span>
            </span>
          )}

          {!autoSave && (
            <button onClick={handleManualSave} className="px-3 py-1 rounded-lg text-xs font-bold border border-surface-border bg-surface hover:bg-surface-active transition-all">
              Save
            </button>
          )}

          {/* Actions - Desktop */}
          <div className="hidden sm:flex items-center gap-1 pl-2 border-l border-surface-border">
            <DD.Root>
              <DD.Trigger asChild>
                <button className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-active transition-all">
                  <Download size={14} />
                </button>
              </DD.Trigger>
              <DD.Content align="end" sideOffset={12} className="w-40">
                <DD.Item onClick={exportAsPdf} disabled={downloadingFormat === "pdf"}>
                  {downloadingFormat === "pdf" ? <Loader2 size={15} className="animate-spin" /> : <FileType2 size={15} />} PDF
                </DD.Item>
                <DD.Item onClick={exportAsWord} disabled={downloadingFormat === "word"}>
                  {downloadingFormat === "word" ? <Loader2 size={15} className="animate-spin" /> : <FileType size={15} />} Word
                </DD.Item>
                <DD.Item onClick={exportAsText} disabled={downloadingFormat === "txt"}>
                  {downloadingFormat === "txt" ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />} Text
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
              <DD.Content align="end" sideOffset={12} className="w-64 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold text-text-primary">Share Note</h4>
                  <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${note.is_public ? "bg-emerald-500/10 text-emerald-500" : "bg-text-muted/10 text-text-muted"}`}>
                    {note.is_public ? "Public" : "Private"}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {note.is_public ? <Globe size={13} className="text-accent" /> : <Globe size={13} className="text-text-muted" />}
                    <span className="text-xs font-medium text-text-secondary">Link Sharing</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePublic(); }}
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
                        onClick={(e) => { e.stopPropagation(); copyShareLink(); }}
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
                      onClick={(e) => { e.stopPropagation(); setShowQrModal(true); }}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-surface-active text-text-secondary border border-surface-border rounded-xl text-xs font-bold hover:text-text-primary hover:bg-surface-hover transition-colors"
                    >
                      <QrCode size={13} /> Show QR Code
                    </button>
                    <p className="text-[10px] text-center text-text-muted">Anyone with the link can view this note.</p>
                  </div>
                )}
              </DD.Content>
            </DD.Root>

            <button onClick={() => setShowDeleteConfirm(true)} className="p-1.5 rounded-lg text-text-muted hover:text-destructive hover:bg-destructive/10 transition-all">
              <Trash2 size={14} />
            </button>
          </div>

          {/* Actions - Mobile */}
          <div className="sm:hidden">
            <DD.Root>
              <DD.Trigger asChild>
                <button className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-active transition-all">
                  <MoreVertical size={18} />
                </button>
              </DD.Trigger>
              <DD.Content align="end" sideOffset={12} className="w-48">
                <DD.Sub>
                  <DD.SubTrigger><Share2 size={15} /> Share Options <ChevronRight size={14} className="ml-auto opacity-50" /></DD.SubTrigger>
                  <DD.SubContent className="w-64 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-bold text-text-primary">Share Note</h4>
                      <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${note.is_public ? "bg-emerald-500/10 text-emerald-500" : "bg-text-muted/10 text-text-muted"}`}>
                        {note.is_public ? "Public" : "Private"}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Globe size={13} className={note.is_public ? "text-accent" : "text-text-muted"} />
                        <span className="text-xs font-medium text-text-secondary">Link Sharing</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePublic(); }}
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
                            onClick={(e) => { e.stopPropagation(); copyShareLink(); }}
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
                          onClick={(e) => { e.stopPropagation(); setShowQrModal(true); }}
                          className="w-full flex items-center justify-center gap-2 py-2 bg-surface-active text-text-secondary border border-surface-border rounded-xl text-xs font-bold hover:text-text-primary hover:bg-surface-hover transition-colors"
                        >
                          <QrCode size={13} /> Show QR Code
                        </button>
                        <p className="text-[10px] text-center text-text-muted">Anyone with the link can view this note.</p>
                      </div>
                    )}
                  </DD.SubContent>
                </DD.Sub>
                <DD.Sub>
                  <DD.SubTrigger><Download size={15} /> Download <ChevronRight size={14} className="ml-auto opacity-50" /></DD.SubTrigger>
                  <DD.SubContent>
                    <DD.Item onClick={exportAsPdf} disabled={downloadingFormat === "pdf"}>
                      {downloadingFormat === "pdf" ? <Loader2 size={15} className="animate-spin" /> : <FileType2 size={15} />} PDF
                    </DD.Item>
                    <DD.Item onClick={exportAsWord} disabled={downloadingFormat === "word"}>
                      {downloadingFormat === "word" ? <Loader2 size={15} className="animate-spin" /> : <FileType size={15} />} Word
                    </DD.Item>
                    <DD.Item onClick={exportAsText} disabled={downloadingFormat === "txt"}>
                      {downloadingFormat === "txt" ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />} Text
                    </DD.Item>
                  </DD.SubContent>
                </DD.Sub>
                <DD.Separator />
                <DD.Item onClick={() => setShowDeleteConfirm(true)} className="text-destructive focus:text-destructive"><Trash2 size={15} /> Delete Note</DD.Item>
              </DD.Content>
            </DD.Root>
          </div>
        </div>
      </div>

      <ConfirmDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm} title="Delete Note" description="Are you sure you want to delete this note? This action cannot be undone." confirmLabel="Delete" variant="danger" onConfirm={handleDelete} />

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
            <span className="text-xs text-text-muted">{formatFullDate(note.updated_at)}</span>
            <div className="w-px h-3 bg-surface-border" />
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
      className={`p-1.5 rounded-lg transition-all ${disabled ? "opacity-30 cursor-not-allowed" : "text-text-muted hover:text-text-primary hover:bg-surface-active"}`}
      style={active ? { background: "var(--accent-muted)", color: "var(--accent)" } : {}}
    >
      {children}
    </button>
  );
}

function Divider({ className }: { className?: string }) {
  return <div className={`w-px h-5 mx-1.5 bg-surface-border flex-shrink-0 ${className}`} />;
}

function LiveViewers({ viewers }: { viewers: NoteViewer[] }) {
  if (viewers.length === 0) return null;
  return (
    <div className="flex items-center gap-2 rounded-full border border-surface-border bg-surface px-2.5 py-1">
      <Users size={14} className="text-emerald-400" />
      <div className="flex -space-x-2">
        {viewers.slice(0, 3).map((viewer) => (
          <img key={viewer.viewer_id} src={viewer.avatar || userAvatar} alt={viewer.name} className="h-6 w-6 rounded-full border-2 border-background object-cover" />
        ))}
      </div>
    </div>
  );
}

function ColorButton({ color, onClick }: { color: string; onClick: () => void }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }} className="w-6 h-6 rounded-md border border-surface-border hover:scale-110 transition-transform" style={{ backgroundColor: color }} />
  );
}
