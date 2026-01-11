'use client'

import { 
  X, 
  MapPin, 
  Calendar, 
  CloudLightning,
  Home,
  Phone,
  Mail,
  UserPlus,
  FileText,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertTriangle,
  ChevronRight
} from 'lucide-react'
import { format } from 'date-fns'
import { useState } from 'react'
import Link from 'next/link'

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

interface PropertyPanelProps {
  event: StormEvent | null
  onClose: () => void
  onConvertToLead?: (event: StormEvent) => void
  onSkipTrace?: (event: StormEvent) => void
}

const getSeverityInfo = (size: number) => {
  if (size >= 2.5) return { label: 'Extreme', class: 'badge-hail-extreme', description: 'Catastrophic roof damage likely' }
  if (size >= 2.0) return { label: 'Severe', class: 'badge-hail-severe', description: 'Major roof damage expected' }
  if (size >= 1.5) return { label: 'Significant', class: 'badge-hail-significant', description: 'Moderate roof damage possible' }
  if (size >= 1.0) return { label: 'Moderate', class: 'badge-hail-moderate', description: 'Minor roof damage possible' }
  return { label: 'Minor', class: 'badge-hail-minor', description: 'Cosmetic damage only' }
}

export default function PropertyPanel({
  event,
  onClose,
  onConvertToLead,
  onSkipTrace
}: PropertyPanelProps) {
  const [copied, setCopied] = useState(false)
  const [isConverting, setIsConverting] = useState(false)

  if (!event) return null

  const severity = getSeverityInfo(event.hail_size)
  const address = `${event.city || 'Unknown'}, ${event.county} County, ${event.state || 'WI'}`

  const copyAddress = async () => {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleConvertToLead = async () => {
    setIsConverting(true)
    await onConvertToLead?.(event)
    setIsConverting(false)
  }

  // Estimate property damage
  const getEstimatedDamage = () => {
    if (event.hail_size >= 2.5) return { min: 15000, max: 50000 }
    if (event.hail_size >= 2.0) return { min: 8000, max: 20000 }
    if (event.hail_size >= 1.5) return { min: 4000, max: 12000 }
    if (event.hail_size >= 1.0) return { min: 1500, max: 6000 }
    return { min: 500, max: 2000 }
  }

  const damageEstimate = getEstimatedDamage()

  return (
    <div className="h-full flex flex-col bg-background-secondary animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-muted flex items-center justify-center">
            <CloudLightning className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground text-sm">Storm Details</h3>
            <p className="text-2xs text-foreground-subtle">Event #{event.event_id || event.id.slice(0, 8)}</p>
          </div>
        </div>
        <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Severity Banner */}
        <div className={`
          p-4 border-b border-border
          ${event.hail_size >= 2.0 ? 'bg-destructive-muted' : 
            event.hail_size >= 1.5 ? 'bg-warning-muted' : 'bg-muted'}
        `}>
          <div className="flex items-center justify-between mb-2">
            <span className={`badge ${severity.class}`}>
              {severity.label}
            </span>
            {event.damage_property && event.damage_property !== '0' && (
              <span className="badge badge-destructive flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Damage Reported
              </span>
            )}
          </div>
          <div className="font-mono text-3xl font-bold text-foreground mb-1">
            {event.hail_size}"
          </div>
          <p className="text-sm text-foreground-muted">{severity.description}</p>
        </div>

        {/* Location & Date */}
        <div className="p-4 space-y-4 border-b border-border">
          <div>
            <div className="data-label mb-2">Location</div>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-foreground-subtle mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">{event.city || 'Unknown Location'}</p>
                  <p className="text-sm text-foreground-muted">{event.county} County, {event.state || 'WI'}</p>
                </div>
              </div>
              <button 
                onClick={copyAddress}
                className="btn btn-ghost btn-icon btn-sm"
                title="Copy address"
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <div className="data-label mb-2">Date & Time</div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-foreground-subtle" />
              <span className="text-foreground">
                {format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')}
              </span>
            </div>
            <p className="text-sm text-foreground-muted mt-1 ml-6">
              {format(new Date(event.event_date), 'h:mm a')}
            </p>
          </div>

          <div>
            <div className="data-label mb-2">Coordinates</div>
            <div className="flex items-center justify-between">
              <code className="text-sm font-mono text-foreground-muted">
                {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}
              </code>
              <a
                href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm text-xs"
              >
                Open in Maps
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Damage Estimate */}
        <div className="p-4 border-b border-border">
          <div className="data-label mb-3">Estimated Repair Cost</div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-foreground">
              ${damageEstimate.min.toLocaleString()}
            </span>
            <span className="text-foreground-muted">-</span>
            <span className="font-mono text-2xl font-bold text-foreground">
              ${damageEstimate.max.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-foreground-subtle mt-1">
            Based on average roof repair costs for {event.hail_size}" hail damage
          </p>
        </div>

        {/* Narrative */}
        {event.narrative && (
          <div className="p-4 border-b border-border">
            <div className="data-label mb-2">Event Narrative</div>
            <p className="text-sm text-foreground-muted leading-relaxed">
              {event.narrative}
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="p-4 space-y-2">
          <div className="data-label mb-3">Quick Actions</div>
          
          <button 
            onClick={handleConvertToLead}
            disabled={isConverting}
            className="w-full btn btn-primary justify-between"
          >
            <span className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Convert to Lead
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => onSkipTrace?.(event)}
            className="w-full btn btn-secondary justify-between"
          >
            <span className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Skip Trace Property
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
          
          <Link 
            href={`/storms/${event.id}`}
            className="w-full btn btn-outline justify-between"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              View Full Report
            </span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-background">
        <div className="flex items-center justify-between text-xs text-foreground-subtle">
          <span>Source: NOAA Storm Events Database</span>
          <span>ID: {event.event_id || event.id.slice(0, 8)}</span>
        </div>
      </div>
    </div>
  )
}
