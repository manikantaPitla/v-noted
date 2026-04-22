import { useAuth } from '@/features/auth/hooks/useAuth'
import { useNotes } from '@/features/notes/hooks/useNotes'
import { useCategoriesStore } from '@/features/categories/store/categories.store'
import { LogOut, FileText, Layers, Mail, User } from 'lucide-react'
import { defaultUser } from '@/assets/images'

export function ProfilePage() {
  const { user, logout } = useAuth()
  const { data: notes = [] } = useNotes()
  const { categories } = useCategoriesStore()

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="max-w-xl mx-auto px-6 py-10">
        <h1 className="text-xl font-bold text-text-primary mb-8">Profile</h1>

        {/* Avatar + info */}
        <div className="bg-surface border border-surface-border rounded-2xl p-6 mb-4 flex items-center gap-5">
          <img
            src={user?.avatar || defaultUser}
            alt={user?.name}
            className="w-16 h-16 rounded-2xl bg-surface-active"
            onError={(e) => {
              (e.target as HTMLImageElement).src = defaultUser
            }}
          />
          <div>
            <h2 className="text-base font-semibold text-text-primary mb-0.5">{user?.name}</h2>
            <p className="text-sm text-text-muted">{user?.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatCard icon={<FileText size={18} className="text-accent" />} label="Total Notes" value={notes.length} />
          <StatCard icon={<Layers size={18} className="text-emerald-400" />} label="Categories" value={categories.length} />
        </div>

        {/* Account */}
        <div className="bg-surface border border-surface-border rounded-2xl p-4 mb-6 space-y-3">
          <InfoRow icon={<User size={14} />} label="Name" value={user?.name || '—'} />
          <InfoRow icon={<Mail size={14} />} label="Email" value={user?.email || '—'} />
        </div>

        {/* Logout */}
        <button
          id="profile-logout-btn"
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors"
        >
          <LogOut size={15} />Sign out
        </button>
      </div>
    </div>
  )
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
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-text-muted">{icon}</span>
      <span className="text-xs text-text-muted w-16">{label}</span>
      <span className="text-sm text-text-primary">{value}</span>
    </div>
  )
}
