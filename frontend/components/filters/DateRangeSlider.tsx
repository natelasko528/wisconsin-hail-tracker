'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

interface DateRangeSliderProps {
  startDate: string
  endDate: string
  minDate?: string
  maxDate?: string
  onChange: (start: string, end: string) => void
  className?: string
}

// Generate years between min and max
const generateYears = (min: string, max: string): number[] => {
  const minYear = new Date(min).getFullYear()
  const maxYear = new Date(max).getFullYear()
  const years: number[] = []
  for (let year = minYear; year <= maxYear; year++) {
    years.push(year)
  }
  return years
}

// Convert date string to slider value (days since epoch)
const dateToValue = (dateStr: string): number => {
  return Math.floor(new Date(dateStr).getTime() / (1000 * 60 * 60 * 24))
}

// Convert slider value back to date string
const valueToDate = (value: number): string => {
  return new Date(value * 1000 * 60 * 60 * 24).toISOString().split('T')[0]
}

export default function DateRangeSlider({
  startDate,
  endDate,
  minDate = '2020-01-01',
  maxDate = new Date().toISOString().split('T')[0],
  onChange,
  className = ''
}: DateRangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [isDraggingStart, setIsDraggingStart] = useState(false)
  const [isDraggingEnd, setIsDraggingEnd] = useState(false)
  
  const minValue = dateToValue(minDate)
  const maxValue = dateToValue(maxDate)
  const startValue = dateToValue(startDate)
  const endValue = dateToValue(endDate)
  
  // Calculate positions as percentages
  const startPercent = ((startValue - minValue) / (maxValue - minValue)) * 100
  const endPercent = ((endValue - minValue) / (maxValue - minValue)) * 100
  
  const years = generateYears(minDate, maxDate)

  // Handle thumb drag
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!trackRef.current) return
    
    const rect = trackRef.current.getBoundingClientRect()
    const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const value = Math.round(minValue + (percent / 100) * (maxValue - minValue))
    const dateStr = valueToDate(value)
    
    if (isDraggingStart) {
      const newStart = Math.min(value, endValue - 1)
      onChange(valueToDate(newStart), endDate)
    } else if (isDraggingEnd) {
      const newEnd = Math.max(value, startValue + 1)
      onChange(startDate, valueToDate(newEnd))
    }
  }, [isDraggingStart, isDraggingEnd, minValue, maxValue, startValue, endValue, startDate, endDate, onChange])

  const handleMouseUp = useCallback(() => {
    setIsDraggingStart(false)
    setIsDraggingEnd(false)
  }, [])

  useEffect(() => {
    if (isDraggingStart || isDraggingEnd) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDraggingStart, isDraggingEnd, handleMouseMove, handleMouseUp])

  // Quick presets
  const presets = [
    { label: '30 Days', getRange: () => {
      const end = new Date()
      const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)
      return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
    }},
    { label: '90 Days', getRange: () => {
      const end = new Date()
      const start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000)
      return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
    }},
    { label: 'This Year', getRange: () => {
      const year = new Date().getFullYear()
      return { start: `${year}-01-01`, end: new Date().toISOString().split('T')[0] }
    }},
    { label: 'Last Year', getRange: () => {
      const year = new Date().getFullYear() - 1
      return { start: `${year}-01-01`, end: `${year}-12-31` }
    }},
    { label: 'All Time', getRange: () => ({ start: minDate, end: maxDate }) }
  ]

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header with date display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="font-mono text-foreground">
            {new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="text-foreground-subtle">→</span>
          <span className="font-mono text-foreground">
            {new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Dual-thumb slider */}
      <div className="relative h-6 select-none">
        {/* Track background */}
        <div 
          ref={trackRef}
          className="absolute top-2 left-0 right-0 h-2 bg-muted rounded-full"
        >
          {/* Active range */}
          <div 
            className="absolute h-full bg-gradient-to-r from-primary to-accent rounded-full"
            style={{
              left: `${startPercent}%`,
              width: `${endPercent - startPercent}%`
            }}
          />
          
          {/* Year tick marks */}
          {years.map(year => {
            const yearStart = dateToValue(`${year}-01-01`)
            const percent = ((yearStart - minValue) / (maxValue - minValue)) * 100
            if (percent < 0 || percent > 100) return null
            return (
              <div 
                key={year}
                className="absolute w-px h-3 bg-foreground-subtle/30 -top-0.5"
                style={{ left: `${percent}%` }}
              />
            )
          })}
        </div>

        {/* Start thumb */}
        <div
          className={`
            absolute top-0 w-4 h-4 -ml-2 rounded-full cursor-grab
            bg-primary border-2 border-background shadow-lg
            transition-transform hover:scale-110
            ${isDraggingStart ? 'scale-125 cursor-grabbing' : ''}
          `}
          style={{ left: `${startPercent}%` }}
          onMouseDown={() => setIsDraggingStart(true)}
        />

        {/* End thumb */}
        <div
          className={`
            absolute top-0 w-4 h-4 -ml-2 rounded-full cursor-grab
            bg-accent border-2 border-background shadow-lg
            transition-transform hover:scale-110
            ${isDraggingEnd ? 'scale-125 cursor-grabbing' : ''}
          `}
          style={{ left: `${endPercent}%` }}
          onMouseDown={() => setIsDraggingEnd(true)}
        />
      </div>

      {/* Year labels */}
      <div className="flex justify-between text-[10px] text-foreground-subtle">
        {years.filter((_, i) => i % Math.ceil(years.length / 4) === 0 || i === years.length - 1).map(year => (
          <span key={year}>{year}</span>
        ))}
      </div>

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-1">
        {presets.map(preset => (
          <button
            key={preset.label}
            onClick={() => {
              const range = preset.getRange()
              onChange(range.start, range.end)
            }}
            className="px-2 py-1 text-xs rounded bg-muted hover:bg-secondary text-foreground-muted hover:text-foreground transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  )
}
