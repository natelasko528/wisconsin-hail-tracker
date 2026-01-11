'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/AppLayout'
import { KanbanBoard } from '@/components/leads'
import { 
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  LayoutGrid,
  List,
  Users,
  TrendingUp,
  DollarSign,
  Calendar,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react'

interface Lead {
  id: string
  name: string
  property_address: string
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
}

interface PipelineStage {
  id: string
  name: string
  color: string
}

const PIPELINE_STAGES: PipelineStage[] = [
  { id: 'New', name: 'New', color: 'primary' },
  { id: 'Contacted', name: 'Contacted', color: 'purple' },
  { id: 'Appointment', name: 'Appointment Set', color: 'warning' },
  { id: 'Inspection', name: 'Inspection Done', color: 'pink' },
  { id: 'Proposal', name: 'Proposal Sent', color: 'blue' },
  { id: 'Contract', name: 'Contract Signed', color: 'success' },
  { id: 'Complete', name: 'Job Complete', color: 'emerald' },
  { id: 'Lost', name: 'Lost', color: 'destructive' },
]

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function LeadsPipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    minHailSize: '',
    hasPhone: false,
    hasEmail: false,
    dateRange: ''
  })

  // Fetch leads
  const fetchLeads = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filters.status) params.append('status', filters.status)
      
      const response = await fetch(`${API_URL}/api/leads?${params}`)
      const data = await response.json()
      
      if (data.success || Array.isArray(data.data)) {
        setLeads(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setIsLoading(false)
    }
  }, [searchTerm, filters])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  // Handle lead status change (drag-drop)
  const handleLeadMove = async (leadId: string, newStatus: string) => {
    // Optimistic update
    setLeads(prev => prev.map(lead => 
      lead.id === leadId ? { ...lead, status: newStatus } : lead
    ))

    try {
      const response = await fetch(`${API_URL}/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (!response.ok) {
        // Revert on error
        fetchLeads()
      }
    } catch (error) {
      console.error('Error updating lead:', error)
      fetchLeads()
    }
  }

  // Calculate stats
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'New').length,
    inProgress: leads.filter(l => !['New', 'Lost', 'Complete'].includes(l.status)).length,
    won: leads.filter(l => l.status === 'Complete' || l.status === 'Contract').length,
    totalValue: leads.reduce((sum, l) => sum + (l.property_value || 0), 0),
  }

  return (
    <AppLayout>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="flex-shrink-0 border-b border-border bg-background-secondary/50 backdrop-blur">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-4">
              <h1 className="font-display text-lg font-bold text-foreground">
                Leads Pipeline
              </h1>
              <div className="hidden md:flex items-center gap-3 ml-4 pl-4 border-l border-border">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-sm font-mono font-semibold">{stats.total}</span>
                  <span className="text-xs text-foreground-muted">Total</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span className="text-sm font-mono font-semibold">{stats.won}</span>
                  <span className="text-xs text-foreground-muted">Won</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-warning" />
                  <span className="text-sm font-mono font-semibold">
                    ${(stats.totalValue / 1000).toFixed(0)}k
                  </span>
                  <span className="text-xs text-foreground-muted">Pipeline</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-subtle" />
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-9 w-64 h-9"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-background-secondary rounded-lg p-1 border border-border">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`btn btn-sm btn-icon ${viewMode === 'kanban' ? 'bg-primary text-primary-foreground' : 'btn-ghost'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`btn btn-sm btn-icon ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'btn-ghost'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn btn-ghost btn-sm ${showFilters ? 'bg-muted' : ''}`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
              </button>

              <button
                onClick={fetchLeads}
                className="btn btn-ghost btn-sm"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border">
                <button className="btn btn-outline btn-sm">
                  <Upload className="w-4 h-4" />
                  Import
                </button>
                <button className="btn btn-outline btn-sm">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>

              <button className="btn btn-primary btn-sm">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Lead</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          {showFilters && (
            <div className="px-4 py-3 border-t border-border animate-fade-in-down">
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                  className="input select h-8 text-xs w-40"
                >
                  <option value="">All Stages</option>
                  {PIPELINE_STAGES.map(stage => (
                    <option key={stage.id} value={stage.id}>{stage.name}</option>
                  ))}
                </select>

                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(f => ({ ...f, dateRange: e.target.value }))}
                  className="input select h-8 text-xs w-40"
                >
                  <option value="">Any Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                </select>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.hasPhone}
                    onChange={(e) => setFilters(f => ({ ...f, hasPhone: e.target.checked }))}
                    className="w-4 h-4 rounded border-foreground-subtle"
                  />
                  <span className="text-xs text-foreground-muted">Has Phone</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.hasEmail}
                    onChange={(e) => setFilters(f => ({ ...f, hasEmail: e.target.checked }))}
                    className="w-4 h-4 rounded border-foreground-subtle"
                  />
                  <span className="text-xs text-foreground-muted">Has Email</span>
                </label>

                <button
                  onClick={() => setFilters({
                    status: '',
                    minHailSize: '',
                    hasPhone: false,
                    hasEmail: false,
                    dateRange: ''
                  })}
                  className="btn btn-ghost btn-sm text-xs"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden bg-background">
          {viewMode === 'kanban' ? (
            <KanbanBoard
              leads={leads}
              stages={PIPELINE_STAGES}
              onLeadMove={handleLeadMove}
              onLeadSelect={setSelectedLead}
              isLoading={isLoading}
            />
          ) : (
            <div className="p-4 overflow-auto h-full">
              {/* Table View */}
              <div className="card overflow-hidden">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Address</th>
                      <th>Status</th>
                      <th>Hail Size</th>
                      <th>Phone</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i}>
                          {[...Array(7)].map((_, j) => (
                            <td key={j}>
                              <div className="h-4 bg-muted rounded animate-pulse w-24" />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : leads.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12">
                          <div className="empty-state inline-flex flex-col">
                            <Users className="empty-state-icon mx-auto" />
                            <div className="empty-state-title">No leads yet</div>
                            <div className="empty-state-description">
                              Convert storm events to leads from the Storm Command page.
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      leads.map(lead => (
                        <tr 
                          key={lead.id}
                          className="cursor-pointer"
                          onClick={() => setSelectedLead(lead)}
                        >
                          <td className="font-medium">{lead.name || 'Property Owner'}</td>
                          <td className="text-foreground-muted">{lead.property_address}</td>
                          <td>
                            <span className={`badge badge-stage-${lead.status.toLowerCase().replace(/\s+/g, '-')}`}>
                              {lead.status}
                            </span>
                          </td>
                          <td>
                            {lead.hail_size && (
                              <span className="font-mono">{lead.hail_size}"</span>
                            )}
                          </td>
                          <td className="text-foreground-muted">{lead.phone || '-'}</td>
                          <td className="text-foreground-muted text-sm">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </td>
                          <td>
                            <button className="btn btn-ghost btn-sm">View</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </AppLayout>
  )
}
