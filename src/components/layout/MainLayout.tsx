import React from 'react'
import { Sidebar } from './Sidebar'
import { useUIStore } from '@/store/ui.store'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)
  const isMobileSidebarOpen = useUIStore((s) => s.isMobileSidebarOpen)
  const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div
        className={`
          flex-shrink-0 transition-all duration-300 overflow-hidden
          ${sidebarCollapsed ? 'w-0' : 'w-60'}
          hidden lg:block
        `}
      >
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="relative w-64 h-full bg-background animate-slide-in-left">
            <Sidebar />
          </div>
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileSidebarOpen(false)}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {children}
      </div>
    </div>
  )
}
