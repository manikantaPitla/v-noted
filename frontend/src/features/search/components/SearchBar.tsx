import { useEffect, useRef } from "react";
import { Search, X, Command } from "lucide-react";
import { useSearch } from "@/features/search/hooks/useSearch";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useUIStore } from "@/store/ui.store";

export function SearchBar() {
  const { searchQuery, setSearchQuery, clearSearch } = useSearch();
  const isSearchOpen = useUIStore((s) => s.isSearchOpen);
  const setIsSearchOpen = useUIStore((s) => s.setIsSearchOpen);
  const inputRef = useRef<HTMLInputElement>(null);

  useKeyboard({ key: "k", ctrl: true }, () => {
    setIsSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  });

  useKeyboard({ key: "Escape" }, () => {
    if (isSearchOpen) clearSearch();
  });

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  return (
    <div className="relative flex-1 max-w-md">
      <div
        className={`
          flex items-center gap-2.5 px-3.5 py-2
          bg-surface border rounded-xl
          transition-all duration-200
          ${isSearchOpen || searchQuery ? "border-accent/40 bg-background ring-2 ring-accent/5" : "border-surface-border hover:border-surface-active hover:bg-surface-hover/50"}
        `}
      >
        <Search size={15} className={`transition-colors flex-shrink-0 ${isSearchOpen || searchQuery ? "text-accent" : "text-text-muted"}`} />

        <input
          ref={inputRef}
          id="search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsSearchOpen(true)}
          onBlur={() => !searchQuery && setIsSearchOpen(false)}
          placeholder="Search your notes…"
          className="
            flex-1 bg-transparent text-sm font-medium text-text-primary placeholder:text-text-placeholder
            outline-none min-w-0
          "
        />

        {searchQuery ? (
          <button onClick={clearSearch} className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-active transition-colors">
            <X size={14} strokeWidth={2.5} />
          </button>
        ) : (
          <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
            <kbd className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold font-mono text-text-muted bg-surface-active border border-surface-border rounded-lg shadow-sm">
              <Command size={9} />K
            </kbd>
          </div>
        )}
      </div>
    </div>
  );
}
