'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Sun, Moon, Monitor, Check } from 'lucide-react'

interface ThemeToggleProps {
  collapsed?: boolean
}

export default function ThemeToggle({ collapsed = false }: ThemeToggleProps) {
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return placeholder to prevent layout shift
    return (
      <button className="sidebar-item w-full justify-start opacity-50" disabled>
        <Monitor className="sidebar-item-icon text-foreground-muted" />
        {!collapsed && <span className="text-foreground-muted">Theme</span>}
      </button>
    )
  }

  const currentTheme = theme === 'system' ? systemTheme : theme
  const currentThemeLabel = theme === 'system' ? 'System' : theme === 'light' ? 'Light' : 'Dark'

  const themes = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ] as const

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="sidebar-item w-full justify-start">
          {currentTheme === 'light' ? (
            <Sun className="sidebar-item-icon text-foreground-muted group-hover:text-foreground transition-transform duration-200" />
          ) : currentTheme === 'dark' ? (
            <Moon className="sidebar-item-icon text-foreground-muted group-hover:text-foreground transition-transform duration-200" />
          ) : (
            <Monitor className="sidebar-item-icon text-foreground-muted group-hover:text-foreground transition-transform duration-200" />
          )}
          {!collapsed && (
            <>
              <span className="text-foreground group-hover:text-foreground">Theme</span>
              <span className="ml-auto text-xs text-foreground-subtle">{currentThemeLabel}</span>
            </>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="
            min-w-[180px] 
            bg-popover border border-border 
            shadow-lg
            p-1
            z-50
          "
          style={{ borderRadius: 'var(--radius)' }}
          side={collapsed ? 'right' : 'top'}
          align={collapsed ? 'start' : 'end'}
          sideOffset={8}
        >
          {themes.map(({ id, label, icon: Icon }) => {
            const isSelected = theme === id
            return (
              <DropdownMenu.Item
                key={id}
                onSelect={() => setTheme(id)}
                className="
                  flex items-center gap-2
                  px-3 py-2
                  text-sm font-medium
                  text-foreground
                  cursor-pointer
                  outline-none
                  hover:bg-muted
                  focus:bg-muted
                  transition-colors
                  rounded
                "
                style={{ borderRadius: 'calc(var(--radius) - 2px)' }}
              >
                <Icon className="w-4 h-4 text-foreground-muted" />
                <span className="flex-1">{label}</span>
                {isSelected && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </DropdownMenu.Item>
            )
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
