import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import { getTiptapExtensions, tiptapEditorProps } from "@/lib/tiptap";
import { notesApi } from "@/features/notes/api/notes.api";
import { Note } from "@/features/notes/types/note.types";
import { formatFullDate } from "@/utils/formatDate";
import { FileText, Loader2, Globe } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ProfileDropdown } from "@/features/auth/components/ProfileDropdown";
import { defaultUser } from "@/assets/images";

export function SharedNotePage() {
  const { userId, noteId } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();

  const editor = useEditor({
    extensions: getTiptapExtensions(),
    editorProps: {
      ...tiptapEditorProps,
      attributes: {
        ...tiptapEditorProps.attributes,
        class: `${tiptapEditorProps.attributes.class} prose prose-sm max-w-none`,
      },
    },
    editable: false,
    content: null,
  });

  useEffect(() => {
    async function loadNote() {
      if (!userId || !noteId) return;
      try {
        const data = await notesApi.getShared(noteId, userId);
        setNote(data);
        editor?.commands.setContent(data.content_json);
      } catch (err) {
        console.error("Failed to load shared note:", err);
        setError("This note is private or does not exist.");
      } finally {
        setIsLoading(false);
      }
    }
    loadNote();
  }, [userId, noteId, editor]);

  useEffect(() => {
    if (!userId || !noteId || !note) return;

    const getGuestViewer = () => {
      const key = "v_noted_guest_viewer";
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored) as { viewer_id: string; name: string };

      const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
      const guest = {
        viewer_id: `guest-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`,
        name: `Guest ${suffix}`,
      };
      localStorage.setItem(key, JSON.stringify(guest));
      return guest;
    };

    const viewer = user
      ? {
          viewer_id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        }
      : getGuestViewer();

    const heartbeat = () => {
      notesApi.heartbeatPresence(noteId, userId, viewer).catch((err) => {
        console.warn("Failed to update viewer presence:", err);
      });
    };

    heartbeat();
    const interval = window.setInterval(heartbeat, 15000);
    return () => window.clearInterval(interval);
  }, [userId, noteId, note, user]);

  if (isLoading) {
    return (
      <div className="flex gap-2 items-center justify-center h-screen bg-background">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
        <span className="text-sm text-text-muted">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Always Visible */}
      <header className="px-6 py-4 border-b border-surface-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-accent/10 border border-accent/20">
              <FileText size={16} className="text-accent" />
            </div>
            <div>
              <p className="text-xs font-bold text-text-primary uppercase tracking-tighter">Shared Note</p>
              <p className="text-[10px] text-text-muted">Viewing in read-only mode</p>
            </div>
          </div>
          {isAuthenticated ? (
            <ProfileDropdown />
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-1.5 text-xs font-bold text-accent hover:bg-accent/10 transition-all px-4 py-1.5 rounded-xl border border-accent/20"
            >
              Login
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {!note || error ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center bg-surface border border-surface-border mb-6">
              <Globe size={24} className="text-text-muted" />
            </div>
            <h1 className="text-xl font-bold text-text-primary mb-2">Note Not Available</h1>
            <p className="text-sm text-text-muted max-w-xs mb-8">{error || "This note is private or does not exist."}</p>
            <button onClick={() => navigate("/")} className="px-6 py-2 bg-accent text-white rounded-xl font-bold hover:bg-accent-hover transition-all">
              Go to Home
            </button>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-6 py-10">
            <h1 className="text-3xl font-bold text-text-primary mb-4 tracking-tight">{note.title || "Untitled Note"}</h1>

            <div className="flex items-center gap-2 mb-8">
              <span className="text-xs text-text-muted">{formatFullDate(note.updated_at)}</span>
              {note.owner_profile?.name && (
                <>
                  <span className="text-xs text-text-muted">by</span>
                  <div className="relative group/owner">
                    <button className="text-xs font-semibold text-accent hover:underline">{note.owner_profile.name}</button>
                    <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-64 rounded-2xl border border-surface-border bg-surface-elevated p-3 opacity-0 shadow-panel transition-opacity group-hover/owner:opacity-100">
                      <div className="flex items-center gap-3">
                        <img
                          src={note.owner_profile.avatar || defaultUser}
                          alt={note.owner_profile.name}
                          className="h-10 w-10 rounded-2xl border border-surface-border bg-surface-active"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = defaultUser;
                          }}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-text-primary">{note.owner_profile.name}</p>
                          {note.owner_profile.email && <p className="mt-0.5 truncate text-[11px] text-text-muted">{note.owner_profile.email}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="tiptap-editor">
              <EditorContent editor={editor} />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-surface-border text-center">
        <p className="text-xs text-text-muted">
          Power by <span className="font-bold text-text-secondary">v-noted</span> — Your minimalist workspace.
        </p>
      </footer>
    </div>
  );
}
