'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import AppLayout from '@/components/AppLayout'
import { 
  User,
  Building,
  Bell,
  Mail,
  Phone,
  Globe,
  Key,
  Shield,
  Database,
  Upload,
  Download,
  Trash2,
  Save,
  Check,
  Link,
  Zap,
  MessageSquare,
  Palette,
  Monitor,
  Moon,
  Sun,
  CreditCard,
  HelpCircle,
  LogOut,
  ExternalLink,
  ChevronRight
} from 'lucide-react'

interface SettingsSection {
  id: string
  name: string
  icon: React.ElementType
  description: string
}

const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: 'profile', name: 'Profile', icon: User, description: 'Your personal information' },
  { id: 'company', name: 'Company', icon: Building, description: 'Business details and branding' },
  { id: 'notifications', name: 'Notifications', icon: Bell, description: 'Email, SMS, and push alerts' },
  { id: 'integrations', name: 'Integrations', icon: Link, description: 'Connect external services' },
  { id: 'pipeline', name: 'Pipeline Stages', icon: Zap, description: 'Customize lead stages' },
  { id: 'data', name: 'Data & Import', icon: Database, description: 'Import, export, and manage data' },
  { id: 'appearance', name: 'Appearance', icon: Palette, description: 'Theme and display settings' },
  { id: 'billing', name: 'Billing', icon: CreditCard, description: 'Subscription and payments' },
]

export default function SettingsPage() {
  const { theme, setTheme, systemTheme } = useTheme()
  const [activeSection, setActiveSection] = useState('profile')
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Form states
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '(555) 123-4567',
    role: 'Admin',
  })

  const [company, setCompany] = useState({
    name: 'Storm Roofing Co.',
    website: 'https://stormroofing.com',
    address: '123 Business Ave, Madison, WI 53703',
    phone: '(555) 987-6543',
  })

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    pushAlerts: true,
    newStormAlerts: true,
    leadUpdates: true,
    weeklyReport: true,
  })

  const [appearance, setAppearance] = useState({
    theme: theme || 'system',
    sidebarCollapsed: false,
    compactMode: false,
  })

  // Sync appearance.theme with actual theme
  useEffect(() => {
    if (mounted && theme) {
      setAppearance(prev => ({ ...prev, theme: theme }))
    }
  }, [theme, mounted])

  // Handle theme change from settings
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    setAppearance(prev => ({ ...prev, theme: newTheme }))
    // Theme changes immediately via useTheme hook
  }

  const currentTheme = theme === 'system' ? systemTheme : theme

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="font-display font-semibold text-foreground mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    value={profile.role}
                    disabled
                    className="input opacity-50 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <h3 className="font-display font-semibold text-foreground mb-4">Security</h3>
              <div className="space-y-3">
                <button className="w-full btn btn-outline justify-between">
                  <span className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Change Password
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button className="w-full btn btn-outline justify-between">
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Two-Factor Authentication
                  </span>
                  <span className="badge badge-success">Enabled</span>
                </button>
              </div>
            </div>
          </div>
        )

      case 'company':
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="font-display font-semibold text-foreground mb-4">Business Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={company.name}
                    onChange={(e) => setCompany(c => ({ ...c, name: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={company.website}
                    onChange={(e) => setCompany(c => ({ ...c, website: e.target.value }))}
                    className="input"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground-muted mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={company.address}
                    onChange={(e) => setCompany(c => ({ ...c, address: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={company.phone}
                    onChange={(e) => setCompany(c => ({ ...c, phone: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <h3 className="font-display font-semibold text-foreground mb-4">Branding</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-2">
                    Company Logo
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                      <Building className="w-8 h-8 text-foreground-subtle" />
                    </div>
                    <button className="btn btn-outline">
                      <Upload className="w-4 h-4" />
                      Upload Logo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'notifications':
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="font-display font-semibold text-foreground mb-4">Notification Channels</h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-muted rounded-lg cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-foreground-muted" />
                    <div>
                      <div className="font-medium text-foreground">Email Notifications</div>
                      <div className="text-sm text-foreground-muted">Receive updates via email</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.emailAlerts}
                    onChange={(e) => setNotifications(n => ({ ...n, emailAlerts: e.target.checked }))}
                    className="w-5 h-5 rounded text-primary"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-muted rounded-lg cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-foreground-muted" />
                    <div>
                      <div className="font-medium text-foreground">SMS Notifications</div>
                      <div className="text-sm text-foreground-muted">Receive text messages</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.smsAlerts}
                    onChange={(e) => setNotifications(n => ({ ...n, smsAlerts: e.target.checked }))}
                    className="w-5 h-5 rounded text-primary"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-muted rounded-lg cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-foreground-muted" />
                    <div>
                      <div className="font-medium text-foreground">Push Notifications</div>
                      <div className="text-sm text-foreground-muted">Browser push alerts</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.pushAlerts}
                    onChange={(e) => setNotifications(n => ({ ...n, pushAlerts: e.target.checked }))}
                    className="w-5 h-5 rounded text-primary"
                  />
                </label>
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <h3 className="font-display font-semibold text-foreground mb-4">Alert Types</h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-muted rounded-lg cursor-pointer">
                  <div>
                    <div className="font-medium text-foreground">New Storm Alerts</div>
                    <div className="text-sm text-foreground-muted">Get notified when new storms are detected</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.newStormAlerts}
                    onChange={(e) => setNotifications(n => ({ ...n, newStormAlerts: e.target.checked }))}
                    className="w-5 h-5 rounded text-primary"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-muted rounded-lg cursor-pointer">
                  <div>
                    <div className="font-medium text-foreground">Lead Updates</div>
                    <div className="text-sm text-foreground-muted">Changes to lead status or information</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.leadUpdates}
                    onChange={(e) => setNotifications(n => ({ ...n, leadUpdates: e.target.checked }))}
                    className="w-5 h-5 rounded text-primary"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-muted rounded-lg cursor-pointer">
                  <div>
                    <div className="font-medium text-foreground">Weekly Summary</div>
                    <div className="text-sm text-foreground-muted">Weekly report of activity</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.weeklyReport}
                    onChange={(e) => setNotifications(n => ({ ...n, weeklyReport: e.target.checked }))}
                    className="w-5 h-5 rounded text-primary"
                  />
                </label>
              </div>
            </div>
          </div>
        )

      case 'integrations':
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="font-display font-semibold text-foreground mb-4">Connected Services</h3>
            
            <div className="space-y-4">
              {/* GoHighLevel */}
              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">GHL</span>
                    </div>
                    <div>
                      <div className="font-medium text-foreground">GoHighLevel</div>
                      <div className="text-sm text-foreground-muted">CRM & Marketing Automation</div>
                    </div>
                  </div>
                  <span className="badge badge-success">Connected</span>
                </div>
                <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
                  <button className="btn btn-outline btn-sm">Configure</button>
                  <button className="btn btn-ghost btn-sm text-destructive">Disconnect</button>
                </div>
              </div>

              {/* Skip Trace Provider */}
              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">TLO Skip Trace</div>
                      <div className="text-sm text-foreground-muted">Property Owner Lookup</div>
                    </div>
                  </div>
                  <span className="badge badge-success">Connected</span>
                </div>
                <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
                  <button className="btn btn-outline btn-sm">Configure</button>
                  <button className="btn btn-ghost btn-sm text-destructive">Disconnect</button>
                </div>
              </div>

              {/* Add Integration */}
              <button className="w-full p-4 border border-dashed border-foreground-subtle rounded-lg text-foreground-muted hover:border-primary hover:text-primary transition-colors">
                <div className="flex items-center justify-center gap-2">
                  <Link className="w-5 h-5" />
                  Add Integration
                </div>
              </button>
            </div>
          </div>
        )

      case 'pipeline':
        return (
          <div className="space-y-6 animate-fade-in">
            <h3 className="font-display font-semibold text-foreground mb-4">Pipeline Stages</h3>
            <p className="text-sm text-foreground-muted mb-4">
              Customize the stages in your lead pipeline. Drag to reorder.
            </p>
            
            <div className="space-y-2">
              {['New', 'Contacted', 'Appointment Set', 'Inspection Done', 'Proposal Sent', 'Contract Signed', 'Job Complete', 'Lost'].map((stage, i) => (
                <div key={stage} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-primary-muted flex items-center justify-center text-xs font-bold text-primary">
                    {i + 1}
                  </div>
                  <input
                    type="text"
                    defaultValue={stage}
                    className="input flex-1 h-9"
                  />
                  <button className="btn btn-ghost btn-icon btn-sm text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button className="btn btn-outline">
              <Zap className="w-4 h-4" />
              Add Stage
            </button>
          </div>
        )

      case 'data':
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="font-display font-semibold text-foreground mb-4">Import Data</h3>
              <div className="p-6 border border-dashed border-foreground-subtle rounded-lg text-center">
                <Upload className="w-8 h-8 text-foreground-subtle mx-auto mb-3" />
                <p className="text-foreground-muted mb-3">Drag and drop files here, or click to browse</p>
                <button className="btn btn-outline">
                  <Upload className="w-4 h-4" />
                  Select Files
                </button>
                <p className="text-xs text-foreground-subtle mt-3">
                  Supports CSV, XLSX files up to 10MB
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <h3 className="font-display font-semibold text-foreground mb-4">Export Data</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="btn btn-outline justify-start">
                  <Download className="w-4 h-4" />
                  Export Leads (CSV)
                </button>
                <button className="btn btn-outline justify-start">
                  <Download className="w-4 h-4" />
                  Export Storm Events (CSV)
                </button>
                <button className="btn btn-outline justify-start">
                  <Download className="w-4 h-4" />
                  Export Skip Trace Results
                </button>
                <button className="btn btn-outline justify-start">
                  <Download className="w-4 h-4" />
                  Full Data Backup
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <h3 className="font-display font-semibold text-foreground mb-4 text-destructive">Danger Zone</h3>
              <div className="p-4 border border-destructive/30 bg-destructive-muted/10 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">Delete All Data</div>
                    <div className="text-sm text-foreground-muted">
                      Permanently delete all leads, storm data, and reports. This cannot be undone.
                    </div>
                  </div>
                  <button className="btn btn-destructive btn-sm">
                    <Trash2 className="w-4 h-4" />
                    Delete All
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case 'appearance':
        if (!mounted) {
          return (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          )
        }

        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="font-display font-semibold text-foreground mb-4">Theme</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'dark', name: 'Dark', icon: Moon },
                  { id: 'light', name: 'Light', icon: Sun },
                  { id: 'system', name: 'System', icon: Monitor },
                ].map(({ id, name, icon: Icon }) => {
                  const isSelected = theme === id
                  return (
                    <button
                      key={id}
                      onClick={() => handleThemeChange(id)}
                      className={`
                        p-4 border text-center transition-all
                        ${isSelected
                          ? 'border-primary bg-primary-muted/20'
                          : 'border-border hover:border-primary'
                        }
                      `}
                      style={{ borderRadius: 'var(--radius-lg)' }}
                    >
                      <Icon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? 'text-primary' : 'text-foreground-muted'}`} />
                      <span className="text-sm font-medium text-foreground">{name}</span>
                      {isSelected && (
                        <div className="mt-2 flex items-center justify-center gap-1">
                          <Check className="w-4 h-4 text-primary" />
                          <span className="text-xs text-primary">Active</span>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
              {theme === 'system' && systemTheme && (
                <p className="mt-2 text-sm text-foreground-muted">
                  Using {systemTheme === 'dark' ? 'dark' : 'light'} theme (system preference)
                </p>
              )}
            </div>

            <div className="pt-6 border-t border-border">
              <h3 className="font-display font-semibold text-foreground mb-4">Display Options</h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-muted rounded-lg cursor-pointer">
                  <div>
                    <div className="font-medium text-foreground">Compact Mode</div>
                    <div className="text-sm text-foreground-muted">Reduce spacing and padding</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={appearance.compactMode}
                    onChange={(e) => setAppearance(a => ({ ...a, compactMode: e.target.checked }))}
                    className="w-5 h-5 rounded text-primary"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-muted rounded-lg cursor-pointer">
                  <div>
                    <div className="font-medium text-foreground">Collapsed Sidebar</div>
                    <div className="text-sm text-foreground-muted">Start with sidebar minimized</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={appearance.sidebarCollapsed}
                    onChange={(e) => setAppearance(a => ({ ...a, sidebarCollapsed: e.target.checked }))}
                    className="w-5 h-5 rounded text-primary"
                  />
                </label>
              </div>
            </div>
          </div>
        )

      case 'billing':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="p-6 bg-gradient-to-r from-primary to-accent rounded-lg text-primary-foreground">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-80">Current Plan</div>
                  <div className="text-2xl font-display font-bold">Pro Plan</div>
                </div>
                <span className="badge bg-white/20 text-white border-0">Active</span>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <button className="btn bg-white/10 hover:bg-white/20 text-white border-0">
                  Upgrade Plan
                </button>
                <button className="btn bg-white/10 hover:bg-white/20 text-white border-0">
                  Manage Subscription
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-display font-semibold text-foreground mb-4">Payment Method</h3>
              <div className="p-4 border border-border rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-8 h-8 text-foreground-muted" />
                  <div>
                    <div className="font-medium text-foreground">•••• •••• •••• 4242</div>
                    <div className="text-sm text-foreground-muted">Expires 12/2027</div>
                  </div>
                </div>
                <button className="btn btn-outline btn-sm">Update</button>
              </div>
            </div>

            <div>
              <h3 className="font-display font-semibold text-foreground mb-4">Billing History</h3>
              <div className="space-y-2">
                {[
                  { date: 'Jan 1, 2026', amount: '$99.00', status: 'Paid' },
                  { date: 'Dec 1, 2025', amount: '$99.00', status: 'Paid' },
                  { date: 'Nov 1, 2025', amount: '$99.00', status: 'Paid' },
                ].map((invoice, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-foreground">{invoice.date}</span>
                      <span className="badge badge-success">{invoice.status}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-medium text-foreground">{invoice.amount}</span>
                      <button className="btn btn-ghost btn-sm">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <AppLayout>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="flex-shrink-0 border-b border-border bg-background-secondary/50 backdrop-blur">
          <div className="flex items-center justify-between h-14 px-4">
            <h1 className="font-display text-lg font-bold text-foreground">
              Settings
            </h1>
            
            <div className="flex items-center gap-2">
              {saved && (
                <span className="flex items-center gap-1 text-sm text-success animate-fade-in">
                  <Check className="w-4 h-4" />
                  Saved
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn btn-primary btn-sm"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-hidden flex">
          {/* Sidebar */}
          <aside className="w-64 border-r border-border overflow-y-auto bg-background-secondary">
            <nav className="p-3 space-y-1">
              {SETTINGS_SECTIONS.map((section) => {
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left
                      transition-colors
                      ${activeSection === section.id
                        ? 'bg-primary-muted text-primary'
                        : 'text-foreground-muted hover:text-foreground hover:bg-muted'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{section.name}</span>
                  </button>
                )
              })}
            </nav>

            <div className="p-3 mt-4 border-t border-border">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-muted transition-colors">
                <HelpCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Help & Support</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive-muted transition-colors">
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Log Out</span>
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl">
              {renderSection()}
            </div>
          </div>
        </main>
      </div>
    </AppLayout>
  )
}
