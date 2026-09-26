import { useAuth } from "@/features/auth/hooks/useAuth";
import { useNotes } from "@/features/notes/hooks/useNotes";
import { useCategoriesStore } from "@/features/categories/store/categories.store";
import { LogOut, FileText, Layers, Mail, User, ArrowLeft } from "lucide-react";
import { userAvatar } from "@/assets/images";
import { useState } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useNavigate } from "react-router-dom";

export function ProfilePage() {
  const { user, logout } = useAuth();
  const { data: notes = [] } = useNotes();
  const { categories } = useCategoriesStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="max-w-xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors">
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-xl font-bold text-text-primary">Profile</h1>
        </div>

        {/* Profile Content Container */}
        <div className="flex flex-col gap-4">
          {/* Avatar + info */}
          <div className="bg-surface border border-surface-border rounded-2xl p-6 flex items-center gap-5">
            <div className="p-1 rounded-full bg-surface-active border border-surface-border/50">
              <img
                src={user?.avatar || userAvatar}
                alt={user?.name}
                className="w-16 h-16 rounded-full bg-background object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = userAvatar;
                }}
              />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary mb-0.5">{user?.name}</h2>
              <p className="text-sm text-text-muted">{user?.email}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard icon={<FileText size={18} className="text-accent" />} label="Total Notes" value={notes.length} />
            <StatCard icon={<Layers size={18} className="text-emerald-400" />} label="Categories" value={categories.length} />
          </div>

          {/* Account */}
          <div className="bg-surface border border-surface-border rounded-2xl p-5 space-y-4">
            <InfoRow icon={<User size={14} />} label="Name" value={user?.name || "—"} />
            <InfoRow icon={<Mail size={14} />} label="Email" value={user?.email || "—"} />
          </div>

          {/* Logout */}
          <button
            id="profile-logout-btn"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-destructive border border-destructive/30 hover:bg-destructive/10 transition-all duration-200"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>

        <ConfirmDialog
          open={showLogoutConfirm}
          onOpenChange={setShowLogoutConfirm}
          title="Sign Out"
          description="Are you sure you want to sign out of your account?"
          confirmLabel="Logout"
          onConfirm={logout}
        />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-surface border border-surface-border rounded-2xl p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-surface-hover flex items-center justify-center">{icon}</div>
      <div>
        <p className="text-xl font-bold text-text-primary">{value}</p>
        <p className="text-xs text-text-muted">{label}</p>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-text-muted">{icon}</span>
      <span className="text-xs text-text-muted w-16">{label}</span>
      <span className="text-sm text-text-primary">{value}</span>
    </div>
  );
}
