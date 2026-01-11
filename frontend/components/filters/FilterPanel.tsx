'use client'

import { useState } from 'react'
import { 
  X, 
  Filter, 
  Search, 
  MapPin, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Save,
  FolderOpen
} from 'lucide-react'
import DateRangeSlider from './DateRangeSlider'
import HailSizeSlider from './HailSizeSlider'

interface FilterPanelProps {
  // Date range
  dateStart: string
  dateEnd: string
  onDateChange: (start: string, end: string) => void
  
  // Hail size range
  sizeMin: number
  sizeMax: number
  onSizeChange: (min: number, max: number) => void
  
  // County
  county: string
  counties: string[]
  onCountyChange: (county: string) => void
  
  // Damage filter
  damageOnly: boolean
  onDamageChange: (value: boolean) => void
  
  // Search
  searchQuery: string
  onSearchChange: (query: string) => void
  
  // Panel controls
  onClose: () => void
  onClearAll: () => void
  
  className?: string
}

// Saved filter presets
interface FilterPreset {
  id: string
  name: string
  dateStart: string
  dateEnd: string
  sizeMin: number
  sizeMax: number
  county: string
  damageOnly: boolean
}

export default function FilterPanel({
  dateStart,
  dateEnd,
  onDateChange,
  sizeMin,
  sizeMax,
  onSizeChange,
  county,
  counties,
  onCountyChange,
  damageOnly,
  onDamageChange,
  searchQuery,
  onSearchChange,
  onClose,
  onClearAll,
  className = ''
}: FilterPanelProps) {
  const [expandedSections, setExpandedSections] = useState({
    date: true,
    size: true,
    location: true,
    damage: true
  })
  
  const [savedPresets, setSavedPresets] = useState<FilterPreset[]>([
    {
      id: '1',
      name: 'Recent Severe',
      dateStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dateEnd: new Date().toISOString().split('T')[0],
      sizeMin: 2.0,
      sizeMax: 4.5,
      county: '',
      damageOnly: false
    },
    {
      id: '2',
      name: 'Damage Reports',
      dateStart: '2020-01-01',
      dateEnd: new Date().toISOString().split('T')[0],
      sizeMin: 1.5,
      sizeMax: 4.5,
      county: '',
      damageOnly: true
    }
  ])

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const applyPreset = (preset: FilterPreset) => {
    onDateChange(preset.dateStart, preset.dateEnd)
    onSizeChange(preset.sizeMin, preset.sizeMax)
    onCountyChange(preset.county)
    onDamageChange(preset.damageOnly)
  }

  const hasActiveFilters = 
    county || 
    damageOnly || 
    searchQuery || 
    sizeMin > 0.5 || 
    sizeMax < 4.5

  return (
    <div className={`glass rounded-xl border border-border shadow-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-border bg-background-secondary/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            <h3 className="font-display font-semibold text-foreground">Filters</h3>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClearAll}
              className="text-xs text-foreground-muted hover:text-foreground flex items-center gap-1 transition-colors"
              title="Clear all filters"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-icon btn-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin">
        {/* Search */}
        <div className="p-4 border-b border-border-muted">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-subtle" />
            <input
              type="text"
              placeholder="Search city or county..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="input pl-9 h-10 w-full"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-subtle hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Saved Presets */}
        {savedPresets.length > 0 && (
          <div className="p-4 border-b border-border-muted">
            <div className="flex items-center gap-2 mb-3">
              <FolderOpen className="w-4 h-4 text-foreground-subtle" />
              <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                Quick Filters
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {savedPresets.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-muted hover:bg-secondary text-foreground-muted hover:text-foreground transition-colors border border-transparent hover:border-primary/30"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Date Range Section */}
        <div className="border-b border-border-muted">
          <button
            onClick={() => toggleSection('date')}
            className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
              Date Range
            </span>
            {expandedSections.date ? (
              <ChevronUp className="w-4 h-4 text-foreground-subtle" />
            ) : (
              <ChevronDown className="w-4 h-4 text-foreground-subtle" />
            )}
          </button>
          {expandedSections.date && (
            <div className="px-4 pb-4">
              <DateRangeSlider
                startDate={dateStart}
                endDate={dateEnd}
                onChange={onDateChange}
              />
            </div>
          )}
        </div>

        {/* Hail Size Section */}
        <div className="border-b border-border-muted">
          <button
            onClick={() => toggleSection('size')}
            className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
              Hail Size
            </span>
            {expandedSections.size ? (
              <ChevronUp className="w-4 h-4 text-foreground-subtle" />
            ) : (
              <ChevronDown className="w-4 h-4 text-foreground-subtle" />
            )}
          </button>
          {expandedSections.size && (
            <div className="px-4 pb-4">
              <HailSizeSlider
                minSize={sizeMin}
                maxSize={sizeMax}
                onChange={onSizeChange}
              />
            </div>
          )}
        </div>

        {/* Location Section */}
        <div className="border-b border-border-muted">
          <button
            onClick={() => toggleSection('location')}
            className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
              Location
            </span>
            {expandedSections.location ? (
              <ChevronUp className="w-4 h-4 text-foreground-subtle" />
            ) : (
              <ChevronDown className="w-4 h-4 text-foreground-subtle" />
            )}
          </button>
          {expandedSections.location && (
            <div className="px-4 pb-4 space-y-3">
              <div>
                <label className="text-xs text-foreground-subtle block mb-2">
                  County
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-subtle" />
                  <select
                    value={county}
                    onChange={(e) => onCountyChange(e.target.value)}
                    className="input select h-10 w-full pl-9"
                  >
                    <option value="">All Counties</option>
                    {counties.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Damage Section */}
        <div className="border-b border-border-muted">
          <button
            onClick={() => toggleSection('damage')}
            className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
          >
            <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
              Damage Reports
            </span>
            {expandedSections.damage ? (
              <ChevronUp className="w-4 h-4 text-foreground-subtle" />
            ) : (
              <ChevronDown className="w-4 h-4 text-foreground-subtle" />
            )}
          </button>
          {expandedSections.damage && (
            <div className="px-4 pb-4">
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={damageOnly}
                  onChange={(e) => onDamageChange(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-foreground-subtle text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <span className="text-sm font-medium text-foreground">Damage Reported Only</span>
                  </div>
                  <p className="text-xs text-foreground-subtle mt-1">
                    Show only storms with confirmed property damage
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Footer with result count */}
      <div className="p-4 border-t border-border bg-background-secondary/30">
        <p className="text-xs text-foreground-muted text-center">
          Filters applied to map view
        </p>
      </div>
    </div>
  )
}
