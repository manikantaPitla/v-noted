import { useNotes } from "../hooks/useNotes";
import { groupNotesByDate } from "../utils/note.utils";
import { NoteCard } from "./NoteCard";
import { Loader } from "@/components/common/Loader";
import { EmptyState } from "@/components/common/EmptyState";
import { useUIStore } from "@/store/ui.store";

export function NotesList() {
  const { data: notes = [], isLoading, isError } = useNotes();
  const searchQuery = useUIStore((s) => s.searchQuery);
  const activeCategory = useUIStore((s) => s.activeCategory);
  const activeTag = useUIStore((s) => s.activeTag);

  if (isLoading) return <Loader />;

  if (isError) {
    return <div className="flex items-center justify-center h-full p-8 text-text-muted text-sm">Failed to load notes. Please try again.</div>;
  }

  if (notes.length === 0) {
    return <EmptyState searchQuery={searchQuery} activeCategory={activeCategory} activeTag={activeTag} />;
  }

  const groups = groupNotesByDate(notes);

  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-6">
      {groups.map((group) => (
        <section key={group.label}>
          <h2 className="text-[10px] font-semibold text-text-muted uppercase tracking-widest px-1 mb-2">{group.label}</h2>
          <div className="space-y-1.5">
            {group.notes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
