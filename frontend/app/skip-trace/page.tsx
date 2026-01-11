'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { 
  Search,
  Upload,
  Download,
  Phone,
  Mail,
  User,
  Home,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  FileText,
  Target,
  Users,
  Filter,
  ChevronDown,
  Play,
  Pause,
  MoreVertical,
  Copy,
  ExternalLink
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

interface SkipTraceJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  total_records: number
  processed_records: number
  successful_records: number
  created_at: string
  completed_at?: string
}

interface SkipTraceResult {
  id: string
  lead_id?: string
  address: string
  status: 'success' | 'partial' | 'not_found' | 'error'
  owner_name?: string
  phones?: Array<{ number: string; type: string; confidence: number }>
  emails?: Array<{ address: string; confidence: number }>
  property_info?: {
    property_type?: string
    year_built?: number
    square_feet?: number
    estimated_value?: number
  }
  created_at: string
}

interface Lead {
  id: string
  name: string
  property_address: string
  status: string
  phone?: string
  email?: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function SkipTraceCenterPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'single' | 'batch' | 'results'>('single')
  const [isLoading, setIsLoading] = useState(false)
  const [isMockMode, setIsMockMode] = useState(true) // Assume mock until verified
  
  // Single lookup state
  const [singleAddress, setSingleAddress] = useState(searchParams.get('address') || '')
  const [singleResult, setSingleResult] = useState<SkipTraceResult | null>(null)
  const [isMockResult, setIsMockResult] = useState(false)
  
  // Batch state
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const [leads, setLeads] = useState<Lead[]>([])
  const [jobs, setJobs] = useState<SkipTraceJob[]>([])
  
  // Results state
  const [results, setResults] = useState<SkipTraceResult[]>([])
  const [resultsFilter, setResultsFilter] = useState<'all' | 'success' | 'partial' | 'not_found'>('all')

  // Check if skip trace API is configured
  const checkApiStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/skiptrace/status`)
      const data = await response.json()
      setIsMockMode(!data.configured)
    } catch {
      setIsMockMode(true)
    }
  }, [])

  // Fetch leads for batch processing
  const fetchLeads = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/leads?limit=100`)
      const data = await response.json()
      if (data.success || Array.isArray(data.data)) {
        setLeads(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
    }
  }, [])

  // Fetch skip trace history
  const fetchResults = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/skiptrace/history?limit=50`)
      const data = await response.json()
      if (data.success || Array.isArray(data.data)) {
        setResults(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching results:', error)
    }
  }, [])

  useEffect(() => {
    checkApiStatus()
    fetchLeads()
    fetchResults()
  }, [checkApiStatus, fetchLeads, fetchResults])

  // Single address lookup
  const handleSingleLookup = async () => {
    if (!singleAddress.trim()) return
    setIsLoading(true)
    setSingleResult(null)
    setIsMockResult(false)
    
    try {
      const response = await fetch(`${API_URL}/api/skiptrace/single`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: singleAddress })
      })
      const data = await response.json()
      if (data.success || data.data) {
        setSingleResult(data.data || data)
        setIsMockResult(data.is_mock || data.data?.is_mock || false)
        fetchResults() // Refresh history
      }
    } catch (error) {
      console.error('Error running skip trace:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Batch processing
  const handleBatchProcess = async () => {
    if (selectedLeads.size === 0) return
    setIsLoading(true)
    
    try {
      const response = await fetch(`${API_URL}/api/skiptrace/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: Array.from(selectedLeads) })
      })
      const data = await response.json()
      if (data.success) {
        setSelectedLeads(new Set())
        fetchResults() // Refresh history
        setActiveTab('results')
      }
    } catch (error) {
      console.error('Error running batch skip trace:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Toggle lead selection
  const toggleLeadSelection = (leadId: string) => {
    const newSelected = new Set(selectedLeads)
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId)
    } else {
      newSelected.add(leadId)
    }
    setSelectedLeads(newSelected)
  }

  // Select all leads without phone
  const selectAllWithoutPhone = () => {
    const leadsWithoutPhone = leads.filter(l => !l.phone)
    setSelectedLeads(new Set(leadsWithoutPhone.map(l => l.id)))
  }

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
  }

  // Filter results
  const filteredResults = results.filter(r => 
    resultsFilter === 'all' || r.status === resultsFilter
  )

  const getStatusBadge = (status: SkipTraceResult['status']) => {
    switch (status) {
      case 'success':
        return <span className="badge badge-success"><CheckCircle className="w-3 h-3 mr-1" />Found</span>
      case 'partial':
        return <span className="badge badge-warning"><AlertCircle className="w-3 h-3 mr-1" />Partial</span>
      case 'not_found':
        return <span className="badge badge-secondary"><XCircle className="w-3 h-3 mr-1" />Not Found</span>
      case 'error':
        return <span className="badge badge-destructive"><XCircle className="w-3 h-3 mr-1" />Error</span>
      default:
        return <span className="badge badge-secondary">Unknown</span>
    }
  }

  return (
    <AppLayout>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="flex-shrink-0 border-b border-border bg-background-secondary/50 backdrop-blur">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-4">
              <h1 className="font-display text-lg font-bold text-foreground">
                Skip Trace Center
              </h1>
              <span className="hidden sm:inline-flex badge badge-primary">
                TLO Powered
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={fetchResults}
                className="btn btn-ghost btn-sm"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button className="btn btn-outline btn-sm">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 px-4 -mb-px">
            {[
              { id: 'single', label: 'Single Lookup', icon: Search },
              { id: 'batch', label: 'Batch Process', icon: Users },
              { id: 'results', label: 'History', icon: FileText },
            ].map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
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
          {/* Mock Mode Warning Banner */}
          {isMockMode && (
            <div className="max-w-6xl mx-auto mb-6">
              <div className="bg-amber-500/10 border border-amber-500/50 rounded-lg p-4 flex items-start gap-4">
                <div className="p-2 rounded-lg bg-amber-500/20 flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-500 text-lg">Demo Mode Active</h3>
                  <p className="text-foreground-muted mt-1">
                    Skip trace is running in demo mode with simulated data. Results shown are for demonstration purposes only.
                  </p>
                  <p className="text-sm text-foreground-muted mt-2">
                    To use real skip trace data, configure the <code className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs font-mono">TLOXP_API_KEY</code> environment variable in your backend.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Single Lookup Tab */}
          {activeTab === 'single' && (
            <div className="max-w-4xl mx-auto animate-fade-in">
              {/* Search Box */}
              <div className="card mb-6">
                <h2 className="font-display font-semibold text-foreground mb-4">
                  Property Address Lookup
                </h2>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-subtle" />
                    <input
                      type="text"
                      value={singleAddress}
                      onChange={(e) => setSingleAddress(e.target.value)}
                      placeholder="Enter full address (e.g., 123 Main St, Madison, WI 53703)"
                      className="input input-lg pl-11 w-full"
                      onKeyDown={(e) => e.key === 'Enter' && handleSingleLookup()}
                    />
                  </div>
                  <button
                    onClick={handleSingleLookup}
                    disabled={isLoading || !singleAddress.trim()}
                    className="btn btn-primary btn-lg"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Search className="w-5 h-5" />
                    )}
                    Search
                  </button>
                </div>
                <p className="text-xs text-foreground-subtle mt-2">
                  Enter a property address to find owner information, contact details, and property data.
                </p>
              </div>

              {/* Result */}
              {singleResult && (
                <div className="card animate-fade-in-up">
                  {/* Mock Data Banner in Result */}
                  {isMockResult && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span className="text-sm text-amber-500">
                        This is simulated demo data. Configure TLOXP_API_KEY for real skip trace results.
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-success-muted flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-success" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-foreground">
                          {singleResult.owner_name || 'Property Owner'}
                        </h3>
                        <p className="text-sm text-foreground-muted">{singleResult.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isMockResult && (
                        <span className="badge bg-amber-500/20 text-amber-500 text-xs">DEMO</span>
                      )}
                      {getStatusBadge(singleResult.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Phone Numbers */}
                    {singleResult.phones && singleResult.phones.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-foreground-muted uppercase mb-3">Phone Numbers</h4>
                        <div className="space-y-2">
                          {singleResult.phones.map((phone, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                              <div className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-success" />
                                <div>
                                  <span className="font-mono">{phone.number}</span>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="badge badge-secondary text-2xs">{phone.type}</span>
                                    <span className="text-2xs text-foreground-subtle">
                                      {phone.confidence}% confidence
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <button 
                                onClick={() => copyToClipboard(phone.number)}
                                className="btn btn-ghost btn-icon btn-sm"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Email Addresses */}
                    {singleResult.emails && singleResult.emails.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-foreground-muted uppercase mb-3">Email Addresses</h4>
                        <div className="space-y-2">
                          {singleResult.emails.map((email, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                              <div className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-warning" />
                                <div>
                                  <span>{email.address}</span>
                                  <div className="text-2xs text-foreground-subtle mt-0.5">
                                    {email.confidence}% confidence
                                  </div>
                                </div>
                              </div>
                              <button 
                                onClick={() => copyToClipboard(email.address)}
                                className="btn btn-ghost btn-icon btn-sm"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Property Info */}
                  {singleResult.property_info && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <h4 className="text-sm font-semibold text-foreground-muted uppercase mb-3">Property Information</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {singleResult.property_info.property_type && (
                          <div className="p-3 bg-muted rounded-lg">
                            <div className="text-xs text-foreground-subtle">Type</div>
                            <div className="font-medium">{singleResult.property_info.property_type}</div>
                          </div>
                        )}
                        {singleResult.property_info.year_built && (
                          <div className="p-3 bg-muted rounded-lg">
                            <div className="text-xs text-foreground-subtle">Year Built</div>
                            <div className="font-medium">{singleResult.property_info.year_built}</div>
                          </div>
                        )}
                        {singleResult.property_info.square_feet && (
                          <div className="p-3 bg-muted rounded-lg">
                            <div className="text-xs text-foreground-subtle">Sq Ft</div>
                            <div className="font-medium">{singleResult.property_info.square_feet.toLocaleString()}</div>
                          </div>
                        )}
                        {singleResult.property_info.estimated_value && (
                          <div className="p-3 bg-muted rounded-lg">
                            <div className="text-xs text-foreground-subtle">Est. Value</div>
                            <div className="font-medium font-mono">${singleResult.property_info.estimated_value.toLocaleString()}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-6 pt-6 border-t border-border flex items-center gap-3">
                    <button className="btn btn-primary">
                      <Users className="w-4 h-4" />
                      Create Lead
                    </button>
                    <button className="btn btn-outline">
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!singleResult && !isLoading && (
                <div className="card">
                  <div className="empty-state py-16">
                    <Search className="empty-state-icon" />
                    <div className="empty-state-title">Search for a Property</div>
                    <div className="empty-state-description">
                      Enter an address above to find property owner information, contact details, and more.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Batch Process Tab */}
          {activeTab === 'batch' && (
            <div className="max-w-6xl mx-auto animate-fade-in">
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-display font-semibold text-foreground">
                      Batch Skip Trace
                    </h2>
                    <p className="text-sm text-foreground-muted mt-1">
                      Select leads from your pipeline to run skip trace in bulk.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={selectAllWithoutPhone}
                      className="btn btn-outline btn-sm"
                    >
                      Select Without Phone
                    </button>
                    <button
                      onClick={handleBatchProcess}
                      disabled={selectedLeads.size === 0 || isLoading}
                      className="btn btn-primary btn-sm"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      Process {selectedLeads.size} Leads
                    </button>
                  </div>
                </div>

                {/* Leads Table */}
                {leads.length === 0 ? (
                  <div className="empty-state py-12">
                    <Users className="empty-state-icon" />
                    <div className="empty-state-title">No leads found</div>
                    <div className="empty-state-description">
                      Convert storm events to leads from the Storm Command page first.
                    </div>
                  </div>
                ) : (
                  <div className="overflow-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th className="w-12">
                            <input
                              type="checkbox"
                              checked={selectedLeads.size === leads.length}
                              onChange={() => {
                                if (selectedLeads.size === leads.length) {
                                  setSelectedLeads(new Set())
                                } else {
                                  setSelectedLeads(new Set(leads.map(l => l.id)))
                                }
                              }}
                              className="w-4 h-4 rounded"
                            />
                          </th>
                          <th>Name</th>
                          <th>Address</th>
                          <th>Status</th>
                          <th>Phone</th>
                          <th>Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads.map(lead => (
                          <tr 
                            key={lead.id}
                            className={selectedLeads.has(lead.id) ? 'bg-primary-muted/30' : ''}
                          >
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedLeads.has(lead.id)}
                                onChange={() => toggleLeadSelection(lead.id)}
                                className="w-4 h-4 rounded"
                              />
                            </td>
                            <td className="font-medium">{lead.name || 'Property Owner'}</td>
                            <td className="text-foreground-muted text-sm">{lead.property_address}</td>
                            <td>
                              <span className={`badge badge-stage-${lead.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                {lead.status}
                              </span>
                            </td>
                            <td>
                              {lead.phone ? (
                                <span className="font-mono text-sm">{lead.phone}</span>
                              ) : (
                                <span className="text-foreground-subtle text-sm">—</span>
                              )}
                            </td>
                            <td>
                              {lead.email ? (
                                <span className="text-sm truncate max-w-[200px] block">{lead.email}</span>
                              ) : (
                                <span className="text-foreground-subtle text-sm">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* History/Results Tab */}
          {activeTab === 'results' && (
            <div className="max-w-6xl mx-auto animate-fade-in">
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-display font-semibold text-foreground">
                      Skip Trace History
                    </h2>
                    <p className="text-sm text-foreground-muted mt-1">
                      View past skip trace lookups and their results.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={resultsFilter}
                      onChange={(e) => setResultsFilter(e.target.value as typeof resultsFilter)}
                      className="input select h-9 text-sm w-40"
                    >
                      <option value="all">All Results</option>
                      <option value="success">Found</option>
                      <option value="partial">Partial</option>
                      <option value="not_found">Not Found</option>
                    </select>
                  </div>
                </div>

                {filteredResults.length === 0 ? (
                  <div className="empty-state py-12">
                    <FileText className="empty-state-icon" />
                    <div className="empty-state-title">No history yet</div>
                    <div className="empty-state-description">
                      Skip trace lookups will appear here.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredResults.map(result => (
                      <div 
                        key={result.id}
                        className="p-4 bg-muted rounded-lg hover:bg-card-hover transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className={`
                              w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                              ${result.status === 'success' ? 'bg-success-muted' :
                                result.status === 'partial' ? 'bg-warning-muted' : 'bg-muted'}
                            `}>
                              {result.status === 'success' ? (
                                <CheckCircle className="w-5 h-5 text-success" />
                              ) : result.status === 'partial' ? (
                                <AlertCircle className="w-5 h-5 text-warning" />
                              ) : (
                                <XCircle className="w-5 h-5 text-foreground-subtle" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">
                                  {result.owner_name || 'Unknown Owner'}
                                </span>
                                {getStatusBadge(result.status)}
                              </div>
                              <p className="text-sm text-foreground-muted mt-0.5">{result.address}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-foreground-subtle">
                                {result.phones && result.phones.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {result.phones.length} phone{result.phones.length !== 1 ? 's' : ''}
                                  </span>
                                )}
                                {result.emails && result.emails.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {result.emails.length} email{result.emails.length !== 1 ? 's' : ''}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDistanceToNow(new Date(result.created_at), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button className="btn btn-ghost btn-icon btn-sm">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
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
