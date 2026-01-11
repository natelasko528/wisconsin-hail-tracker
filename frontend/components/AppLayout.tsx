'use client'

import Sidebar from './Sidebar'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar - Fixed overlay on desktop, slide-in on mobile */}
      <Sidebar />
      
      {/* Main Content - Full screen, sidebar overlays (doesn't push) */}
      <main className="h-full w-full">
        {children}
      </main>
    </div>
  )
}
