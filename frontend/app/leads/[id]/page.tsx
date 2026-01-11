'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import Link from 'next/link'
import { 
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CloudLightning,
  User,
  FileText,
  MessageSquare,
  History,
  Edit,
  Trash2,
  MoreVertical,
  Plus,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Home,
  DollarSign,
  Activity,
  Paperclip
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

interface Lead {
  id: string
  name: string
  property_address: string
  street_address?: string
  city?: string
  state?: string
  zip_code?: string
  county?: string
  status: string
  hail_size?: number
  phone?: string
  email?: string
  created_at: string
  updated_at?: string
  storm_date?: string
  notes_count?: number
  property_value?: number
  lead_score?: number
  score?: number
  priority_score?: number
  damage_probability?: number
  storm_id?: string
  property_id?: string
  latitude?: number
  longitude?: number
  // Property details
  property_type?: string
  year_built?: number
  square_footage?: number
  roof_type?: string
  roof_age_years?: number
  // AI & Insights
  ai_insights?: {
    damage_probability?: number
    distance_from_storm?: number
    priority_factors?: any
    source?: string
    note?: string
  }
  // Skip trace data
  skip_trace?: {
    has_data: boolean
    confidence_score?: number
    phones?: Array<{ number: string; type?: string }>
    emails?: Array<{ address: string }>
    searched_at?: string
  }
  // Communications
  communications?: Array<{
    id: string
    type: string
    direction: string
    status: string
    created_at: string
    body?: string
    subject?: string
    call_outcome?: string
  }>
  // Activities
  activities?: Array<{
    id: string
    action: string
    description: string
    created_at: string
    metadata?: any
  }>
}

interface Note {
  id: string
  content: string
  created_at: string
  author?: string
}

interface SkipTraceResult {
  phones?: Array<{ number: string; type: string; status?: string }>
  emails?: Array<{ address: string; status?: string }>
  relatives?: Array<{ name: string; relationship?: string }>
  property_info?: {
    owner_name?: string
    property_type?: string
    year_built?: number
    square_feet?: number
    bedrooms?: number
    bathrooms?: number
    lot_size?: string
    estimated_value?: number
  }
}

interface ActivityItem {
  id: string
  action: string
  description: string
  created_at: string
  metadata?: Record<string, any>
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const TABS = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'skiptrace', label: 'Skip Trace', icon: Phone },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'notes', label: 'Notes', icon: MessageSquare },
]

const STATUS_OPTIONS = [
  'New',
  'Contacted',
  'Appointment Set',
  'Inspection Done',
  'Proposal Sent',
  'Contract Signed',
  'Job Complete',
  'Lost'
]

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const leadId = params.id as string

  const [lead, setLead] = useState<Lead | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [skipTraceData, setSkipTraceData] = useState<SkipTraceResult | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [isEditingStatus, setIsEditingStatus] = useState(false)

  // Fetch lead data
  const fetchLead = useCallback(async () => {
    if (!leadId) return
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/leads/${leadId}`)
      const data = await response.json()
      if (data.success || data.data) {
        setLead(data.data || data)
      }
    } catch (error) {
      console.error('Error fetching lead:', error)
    } finally {
      setIsLoading(false)
    }
  }, [leadId])

  // Fetch notes
  const fetchNotes = useCallback(async () => {
    if (!leadId) return
    try {
      const response = await fetch(`${API_URL}/api/leads/${leadId}/notes`)
      const data = await response.json()
      if (data.success || Array.isArray(data.data)) {
        setNotes(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching notes:', error)
    }
  }, [leadId])

  // Fetch skip trace data
  const fetchSkipTrace = useCallback(async () => {
    if (!leadId) return
    try {
      const response = await fetch(`${API_URL}/api/skiptrace/lead/${leadId}`)
      const data = await response.json()
      if (data.success || data.data) {
        setSkipTraceData(data.data || null)
      }
    } catch (error) {
      console.error('Error fetching skip trace:', error)
    }
  }, [leadId])

  useEffect(() => {
    fetchLead()
    fetchNotes()
    fetchSkipTrace()
  }, [fetchLead, fetchNotes, fetchSkipTrace])

  // Update status
  const handleStatusChange = async (newStatus: string) => {
    if (!lead) return
    try {
      const response = await fetch(`${API_URL}/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (response.ok) {
        setLead(prev => prev ? { ...prev, status: newStatus } : null)
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
    setIsEditingStatus(false)
  }

  // Add note
  const handleAddNote = async () => {
    if (!newNote.trim()) return
    try {
      const response = await fetch(`${API_URL}/api/leads/${leadId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote })
      })
      if (response.ok) {
        setNewNote('')
        fetchNotes()
      }
    } catch (error) {
      console.error('Error adding note:', error)
    }
  }

  // Run skip trace
  const handleRunSkipTrace = async () => {
    try {
      const response = await fetch(`${API_URL}/api/skiptrace/single`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId })
      })
      if (response.ok) {
        fetchSkipTrace()
      }
    } catch (error) {
      console.error('Error running skip trace:', error)
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-foreground-muted">Loading lead...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!lead) {
    return (
      <AppLayout>
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Lead not found</h2>
            <p className="text-foreground-muted mb-4">The lead you're looking for doesn't exist.</p>
            <Link href="/leads" className="btn btn-primary">
              Back to Leads
            </Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 border-b border-border bg-background-secondary/50 backdrop-blur">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-4">
              <Link href="/leads" className="btn btn-ghost btn-icon btn-sm">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="font-display text-lg font-bold text-foreground">
                  {lead.name || 'Property Owner'}
                </h1>
                <div className="flex items-center gap-2 text-sm text-foreground-muted">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{lead.property_address}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Status Selector */}
              <div className="relative">
                <button
                  onClick={() => setIsEditingStatus(!isEditingStatus)}
                  className={`
                    badge text-sm px-3 py-1.5 cursor-pointer
                    badge-stage-${lead.status.toLowerCase().replace(/\s+/g, '-')}
                  `}
                >
                  {lead.status}
                </button>
                
                {isEditingStatus && (
                  <div className="absolute top-full right-0 mt-2 bg-popover border border-border rounded-lg shadow-xl z-50 py-1 min-w-[160px] animate-scale-in">
                    {STATUS_OPTIONS.map(status => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        className={`
                          w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors
                          ${lead.status === status ? 'text-primary font-medium' : 'text-foreground'}
                        `}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button className="btn btn-ghost btn-icon btn-sm">
                <Edit className="w-4 h-4" />
              </button>
              <button className="btn btn-ghost btn-icon btn-sm text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
              <button className="btn btn-ghost btn-icon btn-sm">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 px-4 -mb-px">
            {TABS.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3 text-sm font-medium
                    border-b-2 transition-colors
                    ${activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-foreground-muted hover:text-foreground hover:border-foreground-subtle'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
              {/* Main Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Contact Info Card */}
                <div className="card">
                  <h3 className="font-display font-semibold text-foreground mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-primary-muted flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-xs text-foreground-subtle uppercase">Name</div>
                        <div className="font-medium">{lead.name || 'Property Owner'}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-success-muted flex items-center justify-center">
                        <Phone className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <div className="text-xs text-foreground-subtle uppercase">Phone</div>
                        <div className="font-medium font-mono">{lead.phone || 'Not available'}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-warning-muted flex items-center justify-center">
                        <Mail className="w-5 h-5 text-warning" />
                      </div>
                      <div>
                        <div className="text-xs text-foreground-subtle uppercase">Email</div>
                        <div className="font-medium truncate">{lead.email || 'Not available'}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-accent-muted flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <div className="text-xs text-foreground-subtle uppercase">Address</div>
                        <div className="font-medium truncate">{lead.property_address}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Storm Info Card */}
                {lead.hail_size && (
                  <div className="card bg-destructive-muted/20 border-destructive/30">
                    <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                      <CloudLightning className="w-5 h-5 text-destructive" />
                      Storm Event
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs text-foreground-subtle uppercase mb-1">Hail Size</div>
                        <div className="font-mono text-2xl font-bold text-destructive">{lead.hail_size}"</div>
                      </div>
                      {lead.storm_date && (
                        <div>
                          <div className="text-xs text-foreground-subtle uppercase mb-1">Storm Date</div>
                          <div className="font-medium">{format(new Date(lead.storm_date), 'MMM d, yyyy')}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-xs text-foreground-subtle uppercase mb-1">Severity</div>
                        <span className={`badge ${lead.hail_size >= 2 ? 'badge-hail-severe' : lead.hail_size >= 1.5 ? 'badge-hail-significant' : 'badge-hail-moderate'}`}>
                          {lead.hail_size >= 2 ? 'Severe' : lead.hail_size >= 1.5 ? 'Significant' : 'Moderate'}
                        </span>
                      </div>
                      {lead.storm_id && (
                        <div>
                          <div className="text-xs text-foreground-subtle uppercase mb-1">Event ID</div>
                          <Link href={`/storms/${lead.storm_id}`} className="text-primary hover:underline">
                            View Storm →
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Property Details Card */}
                {(lead.property_type || lead.year_built || lead.square_footage || lead.roof_type) && (
                  <div className="card">
                    <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Home className="w-5 h-5 text-primary" />
                      Property Details
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {lead.property_type && (
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-xs text-foreground-subtle">Type</div>
                          <div className="font-medium capitalize">{lead.property_type.replace('_', ' ')}</div>
                        </div>
                      )}
                      {lead.year_built && (
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-xs text-foreground-subtle">Year Built</div>
                          <div className="font-medium">{lead.year_built}</div>
                        </div>
                      )}
                      {lead.square_footage && (
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-xs text-foreground-subtle">Square Feet</div>
                          <div className="font-medium">{lead.square_footage.toLocaleString()}</div>
                        </div>
                      )}
                      {lead.roof_type && (
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-xs text-foreground-subtle">Roof Type</div>
                          <div className="font-medium capitalize">{lead.roof_type.replace('_', ' ')}</div>
                        </div>
                      )}
                      {lead.roof_age_years && (
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-xs text-foreground-subtle">Roof Age</div>
                          <div className="font-medium">{lead.roof_age_years} years</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* AI Insights Card */}
                {lead.ai_insights && (
                  <div className="card bg-primary-muted/20 border-primary/30">
                    <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" />
                      AI Insights
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {lead.ai_insights.damage_probability !== undefined && (
                        <div>
                          <div className="text-xs text-foreground-subtle mb-1">Damage Probability</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  lead.ai_insights.damage_probability > 0.7 ? 'bg-destructive' :
                                  lead.ai_insights.damage_probability > 0.5 ? 'bg-warning' : 'bg-success'
                                }`}
                                style={{ width: `${lead.ai_insights.damage_probability * 100}%` }}
                              />
                            </div>
                            <span className="font-mono text-sm font-bold">
                              {Math.round(lead.ai_insights.damage_probability * 100)}%
                            </span>
                          </div>
                        </div>
                      )}
                      {lead.ai_insights.distance_from_storm !== undefined && (
                        <div>
                          <div className="text-xs text-foreground-subtle mb-1">Distance from Storm</div>
                          <div className="font-medium">{lead.ai_insights.distance_from_storm.toFixed(1)} miles</div>
                        </div>
                      )}
                      {lead.ai_insights.source && (
                        <div>
                          <div className="text-xs text-foreground-subtle mb-1">Data Source</div>
                          <div className="font-medium capitalize">{lead.ai_insights.source.replace('_', ' ')}</div>
                        </div>
                      )}
                    </div>
                    {lead.ai_insights.note && (
                      <p className="text-sm text-foreground-muted mt-4 pt-4 border-t border-border">
                        ⚠️ {lead.ai_insights.note}
                      </p>
                    )}
                  </div>
                )}

                {/* Quick Actions */}
                <div className="card">
                  <h3 className="font-display font-semibold text-foreground mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button 
                      onClick={() => {
                        if (lead.phone) {
                          window.location.href = `tel:${lead.phone}`
                        } else {
                          alert('No phone number available. Run skip trace to find contact info.')
                        }
                      }}
                      className="btn btn-outline flex-col h-auto py-4 relative"
                    >
                      <Phone className="w-5 h-5 mb-2" />
                      <span className="text-xs">Call</span>
                      {lead.phone && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-success rounded-full" />
                      )}
                    </button>
                    <button 
                      onClick={() => {
                        if (lead.email) {
                          window.location.href = `mailto:${lead.email}?subject=Regarding your property at ${lead.street_address || lead.property_address}`
                        } else {
                          alert('No email available. Run skip trace to find contact info.')
                        }
                      }}
                      className="btn btn-outline flex-col h-auto py-4 relative"
                    >
                      <Mail className="w-5 h-5 mb-2" />
                      <span className="text-xs">Email</span>
                      {lead.email && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-success rounded-full" />
                      )}
                    </button>
                    <button 
                      onClick={() => setActiveTab('skiptrace')}
                      className="btn btn-outline flex-col h-auto py-4"
                    >
                      <Calendar className="w-5 h-5 mb-2" />
                      <span className="text-xs">Skip Trace</span>
                    </button>
                    <button 
                      onClick={() => {
                        window.open(
                          `https://www.google.com/maps?q=${lead.latitude || 0},${lead.longitude || 0}`,
                          '_blank'
                        )
                      }}
                      disabled={!lead.latitude || !lead.longitude}
                      className="btn btn-outline flex-col h-auto py-4"
                    >
                      <ExternalLink className="w-5 h-5 mb-2" />
                      <span className="text-xs">Map</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Priority Score Card */}
                <div className="card">
                  <h3 className="font-display font-semibold text-foreground mb-4">Priority Score</h3>
                  <div className="flex items-center justify-center">
                    <div className="relative w-32 h-32">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          className="text-muted"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="none"
                          strokeDasharray={`${(lead.priority_score || lead.score || 50) * 3.52} 352`}
                          className={`${
                            (lead.priority_score || lead.score || 50) >= 70 ? 'text-destructive' :
                            (lead.priority_score || lead.score || 50) >= 50 ? 'text-warning' : 'text-primary'
                          }`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-mono text-3xl font-bold">{lead.priority_score || lead.score || 50}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-sm text-foreground-muted mt-4">
                    {(lead.priority_score || lead.score || 50) >= 70 ? '🔥 Hot Lead - Contact ASAP' :
                     (lead.priority_score || lead.score || 50) >= 50 ? '⚡ Warm Lead - Good Potential' :
                     '❄️ Cold Lead - Needs Nurturing'}
                  </p>
                </div>

                {/* Damage Probability Card */}
                {lead.damage_probability !== undefined && (
                  <div className={`card ${
                    lead.damage_probability >= 0.7 ? 'bg-destructive-muted/30 border-destructive/50' :
                    lead.damage_probability >= 0.5 ? 'bg-warning-muted/30 border-warning/50' : ''
                  }`}>
                    <h3 className="font-display font-semibold text-foreground mb-2">Damage Probability</h3>
                    <div className="font-mono text-4xl font-bold text-center my-3">
                      {Math.round(lead.damage_probability * 100)}%
                    </div>
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          lead.damage_probability >= 0.7 ? 'bg-destructive' :
                          lead.damage_probability >= 0.5 ? 'bg-warning' : 'bg-success'
                        }`}
                        style={{ width: `${lead.damage_probability * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-foreground-muted mt-2 text-center">
                      {lead.damage_probability >= 0.7 ? 'High likelihood of roof damage' :
                       lead.damage_probability >= 0.5 ? 'Moderate damage likelihood' :
                       'Lower probability of significant damage'}
                    </p>
                  </div>
                )}

                {/* Timeline */}
                <div className="card">
                  <h3 className="font-display font-semibold text-foreground mb-4">Timeline</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-foreground-muted">Created</span>
                      <span className="ml-auto font-mono text-xs">
                        {format(new Date(lead.created_at), 'MMM d')}
                      </span>
                    </div>
                    {lead.updated_at && lead.updated_at !== lead.created_at && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-success" />
                        <span className="text-foreground-muted">Updated</span>
                        <span className="ml-auto font-mono text-xs">
                          {formatDistanceToNow(new Date(lead.updated_at), { addSuffix: true })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Property Value */}
                {lead.property_value && (
                  <div className="card bg-success-muted/20 border-success/30">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5 text-success" />
                      <h3 className="font-display font-semibold text-foreground">Est. Value</h3>
                    </div>
                    <div className="font-mono text-2xl font-bold text-success">
                      ${lead.property_value.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="max-w-4xl mx-auto animate-fade-in">
              <div className="card">
                <h3 className="font-display font-semibold text-foreground mb-6">Activity Timeline</h3>
                {(!lead.activities || lead.activities.length === 0) ? (
                  <div className="empty-state py-12">
                    <History className="empty-state-icon" />
                    <div className="empty-state-title">No activity yet</div>
                    <div className="empty-state-description">
                      Activity will appear here as you interact with this lead.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {lead.activities.map(item => (
                      <div key={item.id} className="flex gap-4 p-4 bg-muted rounded-lg">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          item.action.includes('created') ? 'bg-success-muted' :
                          item.action.includes('email') ? 'bg-warning-muted' :
                          item.action.includes('call') ? 'bg-primary-muted' :
                          item.action.includes('sms') ? 'bg-accent-muted' : 'bg-muted'
                        }`}>
                          {item.action.includes('email') ? <Mail className="w-5 h-5 text-warning" /> :
                           item.action.includes('call') ? <Phone className="w-5 h-5 text-primary" /> :
                           item.action.includes('sms') ? <MessageSquare className="w-5 h-5 text-accent" /> :
                           <Activity className="w-5 h-5 text-foreground-subtle" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground capitalize">
                              {item.action.replace(/_/g, ' ')}
                            </span>
                            <span className="text-xs text-foreground-subtle">
                              {format(new Date(item.created_at), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          <p className="text-sm text-foreground-muted mt-1">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Communication History */}
              {lead.communications && lead.communications.length > 0 && (
                <div className="card mt-6">
                  <h3 className="font-display font-semibold text-foreground mb-6">Communication History</h3>
                  <div className="space-y-3">
                    {lead.communications.map(comm => (
                      <div key={comm.id} className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          comm.type === 'call' ? 'bg-success-muted' :
                          comm.type === 'email' ? 'bg-warning-muted' :
                          'bg-primary-muted'
                        }`}>
                          {comm.type === 'call' ? <Phone className="w-5 h-5 text-success" /> :
                           comm.type === 'email' ? <Mail className="w-5 h-5 text-warning" /> :
                           <MessageSquare className="w-5 h-5 text-primary" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium capitalize">{comm.type} - {comm.direction}</span>
                            <span className="text-xs text-foreground-subtle">
                              {format(new Date(comm.created_at), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          {comm.subject && <p className="text-sm font-medium mt-1">{comm.subject}</p>}
                          {comm.body && <p className="text-sm text-foreground-muted mt-1 line-clamp-2">{comm.body}</p>}
                          {comm.call_outcome && (
                            <span className="badge badge-secondary text-xs mt-2">{comm.call_outcome}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Skip Trace Tab */}
          {activeTab === 'skiptrace' && (
            <div className="max-w-4xl mx-auto animate-fade-in">
              {/* Existing Skip Trace Data from Lead */}
              {lead.skip_trace?.has_data && (
                <div className="card mb-6 border-success/50 bg-success-muted/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-success" />
                      <h3 className="font-display font-semibold text-foreground">Skip Trace Complete</h3>
                    </div>
                    {lead.skip_trace.confidence_score && (
                      <span className="badge badge-success">
                        {lead.skip_trace.confidence_score}% confidence
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Phones from lead.skip_trace */}
                    {lead.skip_trace.phones && lead.skip_trace.phones.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-foreground-muted uppercase mb-2">Phone Numbers</h4>
                        {lead.skip_trace.phones.map((phone, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg mb-2">
                            <div className="flex items-center gap-3">
                              <Phone className="w-4 h-4 text-success" />
                              <span className="font-mono">{phone.number}</span>
                              {phone.type && <span className="badge badge-secondary text-xs">{phone.type}</span>}
                            </div>
                            <a href={`tel:${phone.number}`} className="btn btn-ghost btn-sm">Call</a>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Emails from lead.skip_trace */}
                    {lead.skip_trace.emails && lead.skip_trace.emails.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-foreground-muted uppercase mb-2">Email Addresses</h4>
                        {lead.skip_trace.emails.map((email, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg mb-2">
                            <div className="flex items-center gap-3">
                              <Mail className="w-4 h-4 text-warning" />
                              <span className="truncate">{email.address}</span>
                            </div>
                            <a href={`mailto:${email.address}`} className="btn btn-ghost btn-sm">Email</a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {lead.skip_trace.searched_at && (
                    <p className="text-xs text-foreground-subtle mt-4 pt-4 border-t border-border">
                      Last searched: {format(new Date(lead.skip_trace.searched_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  )}
                </div>
              )}
              
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display font-semibold text-foreground">
                    {lead.skip_trace?.has_data ? 'Run New Skip Trace' : 'Skip Trace Results'}
                  </h3>
                  <button onClick={handleRunSkipTrace} className="btn btn-primary btn-sm">
                    <Phone className="w-4 h-4" />
                    {lead.skip_trace?.has_data ? 'Re-run Skip Trace' : 'Run Skip Trace'}
                  </button>
                </div>
                
                {!skipTraceData && !lead.skip_trace?.has_data ? (
                  <div className="empty-state py-12">
                    <Phone className="empty-state-icon" />
                    <div className="empty-state-title">No skip trace data</div>
                    <div className="empty-state-description">
                      Run a skip trace to find contact information for this property.
                    </div>
                    <p className="text-xs text-foreground-subtle mt-4">
                      Property Address: {lead.street_address || lead.property_address}
                    </p>
                  </div>
                ) : skipTraceData && (
                  <div className="space-y-6">
                    {/* New Skip Trace Results */}
                    {skipTraceData.phones && skipTraceData.phones.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-foreground-muted uppercase mb-3">Phone Numbers</h4>
                        <div className="space-y-2">
                          {skipTraceData.phones.map((phone, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                              <div className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-success" />
                                <span className="font-mono">{phone.number}</span>
                                <span className="badge badge-secondary text-xs">{phone.type}</span>
                              </div>
                              <a href={`tel:${phone.number}`} className="btn btn-ghost btn-sm">Call</a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {skipTraceData.emails && skipTraceData.emails.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-foreground-muted uppercase mb-3">Email Addresses</h4>
                        <div className="space-y-2">
                          {skipTraceData.emails.map((email, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                              <div className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-warning" />
                                <span>{email.address}</span>
                              </div>
                              <a href={`mailto:${email.address}`} className="btn btn-ghost btn-sm">Email</a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {skipTraceData.property_info && (
                      <div>
                        <h4 className="text-sm font-semibold text-foreground-muted uppercase mb-3">Property Information</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {skipTraceData.property_info.owner_name && (
                            <div className="p-3 bg-muted rounded-lg">
                              <div className="text-xs text-foreground-subtle">Owner</div>
                              <div className="font-medium">{skipTraceData.property_info.owner_name}</div>
                            </div>
                          )}
                          {skipTraceData.property_info.property_type && (
                            <div className="p-3 bg-muted rounded-lg">
                              <div className="text-xs text-foreground-subtle">Type</div>
                              <div className="font-medium">{skipTraceData.property_info.property_type}</div>
                            </div>
                          )}
                          {skipTraceData.property_info.year_built && (
                            <div className="p-3 bg-muted rounded-lg">
                              <div className="text-xs text-foreground-subtle">Year Built</div>
                              <div className="font-medium">{skipTraceData.property_info.year_built}</div>
                            </div>
                          )}
                          {skipTraceData.property_info.square_feet && (
                            <div className="p-3 bg-muted rounded-lg">
                              <div className="text-xs text-foreground-subtle">Sq Ft</div>
                              <div className="font-medium">{skipTraceData.property_info.square_feet.toLocaleString()}</div>
                            </div>
                          )}
                          {skipTraceData.property_info.estimated_value && (
                            <div className="p-3 bg-muted rounded-lg">
                              <div className="text-xs text-foreground-subtle">Est. Value</div>
                              <div className="font-medium font-mono">${skipTraceData.property_info.estimated_value.toLocaleString()}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="max-w-4xl mx-auto animate-fade-in">
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display font-semibold text-foreground">Documents</h3>
                  <button className="btn btn-primary btn-sm">
                    <Plus className="w-4 h-4" />
                    Upload
                  </button>
                </div>
                <div className="empty-state py-12">
                  <FileText className="empty-state-icon" />
                  <div className="empty-state-title">No documents yet</div>
                  <div className="empty-state-description">
                    Upload proposals, contracts, and other documents here.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className="max-w-4xl mx-auto animate-fade-in">
              <div className="card">
                <h3 className="font-display font-semibold text-foreground mb-6">Notes</h3>
                
                {/* Add Note */}
                <div className="mb-6">
                  <div className="flex gap-3">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a note..."
                      className="input min-h-[80px] flex-1 resize-none"
                    />
                    <button 
                      onClick={handleAddNote}
                      disabled={!newNote.trim()}
                      className="btn btn-primary self-end"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Notes List */}
                {notes.length === 0 ? (
                  <div className="empty-state py-12">
                    <MessageSquare className="empty-state-icon" />
                    <div className="empty-state-title">No notes yet</div>
                    <div className="empty-state-description">
                      Add notes to keep track of conversations and follow-ups.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notes.map(note => (
                      <div key={note.id} className="p-4 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-foreground">
                            {note.author || 'You'}
                          </span>
                          <span className="text-xs text-foreground-subtle">
                            {format(new Date(note.created_at), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <p className="text-foreground-muted whitespace-pre-wrap">{note.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </AppLayout>
  )
}
