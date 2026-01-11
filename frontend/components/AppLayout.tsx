'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar - Fixed overlay on desktop, slide-in on mobile */}
      <Sidebar 
        isCollapsed={isCollapsed} 
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)} 
      />
      
      {/* Main Content - Pushed by sidebar on desktop */}
      <main 
        className={`
          h-full w-full 
          transition-all duration-300 ease-in-out
          lg:pl-64
          ${isCollapsed ? 'lg:pl-16' : 'lg:pl-64'}
        `}
      >
        {children}
      </main>
    </div>
  )
}
