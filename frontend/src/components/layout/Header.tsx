import { Plus, Menu } from "lucide-react";
import { SearchBar } from "@/features/search/components/SearchBar";
import { ProfileDropdown } from "@/features/auth/components/ProfileDropdown";
import { useCreateNote } from "@/features/notes/hooks/useCreateNote";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useUIStore } from "@/store/ui.store";
import { usePreferences } from "@/store/preferences.store";
import { useLocation } from "react-router-dom";

export function Header() {
  const { mutate: createNote, isPending } = useCreateNote();
  const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen);
  const activeCategory = useUIStore((s) => s.activeCategory);
  const { defaultCategory } = usePreferences();
  const location = useLocation();

  const handleNewNote = () => {
    const category = activeCategory ?? defaultCategory;
    createNote({
      title: "",
      content_json: { type: "doc", content: [{ type: "paragraph" }] },
      content_text: "",
      category,
      tags: [],
    });
  };

  useKeyboard({ key: "n", ctrl: true }, handleNewNote);

  return (
    <header className="flex items-center gap-3 px-4 py-2.5 border-b border-surface-border bg-background-secondary">
      {/* Mobile hamburger */}
      <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors flex-shrink-0">
        <Menu size={18} />
      </button>

      {/* Search — grows */}
      <div className="flex-1 min-w-0">
        <SearchBar />
      </div>

      {/* New Note */}
      <button
        id="new-note-btn"
        onClick={handleNewNote}
        disabled={isPending}
        className="
          flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium text-sm
          bg-accent hover:bg-accent-hover text-white
          transition-all duration-200 shadow-glow hover:shadow-none hover:scale-[0.98]
          disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0
        "
        title="New Note (Ctrl+N)"
      >
        <Plus size={15} />
        <span className="hidden sm:inline">New Note</span>
      </button>

      {/* Profile — always far right */}
      <ProfileDropdown />
    </header>
  );
}
