import { useState, useEffect } from "react";
import { FileText, Hash, Home, Settings, X, Plus, Folder, Sun, Moon } from "lucide-react";
import { CategoryFilter } from "@/features/categories/components/CategoryFilter";
import { CategoryModal } from "@/features/categories/components/CategoryModal";
import { AddTagModal } from "@/features/tags/components/AddTagModal";
import { useTagsStore } from "@/features/tags/store/tags.store";
import { usePreferences } from "@/store/preferences.store";
import { useUIStore } from "@/store/ui.store";
import { useNotes } from "@/features/notes/hooks/useNotes";
import { useNavigate, useLocation } from "react-router-dom";
import { Logo } from "@/components/common/Logo";

export function Sidebar() {
  const { data: notes = [] } = useNotes();
  const activeTag = useUIStore((s) => s.activeTag);
  const setActiveTag = useUIStore((s) => s.setActiveTag);
  const activeCategory = useUIStore((s) => s.activeCategory);
  const setActiveCategory = useUIStore((s) => s.setActiveCategory);
  const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen);
  const { theme, setTheme } = usePreferences();
  const navigate = useNavigate();
  const location = useLocation();

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddTag, setShowAddTag] = useState(false);

  const { tags: allTags, addTag, isLoading: isTagsLoading } = useTagsStore();
  const hasFilters = activeTag || activeCategory;

  // Restore active category from URL ?tab= param on mount / URL change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab && tab !== activeCategory) {
      setActiveCategory(tab as any);
    } else if (!tab && activeCategory) {
      setActiveCategory(null);
    }
  }, [location.search]);

  // Deduplicate tags for a clean UI
  const uniqueTags = Array.from(new Set(allTags)).filter((t) => t && t.trim() !== "");

  const clearFilters = () => {
    setActiveTag(null);
    setActiveCategory(null);
    const params = new URLSearchParams(location.search);
    params.delete("tab");
    const qs = params.toString();
    navigate(qs ? `/?${qs}` : "/");
  };

  return (
    <aside className="flex flex-col h-full border-r border-surface-border bg-background-secondary select-none">
      {/* Logo */}
      <header className="flex items-center px-5 py-4 border-b border-surface-border">
        <Logo variant="dashboard" />
      </header>

      {/* All Notes */}
      <nav className="px-3 py-3 border-b border-surface-border">
        <button id="nav-all-notes" onClick={() => clearFilters()} className={`sidebar-item w-full ${location.pathname === "/" && !hasFilters ? "active" : ""}`}>
          <Home size={15} />
          <span>All Notes</span>
          <span className="ml-auto text-[10px] text-text-muted">{notes.length}</span>
        </button>
      </nav>

      <div className="flex-1 flex flex-col min-h-0">
        {/* Categories Section */}
        <div className="flex flex-col max-h-[45%] border-b border-surface-border">
          <div className="px-6 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Folder size={12} className="text-text-muted" />
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.1em] mt-0.5">Categories</p>
            </div>
            <button onClick={() => setShowAddCategory(true)} className="p-1 rounded-md text-text-muted hover:text-accent hover:bg-accent-subtle transition-colors group" title="Add Category">
              <Plus size={14} className="transition-transform group-hover:scale-110" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-4 custom-scrollbar">
            <CategoryFilter />
          </div>
        </div>

        {/* Tags Section */}
        <div className="flex flex-col flex-1 min-h-0">
          <div className="px-6 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Hash size={12} className="text-text-muted" />
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.1em] mt-0.5">Tags</p>
            </div>
            <button onClick={() => setShowAddTag(true)} className="p-1 rounded-md text-text-muted hover:text-accent hover:bg-accent-subtle transition-colors group" title="Add Tag">
              <Plus size={14} className="transition-transform group-hover:scale-110" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
            {isTagsLoading ? (
              <div className="flex flex-wrap gap-1.5">
                {[45, 60, 50, 70, 40, 55].map((width, i) => (
                  <div key={i} className="skeleton h-5 rounded-full" style={{ width: `${width}px`, opacity: 1 - i * 0.1 }} />
                ))}
              </div>
            ) : uniqueTags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {uniqueTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setActiveTag(activeTag === tag ? null : tag);
                      setMobileSidebarOpen(false);
                    }}
                    className={`tag-pill ${activeTag === tag ? "border-accent/60 text-accent bg-accent-subtle" : ""}`}
                  >
                    <Hash size={9} />
                    {tag}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted">No tags yet</p>
            )}
          </div>
        </div>

        {hasFilters && (
          <div className="px-6 py-3 pb-6 flex-shrink-0">
            <button onClick={clearFilters} className="flex items-center gap-2 text-xs font-medium text-text-muted hover:text-text-primary transition-colors">
              <X size={12} />
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Settings & Theme */}
      <div className="px-3 py-3 border-t border-surface-border flex items-center gap-1">
        <button
          id="nav-settings"
          onClick={() => {
            navigate("/settings");
            setMobileSidebarOpen(false);
          }}
          className={`sidebar-item flex-1 ${location.pathname === "/settings" ? "active" : ""}`}
        >
          <Settings size={15} />
          <span>Settings</span>
        </button>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>

      {/* Modals */}
      <CategoryModal open={showAddCategory} onOpenChange={setShowAddCategory} />
      <AddTagModal open={showAddTag} onOpenChange={setShowAddTag} />
    </aside>
  );
}
