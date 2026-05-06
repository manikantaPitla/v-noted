import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Check, ArrowLeft } from "lucide-react";
import * as DD from "@/components/ui/dropdown-menu";
import { usePreferences } from "@/store/preferences.store";
import { useCategoriesStore } from "@/features/categories/store/categories.store";
import { CategoryManager } from "@/features/categories/components/CategoryManager";
import { TagManager } from "@/features/tags/components/TagManager";

import { notesApi } from "@/features/notes/api/notes.api";
import { tagsApi } from "@/features/tags/api/tags.api";
import { categoriesApi } from "@/features/categories/api/categories.api";
import { useTagsStore } from "@/features/tags/store/tags.store";
import { authApi } from "@/features/auth/api/auth.api";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { defaultUser } from "@/assets/images";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useToast } from "@/app/providers/ToastProvider";

export function SettingsPage() {
  const { autoSave, setAutoSave, defaultCategory, setDefaultCategory, theme, setTheme } = usePreferences();
  const { user } = useAuth();
  const { categories } = useCategoriesStore();
  const { tags: allTags } = useTagsStore();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleResetAccount = async () => {
    setIsResetting(true);
    try {
      await notesApi.resetAccount();
      success("Account reset successfully! Re-initializing your workspace...");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error("Reset failed", err);
      error("Failed to reset account. Please try again later.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="max-w-xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors">
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-xl font-bold text-text-primary">Settings</h1>
        </div>

        {/* Profile Card */}
        <button
          onClick={() => navigate("/profile")}
          className="w-full bg-surface border border-surface-border rounded-2xl p-4 mb-6 flex items-center gap-4 hover:bg-surface-hover hover:border-surface-active transition-all duration-200 group/profile"
        >
          <div className="p-0.5 rounded-full bg-surface-active border border-surface-border/50 group-hover/profile:border-accent/30 transition-colors">
            <img
              src={user?.avatar || defaultUser}
              alt={user?.name}
              className="w-12 h-12 rounded-full bg-background object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = defaultUser;
              }}
            />
          </div>
          <div className="text-left">
            <h2 className="text-sm font-bold text-text-primary group-hover/profile:text-accent transition-colors">{user?.name}</h2>
            <p className="text-xs text-text-muted">{user?.email}</p>
          </div>
        </button>

        <div className="flex flex-col gap-4">
          <Section id="settings2" title="Categories">
            <div className="p-1">
              <CategoryManager />
            </div>
          </Section>

          <Section id="settings3" title="Tags">
            <div className="p-1">
              <TagManager />
            </div>
          </Section>

          <div className="bg-surface border border-surface-border rounded-2xl p-5 space-y-5">
            <h2 className="text-sm font-bold text-text-primary">Preferences</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">App Theme</p>
                  <p className="text-xs text-text-muted mt-0.5">Switch between light and dark mode</p>
                </div>
                <div className="flex bg-surface-active border border-surface-border p-1 rounded-xl gap-1">
                  <button
                    onClick={() => setTheme("light")}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200
                      ${theme === "light" ? "bg-white text-black shadow-sm" : "text-text-muted hover:text-text-primary hover:bg-surface-hover"}
                    `}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200
                      ${theme === "dark" ? "bg-accent text-white shadow-sm" : "text-text-muted hover:text-text-primary hover:bg-surface-hover"}
                    `}
                  >
                    Dark
                  </button>
                  <button
                    onClick={() => setTheme("system")}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200
                      ${theme === "system" ? "bg-surface-elevated text-text-primary shadow-sm" : "text-text-muted hover:text-text-primary hover:bg-surface-hover"}
                    `}
                  >
                    System
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">Auto Save</p>
                  <p className="text-xs text-text-muted mt-0.5">Save notes automatically while typing</p>
                </div>
                <button
                  id="autosave-toggle"
                  onClick={() => setAutoSave(!autoSave)}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200
                    ${autoSave ? "bg-accent" : "bg-surface-active border border-surface-border"}
                  `}
                >
                  <span
                    className={`
                      pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200
                      ${autoSave ? "translate-x-6" : "translate-x-1"}
                    `}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">Default Category</p>
                  <p className="text-xs text-text-muted mt-0.5">Applied to new notes</p>
                </div>
                <DD.Root>
                  <DD.Trigger asChild>
                    <button
                      id="default-category-dropdown"
                      className="
                        flex items-center gap-2 px-3 py-2 bg-surface-active border border-surface-border rounded-xl text-sm text-text-primary 
                        hover:border-accent hover:bg-surface-active transition-all min-w-[120px] justify-between
                      "
                    >
                      <span className="truncate">{categories.find((c) => c.id === defaultCategory)?.name || categories.find((c) => c.name.toLowerCase() === "others")?.name || "Others"}</span>
                      <ChevronDown size={14} className="opacity-50 shrink-0" />
                    </button>
                  </DD.Trigger>
                  <DD.Content align="end" className="w-56 max-h-60 overflow-y-auto custom-scrollbar">
                    {categories.map((cat) => (
                      <DD.Item key={cat.id} onClick={() => setDefaultCategory(cat.id)} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
                          {cat.name}
                        </div>
                        {defaultCategory === cat.id && <Check size={12} className="text-accent" />}
                      </DD.Item>
                    ))}
                  </DD.Content>
                </DD.Root>
              </div>
            </div>
          </div>

          <div className="bg-destructive-muted/5 border border-surface-border rounded-2xl p-5 space-y-4 mt-4">
            <div>
              <h2 className="text-sm font-bold text-destructive">Danger Zone</h2>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                This action will permanently delete all your notes, categories, and tags. Your account will be reset to its initial state with default settings. Please be certain before proceeding, as
                this action is irreversible.
              </p>
            </div>

            <button
              onClick={() => setShowResetConfirm(true)}
              disabled={isResetting}
              className={`
                w-full py-2.5 rounded-xl border border-surface-border bg-destructive/10 text-destructive text-sm font-bold 
                transition-all duration-200
                ${isResetting ? "opacity-50 cursor-not-allowed" : "hover:bg-destructive hover:text-white"}
              `}
            >
              {isResetting ? "Resetting Account..." : "Reset Account Data"}
            </button>
          </div>
        </div>

        <ConfirmDialog
          open={showResetConfirm}
          onOpenChange={setShowResetConfirm}
          title="Reset Account Data"
          description="Are you absolutely sure? This will delete ALL your notes, categories, and tags forever. This action cannot be undone."
          confirmLabel={isResetting ? "Resetting..." : "Reset Everything"}
          variant="danger"
          onConfirm={handleResetAccount}
        />
      </div>
    </div>
  );
}

interface SectionProps {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

function Section({ id, title, description, icon, children }: SectionProps) {
  return (
    <DD.Root>
      <DD.Trigger asChild>
        <button
          id={id}
          className="
            group w-full flex items-center justify-between px-5 py-4 rounded-2xl border transition-all duration-300
            bg-surface border-surface-border hover:bg-surface-hover hover:border-surface-active
            data-[state=open]:bg-accent-subtle data-[state=open]:border-accent data-[state=open]:shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)]
          "
        >
          <div className="flex items-center gap-3 flex-1">
            {icon && <div className="text-text-muted group-data-[state=open]:text-accent">{icon}</div>}
            <div className="text-left">
              <h2 className="text-sm font-bold text-text-primary group-data-[state=open]:text-accent">{title}</h2>
              {description && <p className="text-[10px] text-text-muted mt-0.5">{description}</p>}
            </div>
          </div>
          <ChevronDown size={14} className="text-text-muted transition-transform duration-500 data-[state=open]:rotate-180 data-[state=open]:text-accent" />
        </button>
      </DD.Trigger>

      <DD.Content
        align="center"
        sideOffset={8}
        className="w-[calc(var(--radix-dropdown-menu-trigger-width))] p-1 bg-surface-elevated border-surface-border backdrop-blur-xl max-h-[300px] overflow-y-auto custom-scrollbar"
      >
        {children}
      </DD.Content>
    </DD.Root>
  );
}
