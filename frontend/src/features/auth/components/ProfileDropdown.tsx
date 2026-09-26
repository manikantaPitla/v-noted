import { useAuth } from '@/features/auth/hooks/useAuth'
import { LogOut, Settings, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import * as DD from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useState } from 'react'
import { userAvatar } from '@/assets/images'

export function ProfileDropdown() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  return (
    <DD.Root>
      <DD.Trigger asChild>
        <button
          id="profile-dropdown-btn"
          className="flex items-center gap-1.5 p-1 rounded-full hover:bg-surface-hover transition-all duration-200 outline-none border border-transparent hover:border-surface-border"
        >
          <img
            src={user?.avatar || userAvatar}
            alt={user?.name}
            className="w-7 h-7 rounded-full bg-surface-active flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = userAvatar
            }}
          />
        </button>
      </DD.Trigger>

      <DD.Content align="end" className="w-64">
        {/* User info */}
        <div className="px-3 py-3 border-b border-surface-border rounded-t-xl bg-background-secondary">
          <div className="flex items-center gap-3">
            <img
              src={user?.avatar || userAvatar}
              alt={user?.name}
              className="w-10 h-10 rounded-2xl bg-surface-active flex-shrink-0 border border-surface-border"
              onError={(e) => {
                (e.target as HTMLImageElement).src = userAvatar
              }}
            />
            <div className="min-w-0">
              <p className="text-sm font-bold text-text-primary truncate leading-tight">{user?.name}</p>
              <p className="text-[11px] text-text-muted truncate mt-0.5">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <div className="py-1">
          <DD.Item onClick={() => navigate('/profile')}>
            <User size={14} className="opacity-70" />Profile
          </DD.Item>
          <DD.Item onClick={() => navigate('/settings')}>
            <Settings size={14} className="opacity-70" />Settings
          </DD.Item>
          <DD.Separator />
          <DD.Item destructive onClick={() => setShowLogoutConfirm(true)}>
            <LogOut size={14} />Sign out
          </DD.Item>
        </div>
      </DD.Content>

      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title="Sign Out"
        description="Are you sure you want to sign out of your account?"
        confirmLabel="Logout"
        onConfirm={logout}
      />
    </DD.Root>
  )
}
