'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import AppLayout from '@/components/AppLayout'
import { 
  Cloud,
  MapPin,
  Building2,
  Layers,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Download,
  Search,
  Calendar,
  Maximize2,
  List,
  AlertTriangle,
  TrendingUp,
  Target,
  Zap
} from 'lucide-react'

// Dynamically import map to avoid SSR issues with Leaflet
const StormMap = dynamic(
  () => import('@/components/storm/StormMap').then(mod => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-foreground-muted">Loading storm map...</p>
        </div>
      </div>
    )
  }
)

interface StormEvent {
  id: string
  event_id?: string
  latitude: number
  longitude: number
  hail_size: number
  severity: string
  city?: string
  county?: string
  state?: string
  event_date: string
  damage_property?: string
  narrative?: string
  begin_lat?: number
  begin_lon?: number
  end_lat?: number
  end_lon?: number
}

interface Property {
  id: string
  street_address: string
  city: string
  state: string
  zip_code: string
  latitude: number
  longitude: number
  damage_probability?: number
  owner_name?: string
  lead_status?: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Hail size reference labels
const HAIL_SIZE_LABELS = [
  { size: 0.5, label: 'Pea' },
  { size: 1.0, label: 'Quarter' },
  { size: 1.5, label: 'Ping Pong' },
  { size: 1.75, label: 'Golf Ball' },
  { size: 2.5, label: 'Tennis Ball' },
  { size: 4.0, label: 'Softball' },
]

const getSizeLabel = (size: number): string => {
  const closest = HAIL_SIZE_LABELS.reduce((prev, curr) => 
    Math.abs(curr.size - size) < Math.abs(prev.size - size) ? curr : prev
  )
  return closest.label
}

export default function HailMapPage() {
  // Core state
  const [events, setEvents] = useState<StormEvent[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<StormEvent | null>(null)
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false)
  const [dateRange, setDateRange] = useState({ start: '2020-01-01', end: new Date().toISOString().split('T')[0] })
  const [sizeRange, setSizeRange] = useState({ min: 0.5, max: 4.5 })
  const [selectedCounty, setSelectedCounty] = useState<string>('')
  const [damageOnly, setDamageOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Layer toggles
  const [showStorms, setShowStorms] = useState(true)
  const [showProperties, setShowProperties] = useState(false)
  const [showPaths, setShowPaths] = useState(true)
  const [showHeatMap, setShowHeatMap] = useState(false)
  
  // Stats
  const [stats, setStats] = useState({
    totalStorms: 0,
    avgSize: 0,
    totalProperties: 0,
    damageReported: 0
  })

  // Unique counties from events
  const counties = useMemo(() => {
    const countySet = new Set(events.map(e => e.county).filter(Boolean))
    return Array.from(countySet).sort()
  }, [events])

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Date filter
      const eventDate = new Date(event.event_date)
      const startDate = new Date(dateRange.start)
      const endDate = new Date(dateRange.end)
      if (eventDate < startDate || eventDate > endDate) return false
      
      // Size filter
      if (event.hail_size < sizeRange.min || event.hail_size > sizeRange.max) return false
      
      // County filter
      if (selectedCounty && event.county !== selectedCounty) return false
      
      // Damage filter
      if (damageOnly && (!event.damage_property || event.damage_property === '0')) return false
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesCity = event.city?.toLowerCase().includes(query)
        const matchesCounty = event.county?.toLowerCase().includes(query)
        if (!matchesCity && !matchesCounty) return false
      }
      
      return true
    })
  }, [events, dateRange, sizeRange, selectedCounty, damageOnly, searchQuery])

  // Fetch storm events
  const fetchEvents = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('limit', '5000')
      
      const response = await fetch(`${API_URL}/api/hail?${params}`)
      const data = await response.json()
      
      if (data.success && data.data) {
        setEvents(data.data)
        
        // Calculate stats
        const validEvents = data.data.filter((e: StormEvent) => e.hail_size > 0)
        setStats({
          totalStorms: validEvents.length,
          avgSize: validEvents.length > 0 
            ? validEvents.reduce((sum: number, e: StormEvent) => sum + e.hail_size, 0) / validEvents.length 
            : 0,
          totalProperties: 0,
          damageReported: validEvents.filter((e: StormEvent) => e.damage_property && e.damage_property !== '0').length
        })
      }
    } catch (error) {
      console.error('Error fetching storm events:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch properties
  const fetchProperties = useCallback(async () => {
    if (!showProperties) return
    
    try {
      const response = await fetch(`${API_URL}/api/properties?limit=1000`)
      const data = await response.json()
      
      if (data.success && data.data) {
        setProperties(data.data)
        setStats(prev => ({ ...prev, totalProperties: data.data.length }))
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
    }
  }, [showProperties])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  useEffect(() => {
    if (showProperties) {
      fetchProperties()
    }
  }, [showProperties, fetchProperties])

  // Handle event selection from map
  const handleEventSelect = (event: StormEvent) => {
    setSelectedEvent(event)
  }

  // Quick filter presets
  const setDatePreset = (preset: string) => {
    const today = new Date()
    let start: Date
    
    switch (preset) {
      case '30days':
        start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90days':
        start = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '2024':
        start = new Date('2024-01-01')
        break
      case '2023':
        start = new Date('2023-01-01')
        setDateRange({ start: '2023-01-01', end: '2023-12-31' })
        return
      case 'all':
      default:
        start = new Date('2020-01-01')
    }
    
    setDateRange({ 
      start: start.toISOString().split('T')[0], 
      end: today.toISOString().split('T')[0] 
    })
  }

  // Clear all filters
  const clearFilters = () => {
    setDateRange({ start: '2020-01-01', end: new Date().toISOString().split('T')[0] })
    setSizeRange({ min: 0.5, max: 4.5 })
    setSelectedCounty('')
    setDamageOnly(false)
    setSearchQuery('')
  }

  return (
    <AppLayout>
      <div className="h-full w-full flex flex-col relative overflow-hidden">
        {/* Compact Stats Bar - Floating above map */}
        <div className="absolute top-4 left-20 z-[60] pointer-events-none">
          <div className="glass rounded-lg border border-border px-4 py-2 shadow-lg pointer-events-auto">
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-mono text-foreground">
                  <span className="text-primary font-bold">{filteredEvents.length.toLocaleString()}</span>
                  <span className="text-foreground-muted ml-1">storms</span>
                </span>
              </div>
              <div className="h-4 w-px bg-border" />
              <span className="text-sm font-mono text-foreground">
                <span className="text-warning font-bold">{stats.avgSize.toFixed(1)}"</span>
                <span className="text-foreground-muted ml-1">avg</span>
              </span>
              <div className="h-4 w-px bg-border" />
              <span className="text-sm font-mono text-foreground">
                <span className="text-destructive font-bold">{stats.damageReported}</span>
                <span className="text-foreground-muted ml-1">damage</span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions Bar - Floating top right */}
        <div className="absolute top-4 right-4 z-[60] pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-outline glass'}`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {(selectedCounty || damageOnly || searchQuery) && (
                <span className="w-2 h-2 rounded-full bg-primary" />
              )}
            </button>
            
            <button
              onClick={() => {
                fetchEvents()
                if (showProperties) fetchProperties()
              }}
              className="btn btn-ghost btn-sm btn-icon glass"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <Link href="/storms" className="btn btn-outline btn-sm hidden sm:flex glass">
              <List className="w-4 h-4" />
              Storms List
            </Link>
          </div>
        </div>

        {/* Main Content - Full Screen Map */}
        <div className="flex-1 relative overflow-hidden w-full h-full">
        {/* Map */}
        <StormMap
          events={showStorms ? filteredEvents : []}
          selectedEvent={selectedEvent}
          onEventSelect={handleEventSelect}
          className="h-full w-full"
        />

        {/* Floating Filter Panel */}
        {showFilters && (
          <div className="absolute top-4 left-4 z-[1000] w-80 max-h-[calc(100vh-120px)] overflow-y-auto">
            <div className="glass rounded-xl border border-border shadow-xl">
              {/* Filter Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-display font-semibold text-foreground">Filters</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={clearFilters}
                    className="text-xs text-primary hover:underline"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="btn btn-ghost btn-icon btn-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filter Content */}
              <div className="p-4 space-y-5">
                {/* Search */}
                <div>
                  <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider block mb-2">
                    Search Location
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-subtle" />
                    <input
                      type="text"
                      placeholder="City or county..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input pl-9 h-9 w-full"
                    />
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider block mb-2">
                    Date Range
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="input h-9 flex-1 text-xs"
                    />
                    <span className="text-foreground-subtle self-center">to</span>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="input h-9 flex-1 text-xs"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {['30days', '90days', '2024', '2023', 'all'].map(preset => (
                      <button
                        key={preset}
                        onClick={() => setDatePreset(preset)}
                        className="px-2 py-1 text-xs rounded bg-muted hover:bg-secondary text-foreground-muted hover:text-foreground transition-colors"
                      >
                        {preset === '30days' ? '30 Days' : 
                         preset === '90days' ? '90 Days' : 
                         preset === 'all' ? 'All Time' : preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hail Size Range */}
                <div>
                  <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider block mb-2">
                    Hail Size: {sizeRange.min}" - {sizeRange.max}"
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-foreground-subtle w-8">Min</span>
                      <input
                        type="range"
                        min="0.5"
                        max="4.5"
                        step="0.25"
                        value={sizeRange.min}
                        onChange={(e) => setSizeRange(prev => ({ 
                          ...prev, 
                          min: Math.min(parseFloat(e.target.value), prev.max - 0.25) 
                        }))}
                        className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #fbbf24 0%, #f97316 33%, #ef4444 66%, #991b1b 100%)`
                        }}
                      />
                      <span className="text-xs font-mono text-foreground w-10">{sizeRange.min}"</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-foreground-subtle w-8">Max</span>
                      <input
                        type="range"
                        min="0.5"
                        max="4.5"
                        step="0.25"
                        value={sizeRange.max}
                        onChange={(e) => setSizeRange(prev => ({ 
                          ...prev, 
                          max: Math.max(parseFloat(e.target.value), prev.min + 0.25) 
                        }))}
                        className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #fbbf24 0%, #f97316 33%, #ef4444 66%, #991b1b 100%)`
                        }}
                      />
                      <span className="text-xs font-mono text-foreground w-10">{sizeRange.max}"</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] text-foreground-subtle mt-1 px-8">
                    <span>Pea</span>
                    <span>Quarter</span>
                    <span>Golf Ball</span>
                    <span>Softball</span>
                  </div>
                </div>

                {/* County Filter */}
                <div>
                  <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider block mb-2">
                    County
                  </label>
                  <select
                    value={selectedCounty}
                    onChange={(e) => setSelectedCounty(e.target.value)}
                    className="input select h-9 w-full text-sm"
                  >
                    <option value="">All Counties</option>
                    {counties.map(county => (
                      <option key={county} value={county}>{county}</option>
                    ))}
                  </select>
                </div>

                {/* Damage Filter */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={damageOnly}
                    onChange={(e) => setDamageOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-foreground-subtle text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-sm text-foreground">Damage Reported Only</span>
                    <p className="text-xs text-foreground-subtle">Show only storms with property damage</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Layer Controls */}
        <div className="absolute top-4 right-16 z-[1000]">
          <div className="glass rounded-lg border border-border p-1 shadow-lg flex gap-1">
            <button
              onClick={() => setShowStorms(!showStorms)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-all flex items-center gap-1.5 ${
                showStorms ? 'bg-primary text-primary-foreground' : 'text-foreground-muted hover:text-foreground hover:bg-muted'
              }`}
              title="Toggle Storm Markers"
            >
              <Cloud className="w-3.5 h-3.5" />
              Storms
            </button>
            <button
              onClick={() => setShowProperties(!showProperties)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-all flex items-center gap-1.5 ${
                showProperties ? 'bg-accent text-accent-foreground' : 'text-foreground-muted hover:text-foreground hover:bg-muted'
              }`}
              title="Toggle Properties"
            >
              <Building2 className="w-3.5 h-3.5" />
              Properties
            </button>
            <button
              onClick={() => setShowPaths(!showPaths)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-all flex items-center gap-1.5 ${
                showPaths ? 'bg-warning text-warning-foreground' : 'text-foreground-muted hover:text-foreground hover:bg-muted'
              }`}
              title="Toggle Storm Paths"
            >
              <Zap className="w-3.5 h-3.5" />
              Paths
            </button>
          </div>
        </div>

        {/* Selected Event Panel */}
        {selectedEvent && (
          <div className="absolute bottom-4 left-4 z-[1000] w-80 animate-slide-in-left">
            <div className="glass rounded-xl border border-border shadow-xl overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`
                        badge text-xs
                        ${selectedEvent.hail_size >= 2.5 ? 'badge-hail-extreme' :
                          selectedEvent.hail_size >= 2.0 ? 'badge-hail-severe' :
                          selectedEvent.hail_size >= 1.5 ? 'badge-hail-significant' :
                          selectedEvent.hail_size >= 1.0 ? 'badge-hail-moderate' :
                          'badge-hail-minor'}
                      `}>
                        {selectedEvent.hail_size >= 2.5 ? 'Extreme' :
                         selectedEvent.hail_size >= 2.0 ? 'Severe' :
                         selectedEvent.hail_size >= 1.5 ? 'Significant' :
                         selectedEvent.hail_size >= 1.0 ? 'Moderate' : 'Minor'}
                      </span>
                      {selectedEvent.damage_property && selectedEvent.damage_property !== '0' && (
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                      )}
                    </div>
                    <h4 className="font-display font-semibold text-foreground">
                      {selectedEvent.city || 'Unknown'}, {selectedEvent.county}
                    </h4>
                  </div>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="btn btn-ghost btn-icon btn-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-2 bg-muted rounded-lg">
                    <div className="text-[10px] text-foreground-subtle uppercase">Hail Size</div>
                    <div className="font-mono text-xl font-bold text-foreground">{selectedEvent.hail_size}"</div>
                    <div className="text-xs text-foreground-muted">{getSizeLabel(selectedEvent.hail_size)}</div>
                  </div>
                  <div className="p-2 bg-muted rounded-lg">
                    <div className="text-[10px] text-foreground-subtle uppercase">Date</div>
                    <div className="font-mono text-sm font-semibold text-foreground">
                      {new Date(selectedEvent.event_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/storms/${selectedEvent.id}`}
                    className="btn btn-primary btn-sm flex-1"
                  >
                    <Target className="w-4 h-4" />
                    View Details
                  </Link>
                  <Link
                    href={`/skip-trace?lat=${selectedEvent.latitude}&lng=${selectedEvent.longitude}&address=${encodeURIComponent(`${selectedEvent.city || ''}, ${selectedEvent.county} County, WI`)}`}
                    className="btn btn-outline btn-sm flex-1"
                  >
                    <Search className="w-4 h-4" />
                    Skip Trace
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Stats Bar */}
        <div className="absolute bottom-4 right-4 z-[1000]">
          <div className="glass rounded-lg border border-border px-4 py-2 shadow-lg">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-hail-minor" />
                <span className="text-foreground-muted">&lt;1"</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-hail-moderate" />
                <span className="text-foreground-muted">1-1.5"</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-hail-significant" />
                <span className="text-foreground-muted">1.5-2"</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-hail-severe" />
                <span className="text-foreground-muted">2-2.5"</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-hail-extreme" />
                <span className="text-foreground-muted">&gt;2.5"</span>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && events.length === 0 && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[2000]">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h3 className="font-display font-semibold text-foreground mb-2">Loading Storm Data</h3>
              <p className="text-sm text-foreground-muted">Fetching NOAA historical hail events...</p>
            </div>
          </div>
        )}
        </div>
      </div>
    </AppLayout>
  )
}
