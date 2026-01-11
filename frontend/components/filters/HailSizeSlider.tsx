'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Cloud } from 'lucide-react'

interface HailSizeSliderProps {
  minSize: number
  maxSize: number
  min?: number
  max?: number
  step?: number
  onChange: (min: number, max: number) => void
  className?: string
}

// Hail size reference data
const HAIL_REFERENCES = [
  { size: 0.5, label: 'Pea', color: '#fbbf24' },
  { size: 1.0, label: 'Quarter', color: '#f97316' },
  { size: 1.5, label: 'Ping Pong', color: '#ef4444' },
  { size: 1.75, label: 'Golf Ball', color: '#dc2626' },
  { size: 2.0, label: 'Lime', color: '#b91c1c' },
  { size: 2.5, label: 'Tennis Ball', color: '#991b1b' },
  { size: 3.0, label: 'Baseball', color: '#7f1d1d' },
  { size: 4.0, label: 'Softball', color: '#450a0a' },
]

// Get severity label
const getSeverityLabel = (size: number): string => {
  if (size >= 2.5) return 'Extreme'
  if (size >= 2.0) return 'Severe'
  if (size >= 1.5) return 'Significant'
  if (size >= 1.0) return 'Moderate'
  return 'Minor'
}

// Get color for size
const getSizeColor = (size: number): string => {
  if (size >= 2.5) return '#991b1b'
  if (size >= 2.0) return '#dc2626'
  if (size >= 1.5) return '#ef4444'
  if (size >= 1.0) return '#f97316'
  return '#fbbf24'
}

// Get closest reference
const getReference = (size: number): { label: string; color: string } => {
  const closest = HAIL_REFERENCES.reduce((prev, curr) => 
    Math.abs(curr.size - size) < Math.abs(prev.size - size) ? curr : prev
  )
  return closest
}

export default function HailSizeSlider({
  minSize,
  maxSize,
  min = 0.5,
  max = 4.5,
  step = 0.25,
  onChange,
  className = ''
}: HailSizeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [isDraggingMin, setIsDraggingMin] = useState(false)
  const [isDraggingMax, setIsDraggingMax] = useState(false)
  
  // Calculate positions as percentages
  const minPercent = ((minSize - min) / (max - min)) * 100
  const maxPercent = ((maxSize - min) / (max - min)) * 100

  // Handle thumb drag
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!trackRef.current) return
    
    const rect = trackRef.current.getBoundingClientRect()
    const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const rawValue = min + (percent / 100) * (max - min)
    const value = Math.round(rawValue / step) * step
    
    if (isDraggingMin) {
      const newMin = Math.min(value, maxSize - step)
      onChange(Math.max(min, newMin), maxSize)
    } else if (isDraggingMax) {
      const newMax = Math.max(value, minSize + step)
      onChange(minSize, Math.min(max, newMax))
    }
  }, [isDraggingMin, isDraggingMax, min, max, step, minSize, maxSize, onChange])

  const handleMouseUp = useCallback(() => {
    setIsDraggingMin(false)
    setIsDraggingMax(false)
  }, [])

  useEffect(() => {
    if (isDraggingMin || isDraggingMax) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDraggingMin, isDraggingMax, handleMouseMove, handleMouseUp])

  const minRef = getReference(minSize)
  const maxRef = getReference(maxSize)

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header with size display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cloud className="w-4 h-4 text-warning" />
          <span className="text-sm text-foreground-muted">Hail Size Range</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span 
            className="font-mono font-bold px-2 py-0.5 rounded"
            style={{ backgroundColor: `${getSizeColor(minSize)}20`, color: getSizeColor(minSize) }}
          >
            {minSize}"
          </span>
          <span className="text-foreground-subtle">→</span>
          <span 
            className="font-mono font-bold px-2 py-0.5 rounded"
            style={{ backgroundColor: `${getSizeColor(maxSize)}20`, color: getSizeColor(maxSize) }}
          >
            {maxSize}"
          </span>
        </div>
      </div>

      {/* Severity indicators */}
      <div className="flex items-center gap-2 text-xs">
        <span 
          className="px-2 py-0.5 rounded"
          style={{ backgroundColor: `${getSizeColor(minSize)}20`, color: getSizeColor(minSize) }}
        >
          {minRef.label}
        </span>
        <span className="text-foreground-subtle">to</span>
        <span 
          className="px-2 py-0.5 rounded"
          style={{ backgroundColor: `${getSizeColor(maxSize)}20`, color: getSizeColor(maxSize) }}
        >
          {maxRef.label}
        </span>
      </div>

      {/* Dual-thumb slider with gradient */}
      <div className="relative h-8 select-none pt-2">
        {/* Track background with severity gradient */}
        <div 
          ref={trackRef}
          className="absolute top-4 left-0 right-0 h-3 rounded-full overflow-hidden"
          style={{
            background: `linear-gradient(to right, 
              #fbbf24 0%, 
              #f97316 25%, 
              #ef4444 50%, 
              #dc2626 70%, 
              #991b1b 100%
            )`
          }}
        >
          {/* Inactive left region */}
          <div 
            className="absolute h-full bg-muted/80"
            style={{ left: 0, width: `${minPercent}%` }}
          />
          
          {/* Inactive right region */}
          <div 
            className="absolute h-full bg-muted/80"
            style={{ left: `${maxPercent}%`, right: 0 }}
          />
        </div>

        {/* Reference tick marks */}
        {HAIL_REFERENCES.filter(r => r.size >= min && r.size <= max).map(ref => {
          const percent = ((ref.size - min) / (max - min)) * 100
          return (
            <div 
              key={ref.size}
              className="absolute w-0.5 h-2 bg-foreground/30 top-2"
              style={{ left: `calc(${percent}% - 1px)` }}
              title={`${ref.size}" - ${ref.label}`}
            />
          )
        })}

        {/* Min thumb */}
        <div
          className={`
            absolute top-2 w-5 h-5 -ml-2.5 rounded-full cursor-grab
            border-2 border-background shadow-lg
            transition-transform hover:scale-110
            ${isDraggingMin ? 'scale-125 cursor-grabbing ring-2 ring-primary/50' : ''}
          `}
          style={{ 
            left: `${minPercent}%`,
            backgroundColor: getSizeColor(minSize)
          }}
          onMouseDown={() => setIsDraggingMin(true)}
        >
          <span className="sr-only">Minimum size: {minSize}"</span>
        </div>

        {/* Max thumb */}
        <div
          className={`
            absolute top-2 w-5 h-5 -ml-2.5 rounded-full cursor-grab
            border-2 border-background shadow-lg
            transition-transform hover:scale-110
            ${isDraggingMax ? 'scale-125 cursor-grabbing ring-2 ring-primary/50' : ''}
          `}
          style={{ 
            left: `${maxPercent}%`,
            backgroundColor: getSizeColor(maxSize)
          }}
          onMouseDown={() => setIsDraggingMax(true)}
        >
          <span className="sr-only">Maximum size: {maxSize}"</span>
        </div>
      </div>

      {/* Reference labels */}
      <div className="flex justify-between text-[9px] text-foreground-subtle px-1">
        <span>Pea</span>
        <span>Quarter</span>
        <span>Golf Ball</span>
        <span>Tennis Ball</span>
        <span>Softball</span>
      </div>

      {/* Quick severity presets */}
      <div className="flex flex-wrap gap-1">
        {[
          { label: 'All', min: 0.5, max: 4.5 },
          { label: 'Minor+', min: 0.5, max: 4.5 },
          { label: 'Moderate+', min: 1.0, max: 4.5 },
          { label: 'Significant+', min: 1.5, max: 4.5 },
          { label: 'Severe+', min: 2.0, max: 4.5 },
          { label: 'Extreme', min: 2.5, max: 4.5 },
        ].map(preset => (
          <button
            key={preset.label}
            onClick={() => onChange(preset.min, preset.max)}
            className={`
              px-2 py-1 text-xs rounded transition-colors
              ${minSize === preset.min && maxSize === preset.max
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-secondary text-foreground-muted hover:text-foreground'
              }
            `}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  )
}
