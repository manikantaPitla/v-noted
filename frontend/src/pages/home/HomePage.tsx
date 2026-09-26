import { noteBanner } from "@/assets/images";
import { useUIStore } from "@/store/ui.store";
import { useNotes } from "@/features/notes/hooks/useNotes";
import { NotesList } from "@/features/notes/components/NotesList";
import { NoteEditor } from "@/features/notes/components/NoteEditor";
import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

export function HomePage() {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const selectedNoteId = useUIStore((s) => s.selectedNoteId);
  const setSelectedNoteId = useUIStore((s) => s.setSelectedNoteId);
  const mobilePanelView = useUIStore((s) => s.mobilePanelView);
  const setMobilePanelView = useUIStore((s) => s.setMobilePanelView);
  const { data: notes = [] } = useNotes();

  const prevNoteId = useRef<string | undefined>(noteId);

  useEffect(() => {
    const prev = prevNoteId.current;
    prevNoteId.current = noteId;

    if (noteId && noteId !== selectedNoteId) {
      setSelectedNoteId(noteId);
      setMobilePanelView("editor");
    } else if (!noteId && prev) {
      setSelectedNoteId(null);
      setMobilePanelView("list");
    }
  }, [noteId]);

  const selectedNote = notes.find((n) => n.id === (noteId || selectedNoteId));

  return (
    <div className="flex flex-1 overflow-hidden bg-background">
      <h1 className="sr-only">v-noted Dashboard</h1>
      {/* Notes List Panel */}
      <div
        className={`
          flex flex-col border-r border-surface-border bg-background
          w-full md:w-72 lg:w-80 xl:w-96 flex-shrink-0
          ${mobilePanelView === "editor" && selectedNote ? "hidden md:flex" : "flex"}
        `}
      >
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-border">
          <h2 className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">Notes</h2>
        </div>
        <NotesList />
      </div>

      {/* Editor Panel */}
      <div
        className={`
          flex-1 flex flex-col overflow-hidden bg-background
          ${mobilePanelView === "list" && !selectedNote ? "hidden md:flex" : "flex"}
        `}
      >
        {selectedNote ? (
          <>
            <div className="md:hidden flex items-center px-4 py-2 border-b border-surface-border">
              <button onClick={() => navigate("/")} className="text-xs font-medium text-accent hover:underline">
                ← Back to notes
              </button>
            </div>
            <NoteEditor key={selectedNote.id} note={selectedNote} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-0 text-center px-8 animate-fade-in">
            <div className="w-56 h-36 flex items-center justify-center overflow-hidden">
              <img src={noteBanner} alt="Note Banner" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-text-primary mb-2 tracking-tight">Select a note to read</h3>
              <p className="text-sm text-text-muted max-w-[240px] mx-auto leading-relaxed">
                Choose a note from the sidebar or press <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded-lg bg-surface-active border border-surface-border font-bold">Ctrl+N</kbd> to create a new one
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
