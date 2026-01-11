'use client'

import { 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  Clock,
  MoreVertical,
  User,
  CloudLightning,
  GripVertical,
  ExternalLink
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface Lead {
  id: string
  name: string
  property_address: string
  status: string
  hail_size?: number
  phone?: string
  email?: string
  created_at: string
  updated_at?: string
  storm_date?: string
  notes_count?: number
  property_value?: number
  lead_score?: number
}

interface LeadCardProps {
  lead: Lead
  isDragging?: boolean
  onSelect?: () => void
}

const getSeverityBadge = (size: number | undefined) => {
  if (!size) return { label: 'Unknown', class: 'badge-secondary' }
  if (size >= 2.0) return { label: `${size}"`, class: 'badge-hail-severe' }
  if (size >= 1.5) return { label: `${size}"`, class: 'badge-hail-significant' }
  if (size >= 1.0) return { label: `${size}"`, class: 'badge-hail-moderate' }
  return { label: `${size}"`, class: 'badge-hail-minor' }
}

const getScoreColor = (score: number | undefined) => {
  if (!score) return 'text-foreground-subtle'
  if (score >= 80) return 'text-success'
  if (score >= 60) return 'text-primary'
  if (score >= 40) return 'text-warning'
  return 'text-foreground-muted'
}

export default function LeadCard({ lead, isDragging, onSelect }: LeadCardProps) {
  const severity = getSeverityBadge(lead.hail_size)
  const daysSinceCreated = formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })

  return (
    <div
      className={`
        kanban-card group
        ${isDragging ? 'kanban-card-dragging opacity-50' : ''}
      `}
      onClick={onSelect}
    >
      {/* Drag Handle */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4 text-foreground-subtle cursor-grab" />
        </div>
        <div className="flex items-center gap-1.5 flex-1 justify-end">
          {lead.hail_size && (
            <span className={`badge text-2xs ${severity.class}`}>
              <CloudLightning className="w-3 h-3 mr-0.5" />
              {severity.label}
            </span>
          )}
          {lead.lead_score && (
            <span className={`font-mono text-xs font-bold ${getScoreColor(lead.lead_score)}`}>
              {lead.lead_score}
            </span>
          )}
        </div>
      </div>

      {/* Name & Address */}
      <div className="mb-3">
        <h4 className="font-medium text-sm text-foreground truncate mb-0.5">
          {lead.name || 'Property Owner'}
        </h4>
        <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{lead.property_address}</span>
        </div>
      </div>

      {/* Contact Info */}
      {(lead.phone || lead.email) && (
        <div className="flex items-center gap-3 mb-3 text-xs">
          {lead.phone && (
            <div className="flex items-center gap-1 text-foreground-muted">
              <Phone className="w-3 h-3" />
              <span>{lead.phone}</span>
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-1 text-foreground-muted truncate">
              <Mail className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border-muted">
        <div className="flex items-center gap-1 text-2xs text-foreground-subtle">
          <Clock className="w-3 h-3" />
          <span>{daysSinceCreated}</span>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={`/leads/${lead.id}`}
            className="btn btn-ghost btn-icon btn-sm opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button 
            className="btn btn-ghost btn-icon btn-sm opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              // Open menu
            }}
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
