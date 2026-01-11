'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ThemeToggle from './ThemeToggle'
import { 
  CloudLightning,
  Users,
  Phone,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Target,
  Calendar,
  BarChart3,
  Bell,
  LogOut,
  Menu
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  badge?: number
}

const mainNavItems: NavItem[] = [
  { name: 'Storm Command', href: '/', icon: CloudLightning },
  { name: 'Leads Pipeline', href: '/leads', icon: Target },
  { name: 'Skip Trace', href: '/skip-trace', icon: Phone },
  { name: 'Reports', href: '/reports', icon: FileText },
]

const secondaryNavItems: NavItem[] = [
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
]

const utilityNavItems: NavItem[] = [
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href)
    return (
      <Link
        href={item.href}
        className={`
          sidebar-item group relative
          ${active ? 'sidebar-item-active border-l-4 border-primary pl-3' : 'border-l-4 border-transparent'}
          transition-all duration-200
        `}
        onClick={() => setIsMobileOpen(false)}
      >
        <item.icon className={`
          sidebar-item-icon transition-transform duration-200
          ${active ? 'text-primary' : 'text-foreground-muted group-hover:text-foreground'}
          ${!isCollapsed && 'group-hover:scale-110'}
        `} />
        
        {!isCollapsed && (
          <span className={`
            transition-colors duration-200
            ${active ? 'text-primary font-semibold' : 'text-foreground group-hover:text-foreground'}
          `}>
            {item.name}
          </span>
        )}
        
        {item.badge && !isCollapsed && (
          <span className="sidebar-item-badge">
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
        
        {/* Tooltip for collapsed state - use Radix Tooltip */}
        {isCollapsed && (
          <div className="
            absolute left-full ml-2 px-2.5 py-1.5 
            bg-popover border border-border
            text-sm font-medium text-foreground
            opacity-0 invisible group-hover:opacity-100 group-hover:visible
            transition-all duration-200 z-50 whitespace-nowrap
            shadow-lg
          " style={{ borderRadius: 'var(--radius)' }}>
            {item.name}
          </div>
        )}
      </Link>
    )
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden btn btn-ghost btn-icon"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        sidebar fixed top-0 left-0 h-full z-40
        flex flex-col
        transition-transform duration-300 ease-in-out
        will-change-transform
        ${isCollapsed ? 'w-16' : 'w-64'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="sidebar-brand flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
                <CloudLightning className="w-5 h-5 text-primary-foreground" />
              </div>
              {/* Active indicator dot */}
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full border-2 border-sidebar animate-pulse" />
            </div>
            
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="font-display font-bold text-foreground text-sm tracking-tight truncate">
                  HAIL CRM
                </span>
                <span className="text-2xs text-foreground-subtle font-medium uppercase tracking-wider">
                  Storm Command
                </span>
              </div>
            )}
          </Link>
          
          {/* Collapse Toggle - Desktop only */}
          <button
            className="hidden lg:flex btn btn-ghost btn-icon btn-sm ml-auto"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-foreground-muted" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-foreground-muted" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav flex-1 overflow-y-auto scrollbar-thin">
          {/* Main Navigation */}
          <div className="sidebar-section">
            {!isCollapsed && (
              <div className="sidebar-section-title">Main</div>
            )}
            <div className="space-y-0.5">
              {mainNavItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </div>

          {/* Secondary Navigation */}
          <div className="sidebar-section">
            {!isCollapsed && (
              <div className="sidebar-section-title">Tools</div>
            )}
            <div className="space-y-0.5">
              {secondaryNavItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3 space-y-0.5">
          {/* Notifications */}
          <button className="sidebar-item w-full justify-start">
            <Bell className="sidebar-item-icon text-foreground-muted" />
            {!isCollapsed && (
              <>
                <span className="text-foreground">Alerts</span>
                <span className="sidebar-item-badge ml-auto">3</span>
              </>
            )}
          </button>

          {/* Settings */}
          {utilityNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}

          {/* Theme Toggle */}
          <ThemeToggle collapsed={isCollapsed} />

          {/* User/Logout */}
          <div className={`
            flex items-center gap-3 rounded-md p-2 mt-2
            bg-background-secondary/50
            ${isCollapsed ? 'justify-center' : ''}
          `}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-primary">JD</span>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">John Doe</div>
                <div className="text-2xs text-foreground-subtle truncate">Pro Plan</div>
              </div>
            )}
            {!isCollapsed && (
              <button className="btn btn-ghost btn-icon btn-sm flex-shrink-0">
                <LogOut className="w-4 h-4 text-foreground-muted" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
