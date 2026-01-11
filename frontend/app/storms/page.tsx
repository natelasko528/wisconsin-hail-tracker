'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import AppLayout from '@/components/AppLayout'
import { 
  Cloud,
  MapPin,
  Calendar,
  Download,
  Filter,
  Search,
  Grid3X3,
  List,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  ExternalLink,
  ArrowUpDown,
  AlertTriangle,
  TrendingUp,
  Map
} from 'lucide-react'
import { format } from 'date-fns'

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
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Severity badge helper
const getSeverityBadge = (size: number) => {
  if (size >= 2.5) return { label: 'Extreme', class: 'badge-hail-extreme', color: '#991b1b' }
  if (size >= 2.0) return { label: 'Severe', class: 'badge-hail-severe', color: '#dc2626' }
  if (size >= 1.5) return { label: 'Significant', class: 'badge-hail-significant', color: '#ef4444' }
  if (size >= 1.0) return { label: 'Moderate', class: 'badge-hail-moderate', color: '#f97316' }
  return { label: 'Minor', class: 'badge-hail-minor', color: '#fbbf24' }
}

// Hail size reference
const getSizeReference = (size: number): string => {
  if (size >= 4.0) return 'Softball'
  if (size >= 2.5) return 'Tennis Ball'
  if (size >= 1.75) return 'Golf Ball'
  if (size >= 1.5) return 'Ping Pong'
  if (size >= 1.0) return 'Quarter'
  return 'Pea'
}

export default function StormsPage() {
  // State
  const [storms, setStorms] = useState<StormEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [selectedStorms, setSelectedStorms] = useState<Set<string>>(new Set())
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [sizeRange, setSizeRange] = useState({ min: '', max: '' })
  const [selectedCounty, setSelectedCounty] = useState('')
  const [damageOnly, setDamageOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  
  // Sorting
  const [sortBy, setSortBy] = useState<'date' | 'size' | 'county'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Get unique counties
  const counties = useMemo(() => {
    const countySet = new Set(storms.map(s => s.county).filter(Boolean))
    return Array.from(countySet).sort() as string[]
  }, [storms])

  // Filtered and sorted storms
  const filteredStorms = useMemo(() => {
    let result = storms.filter(storm => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesCity = storm.city?.toLowerCase().includes(query)
        const matchesCounty = storm.county?.toLowerCase().includes(query)
        if (!matchesCity && !matchesCounty) return false
      }
      
      // Date filter
      if (dateRange.start) {
        const stormDate = new Date(storm.event_date)
        const startDate = new Date(dateRange.start)
        if (stormDate < startDate) return false
      }
      if (dateRange.end) {
        const stormDate = new Date(storm.event_date)
        const endDate = new Date(dateRange.end)
        if (stormDate > endDate) return false
      }
      
      // Size filter
      if (sizeRange.min && storm.hail_size < parseFloat(sizeRange.min)) return false
      if (sizeRange.max && storm.hail_size > parseFloat(sizeRange.max)) return false
      
      // County filter
      if (selectedCounty && storm.county !== selectedCounty) return false
      
      // Damage filter
      if (damageOnly && (!storm.damage_property || storm.damage_property === '0')) return false
      
      return true
    })
    
    // Sort
    result.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'size':
          comparison = a.hail_size - b.hail_size
          break
        case 'county':
          comparison = (a.county || '').localeCompare(b.county || '')
          break
        case 'date':
        default:
          comparison = new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
      }
      return sortOrder === 'desc' ? -comparison : comparison
    })
    
    return result
  }, [storms, searchQuery, dateRange, sizeRange, selectedCounty, damageOnly, sortBy, sortOrder])

  // Fetch storms
  const fetchStorms = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/hail?limit=5000`)
      const data = await response.json()
      
      if (data.success && data.data) {
        setStorms(data.data)
      }
    } catch (error) {
      console.error('Error fetching storms:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStorms()
  }, [fetchStorms])

  // Selection handlers
  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedStorms)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedStorms(newSelection)
  }

  const selectAll = () => {
    if (selectedStorms.size === filteredStorms.length) {
      setSelectedStorms(new Set())
    } else {
      setSelectedStorms(new Set(filteredStorms.map(s => s.id)))
    }
  }

  // Export CSV
  const exportCSV = () => {
    const stormsToExport = selectedStorms.size > 0 
      ? filteredStorms.filter(s => selectedStorms.has(s.id))
      : filteredStorms
    
    const headers = ['Event ID', 'Date', 'City', 'County', 'State', 'Hail Size (in)', 'Severity', 'Damage', 'Latitude', 'Longitude']
    const rows = stormsToExport.map(s => [
      s.event_id || s.id,
      format(new Date(s.event_date), 'yyyy-MM-dd'),
      s.city || '',
      s.county || '',
      s.state || 'WI',
      s.hail_size,
      getSeverityBadge(s.hail_size).label,
      s.damage_property || '',
      s.latitude,
      s.longitude
    ])
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `storms_export_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Convert to leads
  const convertToLeads = async () => {
    if (selectedStorms.size === 0) return
    
    try {
      const response = await fetch(`${API_URL}/api/hail/convert-to-leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stormEventIds: Array.from(selectedStorms) })
      })
      
      const data = await response.json()
      if (data.success) {
        alert(`Created ${data.leads?.length || 0} leads from ${selectedStorms.size} storms!`)
        setSelectedStorms(new Set())
      }
    } catch (error) {
      console.error('Error converting to leads:', error)
      alert('Failed to convert storms to leads')
    }
  }

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('')
    setDateRange({ start: '', end: '' })
    setSizeRange({ min: '', max: '' })
    setSelectedCounty('')
    setDamageOnly(false)
  }

  const hasActiveFilters = searchQuery || dateRange.start || dateRange.end || sizeRange.min || sizeRange.max || selectedCounty || damageOnly

  // Sort toggle handler
  const toggleSort = (column: 'date' | 'size' | 'county') => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  return (
    <AppLayout>
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 border-b border-border bg-background-secondary/50 backdrop-blur">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-primary" />
                <h1 className="font-display text-lg font-bold text-foreground">
                  Storm Events
                </h1>
              </div>
              <span className="badge badge-primary">
                {filteredStorms.length.toLocaleString()} storms
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex items-center bg-muted rounded-lg p-1">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded ${viewMode === 'cards' ? 'bg-background shadow' : ''}`}
                  title="Card View"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-background shadow' : ''}`}
                  title="Table View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn btn-sm ${showFilters || hasActiveFilters ? 'btn-primary' : 'btn-outline'}`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-white" />}
              </button>
              
              <button onClick={exportCSV} className="btn btn-outline btn-sm">
                <Download className="w-4 h-4" />
                Export
              </button>
              
              <Link href="/" className="btn btn-outline btn-sm">
                <Map className="w-4 h-4" />
                Map View
              </Link>
            </div>
          </div>
          
          {/* Selection actions bar */}
          {selectedStorms.size > 0 && (
            <div className="px-4 py-2 bg-primary-muted border-t border-primary/20 flex items-center justify-between">
              <span className="text-sm text-primary font-medium">
                {selectedStorms.size} storm{selectedStorms.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportCSV}
                  className="btn btn-sm btn-outline"
                >
                  <Download className="w-4 h-4" />
                  Export Selected
                </button>
                <button
                  onClick={convertToLeads}
                  className="btn btn-sm btn-primary"
                >
                  <TrendingUp className="w-4 h-4" />
                  Convert to Leads
                </button>
                <button
                  onClick={() => setSelectedStorms(new Set())}
                  className="btn btn-sm btn-ghost"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              </div>
            </div>
          )}
          
          {/* Filters bar */}
          {showFilters && (
            <div className="px-4 py-3 border-t border-border bg-muted/30 animate-fade-in-down">
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-subtle" />
                  <input
                    type="text"
                    placeholder="Search city/county..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input pl-9 h-8 w-40 text-sm"
                  />
                </div>
                
                {/* Date range */}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-foreground-subtle" />
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="input h-8 w-32 text-xs"
                    placeholder="Start"
                  />
                  <span className="text-foreground-subtle">to</span>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="input h-8 w-32 text-xs"
                    placeholder="End"
                  />
                </div>
                
                {/* Size range */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-foreground-muted">Size:</span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={sizeRange.min}
                    onChange={(e) => setSizeRange(prev => ({ ...prev, min: e.target.value }))}
                    className="input h-8 w-16 text-xs"
                    step="0.25"
                  />
                  <span className="text-foreground-subtle">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={sizeRange.max}
                    onChange={(e) => setSizeRange(prev => ({ ...prev, max: e.target.value }))}
                    className="input h-8 w-16 text-xs"
                    step="0.25"
                  />
                </div>
                
                {/* County */}
                <select
                  value={selectedCounty}
                  onChange={(e) => setSelectedCounty(e.target.value)}
                  className="input select h-8 w-36 text-xs"
                >
                  <option value="">All Counties</option>
                  {counties.map(county => (
                    <option key={county} value={county}>{county}</option>
                  ))}
                </select>
                
                {/* Damage toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={damageOnly}
                    onChange={(e) => setDamageOnly(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-xs text-foreground-muted">Damage Only</span>
                </label>
                
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-primary hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-foreground-muted">Loading storms...</p>
              </div>
            </div>
          ) : filteredStorms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Cloud className="w-12 h-12 text-foreground-subtle mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No storms found</h3>
              <p className="text-sm text-foreground-muted mb-4">Try adjusting your filters</p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="btn btn-primary btn-sm">
                  Clear Filters
                </button>
              )}
            </div>
          ) : viewMode === 'cards' ? (
            /* Card View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredStorms.map(storm => {
                const severity = getSeverityBadge(storm.hail_size)
                const isSelected = selectedStorms.has(storm.id)
                
                return (
                  <div
                    key={storm.id}
                    className={`
                      card p-4 cursor-pointer transition-all hover:shadow-lg
                      ${isSelected ? 'ring-2 ring-primary' : ''}
                    `}
                    onClick={() => toggleSelection(storm.id)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <span className={`badge ${severity.class}`}>
                        {severity.label}
                      </span>
                      <div className="flex items-center gap-2">
                        {storm.damage_property && storm.damage_property !== '0' && (
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                        )}
                        <div className={`
                          w-5 h-5 rounded border-2 flex items-center justify-center
                          ${isSelected ? 'bg-primary border-primary' : 'border-foreground-subtle'}
                        `}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                    </div>
                    
                    {/* Hail Size */}
                    <div className="mb-3">
                      <div className="font-mono text-3xl font-bold text-foreground">
                        {storm.hail_size}"
                      </div>
                      <div className="text-xs text-foreground-muted">
                        {getSizeReference(storm.hail_size)}
                      </div>
                    </div>
                    
                    {/* Location */}
                    <div className="flex items-center gap-2 text-sm text-foreground-muted mb-2">
                      <MapPin className="w-4 h-4" />
                      <span>{storm.city || 'Unknown'}, {storm.county}</span>
                    </div>
                    
                    {/* Date */}
                    <div className="flex items-center gap-2 text-sm text-foreground-muted mb-4">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(storm.event_date), 'MMM d, yyyy')}</span>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-border-muted">
                      <Link
                        href={`/storms/${storm.id}`}
                        className="btn btn-outline btn-sm flex-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Details
                      </Link>
                      <Link
                        href={`/?lat=${storm.latitude}&lng=${storm.longitude}&zoom=12`}
                        className="btn btn-primary btn-sm flex-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Map className="w-4 h-4" />
                        Map
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* Table View */
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="w-10">
                        <button
                          onClick={selectAll}
                          className={`
                            w-5 h-5 rounded border-2 flex items-center justify-center
                            ${selectedStorms.size === filteredStorms.length && filteredStorms.length > 0
                              ? 'bg-primary border-primary' 
                              : 'border-foreground-subtle hover:border-primary'
                            }
                          `}
                        >
                          {selectedStorms.size === filteredStorms.length && filteredStorms.length > 0 && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </button>
                      </th>
                      <th 
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => toggleSort('date')}
                      >
                        <div className="flex items-center gap-1">
                          Date
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th>Location</th>
                      <th 
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => toggleSort('size')}
                      >
                        <div className="flex items-center gap-1">
                          Hail Size
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th>Severity</th>
                      <th 
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => toggleSort('county')}
                      >
                        <div className="flex items-center gap-1">
                          County
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th>Damage</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStorms.map(storm => {
                      const severity = getSeverityBadge(storm.hail_size)
                      const isSelected = selectedStorms.has(storm.id)
                      
                      return (
                        <tr 
                          key={storm.id}
                          className={isSelected ? 'bg-primary-muted/30' : ''}
                        >
                          <td>
                            <button
                              onClick={() => toggleSelection(storm.id)}
                              className={`
                                w-5 h-5 rounded border-2 flex items-center justify-center
                                ${isSelected ? 'bg-primary border-primary' : 'border-foreground-subtle hover:border-primary'}
                              `}
                            >
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </button>
                          </td>
                          <td className="font-mono text-sm">
                            {format(new Date(storm.event_date), 'MMM d, yyyy')}
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-foreground-subtle" />
                              {storm.city || 'Unknown'}
                            </div>
                          </td>
                          <td>
                            <span className="font-mono font-bold">{storm.hail_size}"</span>
                            <span className="text-xs text-foreground-muted ml-2">
                              ({getSizeReference(storm.hail_size)})
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${severity.class}`}>
                              {severity.label}
                            </span>
                          </td>
                          <td>{storm.county}</td>
                          <td>
                            {storm.damage_property && storm.damage_property !== '0' ? (
                              <span className="flex items-center gap-1 text-destructive text-sm">
                                <AlertTriangle className="w-4 h-4" />
                                Yes
                              </span>
                            ) : (
                              <span className="text-foreground-subtle text-sm">No</span>
                            )}
                          </td>
                          <td>
                            <div className="flex items-center gap-1">
                              <Link
                                href={`/storms/${storm.id}`}
                                className="btn btn-ghost btn-sm btn-icon"
                                title="View Details"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Link>
                              <Link
                                href={`/?lat=${storm.latitude}&lng=${storm.longitude}&zoom=12`}
                                className="btn btn-ghost btn-sm btn-icon"
                                title="View on Map"
                              >
                                <Map className="w-4 h-4" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
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
