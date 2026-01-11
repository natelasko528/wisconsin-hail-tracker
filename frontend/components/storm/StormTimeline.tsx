'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Play, Pause } from 'lucide-react'
import { format, subDays, addDays, isSameDay, startOfDay, endOfDay } from 'date-fns'

interface StormTimelineProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
  stormDates?: Date[] // Dates that have storm events
}

export default function StormTimeline({ 
  selectedDate, 
  onDateChange,
  stormDates = []
}: StormTimelineProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Generate last 30 days
  const days = Array.from({ length: 30 }, (_, i) => subDays(new Date(), 29 - i))

  // Check if a date has storm events
  const hasStorms = (date: Date) => {
    return stormDates.some(d => isSameDay(d, date))
  }

  // Auto-play through dates
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        onDateChange(addDays(selectedDate, 1))
      }, 1500)
    } else if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current)
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    }
  }, [isPlaying, selectedDate, onDateChange])

  // Scroll to selected date
  useEffect(() => {
    const selectedIndex = days.findIndex(d => isSameDay(d, selectedDate))
    if (scrollRef.current && selectedIndex >= 0) {
      const itemWidth = 52 // approx width of each day item
      scrollRef.current.scrollTo({
        left: selectedIndex * itemWidth - scrollRef.current.offsetWidth / 2 + itemWidth / 2,
        behavior: 'smooth'
      })
    }
  }, [selectedDate])

  const navigateDays = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev' 
      ? subDays(selectedDate, 1)
      : addDays(selectedDate, 1)
    onDateChange(newDate)
  }

  return (
    <div className="bg-background-secondary border border-border rounded-lg p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Storm Timeline</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="btn btn-ghost btn-icon btn-sm"
            title={isPlaying ? 'Pause' : 'Play through dates'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Current Date Display */}
      <div className="text-center mb-3">
        <div className="text-lg font-display font-bold text-foreground">
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </div>
        <div className="text-xs text-foreground-subtle mt-0.5">
          {isSameDay(selectedDate, new Date()) ? 'Today' : format(selectedDate, "'Week' w 'of' yyyy")}
        </div>
      </div>

      {/* Timeline Scrubber */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigateDays('prev')}
          className="btn btn-ghost btn-icon btn-sm flex-shrink-0"
          disabled={isSameDay(selectedDate, days[0])}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-x-auto scrollbar-none"
        >
          <div className="flex gap-1 min-w-max py-1">
            {days.map((day) => {
              const isSelected = isSameDay(day, selectedDate)
              const isToday = isSameDay(day, new Date())
              const hasStormEvents = hasStorms(day)
              
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => onDateChange(day)}
                  className={`
                    relative flex flex-col items-center justify-center
                    w-12 h-14 rounded-md transition-all duration-200
                    ${isSelected 
                      ? 'bg-primary text-primary-foreground scale-105 shadow-glow' 
                      : 'hover:bg-muted'
                    }
                  `}
                >
                  <span className={`
                    text-2xs font-medium uppercase
                    ${isSelected ? 'text-primary-foreground' : 'text-foreground-subtle'}
                  `}>
                    {format(day, 'EEE')}
                  </span>
                  <span className={`
                    text-sm font-bold font-mono
                    ${isSelected ? 'text-primary-foreground' : 'text-foreground'}
                  `}>
                    {format(day, 'd')}
                  </span>
                  
                  {/* Storm indicator dot */}
                  {hasStormEvents && (
                    <div className={`
                      absolute bottom-1 w-1.5 h-1.5 rounded-full
                      ${isSelected ? 'bg-primary-foreground' : 'bg-destructive'}
                    `} />
                  )}
                  
                  {/* Today indicator */}
                  {isToday && !isSelected && (
                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <button
          onClick={() => navigateDays('next')}
          className="btn btn-ghost btn-icon btn-sm flex-shrink-0"
          disabled={isSameDay(selectedDate, days[days.length - 1])}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Navigation */}
      <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-border-muted">
        <button
          onClick={() => onDateChange(new Date())}
          className="text-xs font-medium text-primary hover:text-primary-hover transition-colors"
        >
          Today
        </button>
        <span className="text-foreground-subtle">•</span>
        <button
          onClick={() => onDateChange(subDays(new Date(), 7))}
          className="text-xs font-medium text-foreground-muted hover:text-foreground transition-colors"
        >
          Last 7 Days
        </button>
        <span className="text-foreground-subtle">•</span>
        <button
          onClick={() => onDateChange(subDays(new Date(), 30))}
          className="text-xs font-medium text-foreground-muted hover:text-foreground transition-colors"
        >
          Last 30 Days
        </button>
      </div>
    </div>
  )
}
