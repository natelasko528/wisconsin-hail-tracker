'use client'

import { useState, useMemo } from 'react'
import { 
  MapPin, 
  Calendar, 
  ArrowRight, 
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Check,
  AlertTriangle,
  Building2,
  X,
  SlidersHorizontal
} from 'lucide-react'
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns'

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
  zip_code?: string
}

interface StormEventsListProps {
  events: StormEvent[]
  selectedEvent?: StormEvent | null
  onEventSelect?: (event: StormEvent) => void
  onConvertToLeads?: (events: StormEvent[]) => void
  onDiscoverProperties?: (events: StormEvent[]) => void
  isLoading?: boolean
  isExpanded?: boolean
  onToggleExpand?: () => void
}

const getSeverityBadge = (size: number) => {
  if (size >= 2.5) return { label: 'Extreme', class: 'badge-hail-extreme' }
  if (size >= 2.0) return { label: 'Severe', class: 'badge-hail-severe' }
  if (size >= 1.5) return { label: 'Significant', class: 'badge-hail-significant' }
  if (size >= 1.0) return { label: 'Moderate', class: 'badge-hail-moderate' }
  return { label: 'Minor', class: 'badge-hail-minor' }
}

export default function StormEventsList({
  events,
  selectedEvent,
  onEventSelect,
  onConvertToLeads,
  onDiscoverProperties,
  isLoading = false,
  isExpanded = false,
  onToggleExpand
}: StormEventsListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<'date' | 'size' | 'county'>('date')
  const [filterSeverity, setFilterSeverity] = useState<string | null>(null)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  
  // Advanced filters
  const [advancedFilters, setAdvancedFilters] = useState({
    city: '',
    zipCode: '',
    dateFrom: '',
    dateTo: '',
    minHailSize: '',
    maxHailSize: '',
    damageReportedOnly: false
  })

  // Get unique cities for suggestions
  const uniqueCities = useMemo(() => {
    const cities = events.map(e => e.city).filter(Boolean)
    return [...new Set(cities)].sort()
  }, [events])

  // Filter events with advanced filters
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Basic search
      const matchesSearch = !searchTerm || 
        (event.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         event.county?.toLowerCase().includes(searchTerm.toLowerCase()))
      
      // Severity filter
      const matchesSeverity = !filterSeverity || getSeverityBadge(event.hail_size).label.toLowerCase() === filterSeverity

      // Advanced: City filter
      const matchesCity = !advancedFilters.city || 
        event.city?.toLowerCase().includes(advancedFilters.city.toLowerCase())

      // Advanced: Zip code filter
      const matchesZip = !advancedFilters.zipCode || 
        event.zip_code?.includes(advancedFilters.zipCode)

      // Advanced: Date range filter
      let matchesDateRange = true
      if (advancedFilters.dateFrom || advancedFilters.dateTo) {
        try {
          const eventDate = new Date(event.event_date)
          const fromDate = advancedFilters.dateFrom ? startOfDay(parseISO(advancedFilters.dateFrom)) : new Date(0)
          const toDate = advancedFilters.dateTo ? endOfDay(parseISO(advancedFilters.dateTo)) : new Date(9999, 11, 31)
          matchesDateRange = isWithinInterval(eventDate, { start: fromDate, end: toDate })
        } catch {
          matchesDateRange = true
        }
      }

      // Advanced: Hail size range filter
      const minSize = advancedFilters.minHailSize ? parseFloat(advancedFilters.minHailSize) : 0
      const maxSize = advancedFilters.maxHailSize ? parseFloat(advancedFilters.maxHailSize) : Infinity
      const matchesHailSize = event.hail_size >= minSize && event.hail_size <= maxSize

      // Advanced: Damage reported filter
      const matchesDamage = !advancedFilters.damageReportedOnly || 
        (event.damage_property && event.damage_property !== '0')

      return matchesSearch && matchesSeverity && matchesCity && matchesZip && 
             matchesDateRange && matchesHailSize && matchesDamage
    })
  }, [events, searchTerm, filterSeverity, advancedFilters])

  // Sort events
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      switch (sortBy) {
        case 'size':
          return b.hail_size - a.hail_size
        case 'county':
          return (a.county || '').localeCompare(b.county || '')
        case 'date':
        default:
          return new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
      }
    })
  }, [filteredEvents, sortBy])

  // Clear all advanced filters
  const clearAdvancedFilters = () => {
    setAdvancedFilters({
      city: '',
      zipCode: '',
      dateFrom: '',
      dateTo: '',
      minHailSize: '',
      maxHailSize: '',
      damageReportedOnly: false
    })
  }

  // Check if any advanced filter is active
  const hasActiveAdvancedFilters = Object.values(advancedFilters).some(v => 
    v !== '' && v !== false
  )

  const toggleEventSelection = (eventId: string) => {
    const newSelected = new Set(selectedEvents)
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId)
    } else {
      newSelected.add(eventId)
    }
    setSelectedEvents(newSelected)
  }

  const selectAll = () => {
    if (selectedEvents.size === sortedEvents.length) {
      setSelectedEvents(new Set())
    } else {
      setSelectedEvents(new Set(sortedEvents.map(e => e.id)))
    }
  }

  const handleConvertToLeads = () => {
    const selectedStorms = events.filter(e => selectedEvents.has(e.id))
    onConvertToLeads?.(selectedStorms)
    setSelectedEvents(new Set())
  }

  const handleDiscoverProperties = () => {
    const selectedStorms = events.filter(e => selectedEvents.has(e.id))
    onDiscoverProperties?.(selectedStorms)
  }

  const handleDiscoverPropertiesForOne = (event: StormEvent) => {
    onDiscoverProperties?.([event])
  }

  if (isLoading) {
    return (
      <div className="panel h-full flex flex-col">
        <div className="panel-header">
          <div className="w-32 h-5 bg-muted rounded animate-pulse" />
        </div>
        <div className="panel-body flex-1 overflow-hidden">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/50 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded bg-muted" />
                  <div className="flex-1">
                    <div className="w-32 h-4 bg-muted rounded mb-2" />
                    <div className="w-24 h-3 bg-muted rounded" />
                  </div>
                  <div className="w-16 h-6 bg-muted rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="panel h-full flex flex-col">
      {/* Header */}
      <div className="panel-header flex-shrink-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <h3 className="panel-title">Storm Events</h3>
            <span className="badge badge-secondary text-xs">
              {sortedEvents.length}
            </span>
            {hasActiveAdvancedFilters && (
              <span className="badge badge-primary text-xs">Filtered</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {onToggleExpand && (
              <button
                onClick={onToggleExpand}
                className="btn btn-ghost btn-icon btn-sm"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
        
        {/* Action Buttons - Show when items selected */}
        {selectedEvents.size > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border-muted">
            <button 
              onClick={handleDiscoverProperties}
              className="btn btn-secondary btn-sm flex-1"
            >
              <Building2 className="w-3.5 h-3.5" />
              Discover Properties
            </button>
            <button 
              onClick={handleConvertToLeads}
              className="btn btn-primary btn-sm flex-1"
            >
              Convert to Leads
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="px-4 py-3 border-b border-border-muted space-y-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-subtle" />
            <input
              type="text"
              placeholder="Search by city or county..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-9 h-9 text-sm w-full"
            />
          </div>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`btn btn-sm ${showAdvancedFilters || hasActiveAdvancedFilters ? 'btn-primary' : 'btn-outline'}`}
            title="Advanced Filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
        
        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="p-3 bg-muted rounded-lg space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground-muted uppercase">Advanced Filters</span>
              {hasActiveAdvancedFilters && (
                <button 
                  onClick={clearAdvancedFilters}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear All
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-2xs text-foreground-subtle block mb-1">City</label>
                <input
                  type="text"
                  placeholder="Any city"
                  value={advancedFilters.city}
                  onChange={(e) => setAdvancedFilters(f => ({ ...f, city: e.target.value }))}
                  className="input h-8 text-xs w-full"
                  list="city-suggestions"
                />
                <datalist id="city-suggestions">
                  {uniqueCities.slice(0, 20).map(city => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="text-2xs text-foreground-subtle block mb-1">Zip Code</label>
                <input
                  type="text"
                  placeholder="Any zip"
                  value={advancedFilters.zipCode}
                  onChange={(e) => setAdvancedFilters(f => ({ ...f, zipCode: e.target.value }))}
                  className="input h-8 text-xs w-full"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-2xs text-foreground-subtle block mb-1">Date From</label>
                <input
                  type="date"
                  value={advancedFilters.dateFrom}
                  onChange={(e) => setAdvancedFilters(f => ({ ...f, dateFrom: e.target.value }))}
                  className="input h-8 text-xs w-full"
                />
              </div>
              <div>
                <label className="text-2xs text-foreground-subtle block mb-1">Date To</label>
                <input
                  type="date"
                  value={advancedFilters.dateTo}
                  onChange={(e) => setAdvancedFilters(f => ({ ...f, dateTo: e.target.value }))}
                  className="input h-8 text-xs w-full"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-2xs text-foreground-subtle block mb-1">Min Hail Size</label>
                <input
                  type="number"
                  placeholder="0.0"
                  step="0.25"
                  min="0"
                  value={advancedFilters.minHailSize}
                  onChange={(e) => setAdvancedFilters(f => ({ ...f, minHailSize: e.target.value }))}
                  className="input h-8 text-xs w-full"
                />
              </div>
              <div>
                <label className="text-2xs text-foreground-subtle block mb-1">Max Hail Size</label>
                <input
                  type="number"
                  placeholder="5.0"
                  step="0.25"
                  min="0"
                  value={advancedFilters.maxHailSize}
                  onChange={(e) => setAdvancedFilters(f => ({ ...f, maxHailSize: e.target.value }))}
                  className="input h-8 text-xs w-full"
                />
              </div>
            </div>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={advancedFilters.damageReportedOnly}
                onChange={(e) => setAdvancedFilters(f => ({ ...f, damageReportedOnly: e.target.checked }))}
                className="w-4 h-4 rounded border-foreground-subtle text-primary focus:ring-primary"
              />
              <span className="text-xs text-foreground-muted">Damage Reported Only</span>
            </label>
          </div>
        )}
        
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={selectAll}
            className={`
              btn btn-sm flex-shrink-0
              ${selectedEvents.size === sortedEvents.length && sortedEvents.length > 0
                ? 'btn-primary' 
                : 'btn-outline'
              }
            `}
          >
            <Check className="w-3.5 h-3.5" />
            {selectedEvents.size === sortedEvents.length && sortedEvents.length > 0 ? 'Deselect' : 'Select All'}
          </button>
          
          <div className="h-6 w-px bg-border flex-shrink-0" />
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'size' | 'county')}
            className="input select h-8 text-xs w-auto pr-8"
          >
            <option value="date">Sort by Date</option>
            <option value="size">Sort by Size</option>
            <option value="county">Sort by County</option>
          </select>
          
          <select
            value={filterSeverity || ''}
            onChange={(e) => setFilterSeverity(e.target.value || null)}
            className="input select h-8 text-xs w-auto pr-8"
          >
            <option value="">All Severity</option>
            <option value="extreme">Extreme</option>
            <option value="severe">Severe</option>
            <option value="significant">Significant</option>
            <option value="moderate">Moderate</option>
            <option value="minor">Minor</option>
          </select>
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {sortedEvents.length === 0 ? (
          <div className="empty-state">
            <CloudLightning className="empty-state-icon" />
            <div className="empty-state-title">No storm events found</div>
            <div className="empty-state-description">
              Try adjusting your filters or selecting a different date range.
            </div>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {sortedEvents.map((event) => {
              const severity = getSeverityBadge(event.hail_size)
              const isSelected = selectedEvents.has(event.id)
              const isActive = selectedEvent?.id === event.id
              
              return (
                <div
                  key={event.id}
                  className={`
                    p-3 rounded-lg border cursor-pointer
                    transition-all duration-200
                    ${isActive 
                      ? 'bg-primary-muted border-primary' 
                      : isSelected
                        ? 'bg-muted border-primary/50'
                        : 'bg-card border-border hover:border-foreground-subtle'
                    }
                  `}
                  onClick={() => onEventSelect?.(event)}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleEventSelection(event.id)
                      }}
                      className={`
                        w-4 h-4 rounded border flex-shrink-0 mt-0.5
                        flex items-center justify-center
                        transition-all duration-150
                        ${isSelected 
                          ? 'bg-primary border-primary' 
                          : 'border-foreground-subtle hover:border-primary'
                        }
                      `}
                    >
                      {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                    </button>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-foreground truncate">
                          {event.city || 'Unknown Location'}, {event.county}
                        </span>
                        {event.damage_property && event.damage_property !== '0' && (
                          <AlertTriangle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-foreground-muted">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(event.event_date), 'MMM d, yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.state || 'WI'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Hail Size & Severity */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <div className="font-mono font-bold text-lg text-foreground">
                        {event.hail_size}"
                      </div>
                      <span className={`badge text-2xs ${severity.class}`}>
                        {severity.label}
                      </span>
                    </div>
                  </div>
                  
                  {/* Quick Action - Discover Properties */}
                  {onDiscoverProperties && isActive && (
                    <div className="mt-3 pt-3 border-t border-border-muted">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDiscoverPropertiesForOne(event)
                        }}
                        className="btn btn-secondary btn-sm w-full"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        Discover Nearby Properties
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// CloudLightning icon for empty state
function CloudLightning(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973" />
      <path d="m13 12-3 5h4l-3 5" />
    </svg>
  )
}
