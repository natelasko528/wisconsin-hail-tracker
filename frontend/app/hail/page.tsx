'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { 
  CloudLightning, Search, Filter, Upload, Download, Users, 
  Calendar, MapPin, Ruler, AlertTriangle, ChevronLeft, ChevronRight,
  X, Check, Loader2, FileText, Map as MapIcon, Table
} from 'lucide-react'

// Dynamically import the map to avoid SSR issues with Leaflet
const HailMap = dynamic(() => import('@/components/HailMap'), { 
  ssr: false,
  loading: () => <div className="h-[400px] bg-muted rounded-lg flex items-center justify-center">Loading map...</div>
})

interface StormEvent {
  id: string
  event_id: string
  event_date: string
  city: string
  county: string
  state: string
  latitude: number
  longitude: number
  hail_size: number
  severity: 'critical' | 'high' | 'medium' | 'low'
  damage_property?: string
  narrative?: string
  year?: number
  month?: string
}

interface FilterState {
  startDate: string
  endDate: string
  state: string
  county: string
  city: string
  minSize: string
  maxSize: string
  severity: string[]
  hasDamage: boolean
}

const SEVERITY_COLORS = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200'
}

const WISCONSIN_COUNTIES = [
  'ADAMS', 'ASHLAND', 'BARRON', 'BAYFIELD', 'BROWN', 'BUFFALO', 'BURNETT', 'CALUMET',
  'CHIPPEWA', 'CLARK', 'COLUMBIA', 'CRAWFORD', 'DANE', 'DODGE', 'DOOR', 'DOUGLAS',
  'DUNN', 'EAU CLAIRE', 'FLORENCE', 'FOND DU LAC', 'FOREST', 'GRANT', 'GREEN',
  'GREEN LAKE', 'IOWA', 'IRON', 'JACKSON', 'JEFFERSON', 'JUNEAU', 'KENOSHA',
  'KEWAUNEE', 'LA CROSSE', 'LAFAYETTE', 'LANGLADE', 'LINCOLN', 'MANITOWOC',
  'MARATHON', 'MARINETTE', 'MARQUETTE', 'MENOMINEE', 'MILWAUKEE', 'MONROE',
  'OCONTO', 'ONEIDA', 'OUTAGAMIE', 'OZAUKEE', 'PEPIN', 'PIERCE', 'POLK', 'PORTAGE',
  'PRICE', 'RACINE', 'RICHLAND', 'ROCK', 'RUSK', 'SAUK', 'SAWYER', 'SHAWANO',
  'SHEBOYGAN', 'ST. CROIX', 'TAYLOR', 'TREMPEALEAU', 'VERNON', 'VILAS', 'WALWORTH',
  'WASHBURN', 'WASHINGTON', 'WAUKESHA', 'WAUPACA', 'WAUSHARA', 'WINNEBAGO', 'WOOD'
]

export default function HailPage() {
  const [storms, setStorms] = useState<StormEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [pageSize] = useState(50)
  const [selectedStorms, setSelectedStorms] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table')
  const [showFilters, setShowFilters] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [stats, setStats] = useState<any>(null)
  
  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    state: 'WI',
    county: '',
    city: '',
    minSize: '',
    maxSize: '',
    severity: [],
    hasDamage: false
  })

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  // Fetch storm data
  const fetchStorms = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.state) params.append('state', filters.state)
      if (filters.county) params.append('county', filters.county)
      if (filters.city) params.append('city', filters.city)
      if (filters.minSize) params.append('minSize', filters.minSize)
      if (filters.maxSize) params.append('maxSize', filters.maxSize)
      if (filters.severity.length > 0) params.append('severity', filters.severity.join(','))
      if (filters.hasDamage) params.append('hasDamage', 'true')
      params.append('limit', String(pageSize))
      params.append('offset', String(page * pageSize))

      const response = await fetch(`${apiUrl}/api/hail/search?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setStorms(data.data || [])
        setTotalCount(data.count || 0)
      }
    } catch (error) {
      console.error('Error fetching storms:', error)
    } finally {
      setLoading(false)
    }
  }, [apiUrl, filters, page, pageSize])

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.state) params.append('state', filters.state)
      if (filters.county) params.append('county', filters.county)

      const response = await fetch(`${apiUrl}/api/hail/stats?${params}`)
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [apiUrl, filters.startDate, filters.endDate, filters.state, filters.county])

  useEffect(() => {
    fetchStorms()
    fetchStats()
  }, [fetchStorms, fetchStats])

  // Handle filter changes
  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(0) // Reset to first page on filter change
  }

  // Toggle severity filter
  const toggleSeverity = (sev: string) => {
    setFilters(prev => ({
      ...prev,
      severity: prev.severity.includes(sev)
        ? prev.severity.filter(s => s !== sev)
        : [...prev.severity, sev]
    }))
    setPage(0)
  }

  // Toggle storm selection
  const toggleStormSelection = (id: string) => {
    setSelectedStorms(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // Select all visible storms
  const selectAllVisible = () => {
    if (selectedStorms.size === storms.length) {
      setSelectedStorms(new Set())
    } else {
      setSelectedStorms(new Set(storms.map(s => s.id)))
    }
  }

  // Export to CSV
  const handleExport = () => {
    const params = new URLSearchParams()
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)
    if (filters.state) params.append('state', filters.state)
    if (filters.county) params.append('county', filters.county)
    if (filters.minSize) params.append('minSize', filters.minSize)
    if (filters.severity.length > 0) params.append('severity', filters.severity.join(','))
    
    window.open(`${apiUrl}/api/hail/export?${params}`, '_blank')
  }

  // Reset filters
  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      state: 'WI',
      county: '',
      city: '',
      minSize: '',
      maxSize: '',
      severity: [],
      hasDamage: false
    })
    setPage(0)
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard" 
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
              >
                ← Dashboard
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <CloudLightning size={24} className="text-primary" />
                <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Hail Storm Search</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowUploadModal(true)}
                className="btn-outline flex items-center gap-2"
              >
                <Upload size={18} />
                <span className="hidden sm:inline">Import CSV</span>
              </button>
              <button 
                onClick={handleExport}
                className="btn-outline flex items-center gap-2"
              >
                <Download size={18} />
                <span className="hidden sm:inline">Export</span>
              </button>
              {selectedStorms.size > 0 && (
                <button 
                  onClick={() => setShowConvertModal(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Users size={18} />
                  Convert to Leads ({selectedStorms.size})
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{stats.totalReports}</div>
              <div className="text-xs text-muted-foreground">Total Events</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{stats.averageSize}"</div>
              <div className="text-xs text-muted-foreground">Avg Size</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.severityBreakdown?.critical || 0}</div>
              <div className="text-xs text-muted-foreground">Critical</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.severityBreakdown?.high || 0}</div>
              <div className="text-xs text-muted-foreground">High</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.severityBreakdown?.medium || 0}</div>
              <div className="text-xs text-muted-foreground">Medium</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.severityBreakdown?.low || 0}</div>
              <div className="text-xs text-muted-foreground">Low</div>
            </div>
          </div>
        )}

        <div className="flex gap-6">
          {/* Filter Panel */}
          {showFilters && (
            <div className="w-72 flex-shrink-0">
              <div className="card p-5 sticky top-24">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <Filter size={18} />
                    Filters
                  </h2>
                  <button onClick={resetFilters} className="text-xs text-primary hover:underline">
                    Reset
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Date Range */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                      <Calendar size={14} className="inline mr-1" />
                      Date Range
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        className="input text-sm"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      />
                      <input
                        type="date"
                        className="input text-sm"
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* State */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                      State
                    </label>
                    <select
                      className="input text-sm w-full"
                      value={filters.state}
                      onChange={(e) => handleFilterChange('state', e.target.value)}
                    >
                      <option value="">All States</option>
                      <option value="WI">Wisconsin</option>
                      <option value="IL">Illinois</option>
                      <option value="MN">Minnesota</option>
                      <option value="IA">Iowa</option>
                      <option value="MI">Michigan</option>
                    </select>
                  </div>

                  {/* County */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                      <MapPin size={14} className="inline mr-1" />
                      County
                    </label>
                    <select
                      className="input text-sm w-full"
                      value={filters.county}
                      onChange={(e) => handleFilterChange('county', e.target.value)}
                    >
                      <option value="">All Counties</option>
                      {WISCONSIN_COUNTIES.map(county => (
                        <option key={county} value={county}>{county}</option>
                      ))}
                    </select>
                  </div>

                  {/* City Search */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                      City/Location
                    </label>
                    <input
                      type="text"
                      className="input text-sm w-full"
                      placeholder="Search city..."
                      value={filters.city}
                      onChange={(e) => handleFilterChange('city', e.target.value)}
                    />
                  </div>

                  {/* Hail Size */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                      <Ruler size={14} className="inline mr-1" />
                      Hail Size (inches)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        className="input text-sm"
                        placeholder="Min"
                        step="0.25"
                        min="0"
                        value={filters.minSize}
                        onChange={(e) => handleFilterChange('minSize', e.target.value)}
                      />
                      <input
                        type="number"
                        className="input text-sm"
                        placeholder="Max"
                        step="0.25"
                        min="0"
                        value={filters.maxSize}
                        onChange={(e) => handleFilterChange('maxSize', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Severity */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                      <AlertTriangle size={14} className="inline mr-1" />
                      Severity
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['critical', 'high', 'medium', 'low'].map(sev => (
                        <button
                          key={sev}
                          onClick={() => toggleSeverity(sev)}
                          className={`badge text-xs cursor-pointer ${
                            filters.severity.includes(sev) 
                              ? SEVERITY_COLORS[sev as keyof typeof SEVERITY_COLORS]
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {sev}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Has Damage */}
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.hasDamage}
                        onChange={(e) => handleFilterChange('hasDamage', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">With property damage</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* View Toggle & Search Summary */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="btn-ghost text-sm"
                >
                  <Filter size={16} className="mr-1" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
                <span className="text-sm text-muted-foreground">
                  {totalCount.toLocaleString()} events found
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded ${viewMode === 'table' ? 'bg-primary text-white' : 'bg-muted'}`}
                >
                  <Table size={18} />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`p-2 rounded ${viewMode === 'map' ? 'bg-primary text-white' : 'bg-muted'}`}
                >
                  <MapIcon size={18} />
                </button>
              </div>
            </div>

            {/* Results */}
            {loading ? (
              <div className="card p-12 text-center">
                <Loader2 className="animate-spin mx-auto mb-4 text-primary" size={32} />
                <p className="text-muted-foreground">Loading storm events...</p>
              </div>
            ) : storms.length === 0 ? (
              <div className="card p-12 text-center">
                <CloudLightning className="mx-auto mb-4 text-muted-foreground" size={48} />
                <p className="text-lg font-medium text-foreground mb-2">No storm events found</p>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or import NOAA storm data
                </p>
                <button onClick={() => setShowUploadModal(true)} className="btn-primary">
                  <Upload size={18} className="mr-2" />
                  Import NOAA CSV
                </button>
              </div>
            ) : viewMode === 'table' ? (
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="w-10">
                          <input
                            type="checkbox"
                            checked={selectedStorms.size === storms.length && storms.length > 0}
                            onChange={selectAllVisible}
                            className="rounded"
                          />
                        </th>
                        <th>Date</th>
                        <th>Location</th>
                        <th>County</th>
                        <th className="text-center">Size</th>
                        <th className="text-center">Severity</th>
                        <th>Damage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storms.map(storm => (
                        <tr key={storm.id} className="hover:bg-muted/30">
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedStorms.has(storm.id)}
                              onChange={() => toggleStormSelection(storm.id)}
                              className="rounded"
                            />
                          </td>
                          <td className="whitespace-nowrap">
                            {storm.event_date ? new Date(storm.event_date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="max-w-[200px] truncate" title={storm.city}>
                            {storm.city || 'Unknown'}
                          </td>
                          <td>{storm.county}</td>
                          <td className="text-center font-mono font-bold">
                            {storm.hail_size}"
                          </td>
                          <td className="text-center">
                            <span className={`badge ${SEVERITY_COLORS[storm.severity]}`}>
                              {storm.severity}
                            </span>
                          </td>
                          <td className="text-sm text-muted-foreground max-w-[150px] truncate">
                            {storm.damage_property || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t border-border">
                    <span className="text-sm text-muted-foreground">
                      Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalCount)} of {totalCount}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="btn-outline p-2 disabled:opacity-50"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <span className="text-sm">
                        Page {page + 1} of {totalPages}
                      </span>
                      <button
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="btn-outline p-2 disabled:opacity-50"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card overflow-hidden">
                <HailMap 
                  storms={storms} 
                  selectedStorms={selectedStorms}
                  onStormSelect={toggleStormSelection}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <CSVUploadModal 
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false)
            fetchStorms()
            fetchStats()
          }}
          apiUrl={apiUrl}
        />
      )}

      {/* Convert to Leads Modal */}
      {showConvertModal && (
        <ConvertToLeadsModal
          stormIds={Array.from(selectedStorms)}
          onClose={() => setShowConvertModal(false)}
          onSuccess={() => {
            setShowConvertModal(false)
            setSelectedStorms(new Set())
          }}
          apiUrl={apiUrl}
        />
      )}
    </div>
  )
}

// CSV Upload Modal Component
function CSVUploadModal({ onClose, onSuccess, apiUrl }: { onClose: () => void, onSuccess: () => void, apiUrl: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${apiUrl}/api/hail/import`, {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Upload size={20} className="text-primary" />
            Import NOAA Storm Data
          </h2>
          <button onClick={onClose} className="btn-ghost p-2 rounded-full">
            <X size={20} />
          </button>
        </div>

        {!result ? (
          <>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-4">
                Upload a CSV file from the NOAA Storm Events Database. You can download historical data from{' '}
                <a 
                  href="https://www.ncei.noaa.gov/pub/data/swdi/stormevents/csvfiles/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  NOAA NCEI
                </a>.
              </p>

              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  file ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
              >
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="text-primary" size={24} />
                    <div className="text-left">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button onClick={() => setFile(null)} className="btn-ghost p-1">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload className="mx-auto mb-2 text-muted-foreground" size={32} />
                    <p className="font-medium">Click to upload or drag and drop</p>
                    <p className="text-sm text-muted-foreground">CSV files only (max 50MB)</p>
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </label>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-100 text-red-800 text-sm mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={onClose} className="btn-outline flex-1">
                Cancel
              </button>
              <button 
                onClick={handleUpload} 
                disabled={!file || uploading}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Import
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="text-green-600" size={32} />
            </div>
            <h3 className="text-lg font-semibold mb-2">Import Complete!</h3>
            <div className="text-sm text-muted-foreground space-y-1 mb-6">
              <p>Processed: {result.stats?.totalProcessed || 0} records</p>
              <p>Inserted: {result.stats?.inserted || 0} new events</p>
              {result.stats?.errors > 0 && (
                <p className="text-red-600">Errors: {result.stats.errors}</p>
              )}
            </div>
            <button onClick={onSuccess} className="btn-primary w-full">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Convert to Leads Modal Component
function ConvertToLeadsModal({ stormIds, onClose, onSuccess, apiUrl }: { stormIds: string[], onClose: () => void, onSuccess: () => void, apiUrl: string }) {
  const [converting, setConverting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleConvert = async () => {
    setConverting(true)
    setError(null)

    try {
      const response = await fetch(`${apiUrl}/api/hail/convert-to-leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stormEventIds: stormIds })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Conversion failed')
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setConverting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users size={20} className="text-primary" />
            Convert to Leads
          </h2>
          <button onClick={onClose} className="btn-ghost p-2 rounded-full">
            <X size={20} />
          </button>
        </div>

        {!result ? (
          <>
            <p className="text-muted-foreground mb-6">
              You are about to create <span className="font-semibold text-foreground">{stormIds.length}</span> new leads 
              from the selected storm events. Each lead will be pre-populated with location and hail size data.
            </p>

            {error && (
              <div className="p-3 rounded-lg bg-red-100 text-red-800 text-sm mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={onClose} className="btn-outline flex-1">
                Cancel
              </button>
              <button 
                onClick={handleConvert}
                disabled={converting}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {converting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Converting...
                  </>
                ) : (
                  <>
                    <Users size={18} />
                    Create {stormIds.length} Leads
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="text-green-600" size={32} />
            </div>
            <h3 className="text-lg font-semibold mb-2">Leads Created!</h3>
            <p className="text-muted-foreground mb-6">
              Successfully created {result.leads?.length || 0} new leads.
            </p>
            <div className="flex gap-3">
              <button onClick={onSuccess} className="btn-outline flex-1">
                Close
              </button>
              <Link href="/leads" className="btn-primary flex-1 flex items-center justify-center gap-2">
                View Leads
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
