'use client'

import { useState, useRef } from 'react'
import LeadCard from './LeadCard'
import { Plus, MoreHorizontal, ChevronDown, ChevronUp } from 'lucide-react'

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

interface PipelineStage {
  id: string
  name: string
  color: string
  icon?: string
}

interface KanbanBoardProps {
  leads: Lead[]
  stages: PipelineStage[]
  onLeadMove?: (leadId: string, newStatus: string) => void
  onLeadSelect?: (lead: Lead) => void
  isLoading?: boolean
}

const stageColors: Record<string, string> = {
  'New': 'border-primary/50 bg-primary-muted/30',
  'Contacted': 'border-purple-500/50 bg-purple-500/10',
  'Appointment Set': 'border-warning/50 bg-warning-muted/30',
  'Appointment': 'border-warning/50 bg-warning-muted/30',
  'Inspection Done': 'border-pink-500/50 bg-pink-500/10',
  'Inspection': 'border-pink-500/50 bg-pink-500/10',
  'Proposal Sent': 'border-blue-500/50 bg-blue-500/10',
  'Contract Signed': 'border-success/50 bg-success-muted/30',
  'Contract': 'border-success/50 bg-success-muted/30',
  'Job Complete': 'border-emerald-500/50 bg-emerald-500/10',
  'Lost': 'border-destructive/50 bg-destructive-muted/30',
}

const stageDotColors: Record<string, string> = {
  'New': 'bg-primary',
  'Contacted': 'bg-purple-500',
  'Appointment Set': 'bg-warning',
  'Appointment': 'bg-warning',
  'Inspection Done': 'bg-pink-500',
  'Inspection': 'bg-pink-500',
  'Proposal Sent': 'bg-blue-500',
  'Contract Signed': 'bg-success',
  'Contract': 'bg-success',
  'Job Complete': 'bg-emerald-500',
  'Lost': 'bg-destructive',
}

export default function KanbanBoard({
  leads,
  stages,
  onLeadMove,
  onLeadSelect,
  isLoading = false
}: KanbanBoardProps) {
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)
  const [collapsedStages, setCollapsedStages] = useState<Set<string>>(new Set())

  // Group leads by status
  const leadsByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = leads.filter(lead => 
      lead.status.toLowerCase() === stage.id.toLowerCase() ||
      lead.status === stage.name
    )
    return acc
  }, {} as Record<string, Lead[]>)

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', lead.id)
  }

  const handleDragEnd = () => {
    setDraggedLead(null)
    setDragOverStage(null)
  }

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverStage(stageId)
  }

  const handleDragLeave = () => {
    setDragOverStage(null)
  }

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    if (draggedLead && draggedLead.status !== stageId) {
      onLeadMove?.(draggedLead.id, stageId)
    }
    setDraggedLead(null)
    setDragOverStage(null)
  }

  const toggleStageCollapse = (stageId: string) => {
    const newCollapsed = new Set(collapsedStages)
    if (newCollapsed.has(stageId)) {
      newCollapsed.delete(stageId)
    } else {
      newCollapsed.add(stageId)
    }
    setCollapsedStages(newCollapsed)
  }

  // Calculate total value per stage
  const getStageValue = (stageLeads: Lead[]) => {
    const total = stageLeads.reduce((sum, lead) => sum + (lead.property_value || 0), 0)
    return total > 0 ? `$${(total / 1000).toFixed(0)}k` : null
  }

  if (isLoading) {
    return (
      <div className="flex gap-4 p-4 overflow-x-auto scrollbar-thin h-full">
        {stages.map((stage) => (
          <div key={stage.id} className="kanban-column flex-shrink-0">
            <div className="kanban-column-header">
              <div className="w-32 h-5 bg-muted rounded animate-pulse" />
            </div>
            <div className="kanban-column-body">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 bg-muted/50 rounded-lg animate-pulse h-24" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-4 p-4 overflow-x-auto scrollbar-thin h-full">
      {stages.map((stage, index) => {
        const stageLeads = leadsByStage[stage.id] || []
        const isCollapsed = collapsedStages.has(stage.id)
        const isDragOver = dragOverStage === stage.id
        const stageValue = getStageValue(stageLeads)

        return (
          <div
            key={stage.id}
            className={`
              kanban-column flex-shrink-0 
              animate-fade-in-up border-t-2
              ${stageColors[stage.name] || 'border-border bg-background-secondary'}
              ${isDragOver ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
            `}
            style={{ animationDelay: `${index * 50}ms` }}
            onDragOver={(e) => handleDragOver(e, stage.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            {/* Column Header */}
            <div className="kanban-column-header">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleStageCollapse(stage.id)}
                  className="btn btn-ghost btn-icon btn-sm -ml-1"
                >
                  {isCollapsed ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </button>
                <div className={`w-2.5 h-2.5 rounded-full ${stageDotColors[stage.name] || 'bg-foreground-subtle'}`} />
                <span className="kanban-column-title">{stage.name}</span>
                <span className="kanban-column-count">{stageLeads.length}</span>
              </div>
              
              <div className="flex items-center gap-1">
                {stageValue && (
                  <span className="text-xs font-mono text-foreground-muted mr-1">
                    {stageValue}
                  </span>
                )}
                <button className="btn btn-ghost btn-icon btn-sm">
                  <Plus className="w-4 h-4" />
                </button>
                <button className="btn btn-ghost btn-icon btn-sm">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Column Body */}
            {!isCollapsed && (
              <div className="kanban-column-body">
                {stageLeads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[100px] text-center p-4">
                    <p className="text-sm text-foreground-subtle">
                      No leads in this stage
                    </p>
                    {isDragOver && (
                      <p className="text-xs text-primary mt-1">
                        Drop lead here
                      </p>
                    )}
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead)}
                      onDragEnd={handleDragEnd}
                    >
                      <LeadCard
                        lead={lead}
                        isDragging={draggedLead?.id === lead.id}
                        onSelect={() => onLeadSelect?.(lead)}
                      />
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Collapsed View */}
            {isCollapsed && (
              <div className="p-3 text-center">
                <span className="text-sm text-foreground-muted">
                  {stageLeads.length} lead{stageLeads.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
