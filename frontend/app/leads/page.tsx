'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const PIPELINE_STAGES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [filter, setFilter] = useState({ stage: '', search: '' })
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<any>(null)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leads`)
      .then(res => res.json())
      .then(data => { setLeads(data.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filteredLeads = leads.filter(lead => {
    if (filter.stage && lead.stage !== filter.stage) return false
    if (filter.search) {
      const search = filter.search.toLowerCase()
      if (!lead.name.toLowerCase().includes(search) && 
          !lead.propertyAddress.toLowerCase().includes(search)) return false
    }
    return true
  })

  const getStageBadge = (stage: string) => `stage-${stage}`

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b-4 border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-xl font-bold text-primary uppercase">← Dashboard</Link>
              <h1 className="text-2xl font-bold text-foreground uppercase">Lead Pipeline</h1>
            </div>
            <button className="btn btn-primary">+ Add Lead</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="card mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search leads..."
                className="input w-full"
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              />
            </div>
            <div>
              <select 
                className="input"
                value={filter.stage}
                onChange={(e) => setFilter({ ...filter, stage: e.target.value })}
              >
                <option value="">All Stages</option>
                {PIPELINE_STAGES.map(stage => (
                  <option key={stage} value={stage}>{stage.replace('_', ' ').toUpperCase()}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-secondary">Export CSV</button>
            <button className="btn btn-accent">Skip Trace Batch</button>
          </div>
        </div>

        {/* Pipeline Stages Summary */}
        <div className="grid grid-cols-4 md:grid-cols-7 gap-3 mb-8">
          {PIPELINE_STAGES.map(stage => (
            <div key={stage} className="card text-center cursor-pointer hover:shadow-lg transition-shadow">
              <div className="text-2xl font-bold text-primary">{leads.filter(l => l.stage === stage).length}</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{stage.replace('_', ' ')}</div>
            </div>
          ))}
        </div>

        {/* Leads Table */}
        <div className="card overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>Stage</th>
                <th>Score</th>
                <th>Hail Size</th>
                <th>Value</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map(lead => (
                <tr key={lead.id} className="cursor-pointer" onClick={() => setSelectedLead(lead)}>
                  <td>
                    <div className="font-bold text-foreground">{lead.name}</div>
                    {lead.email && <div className="font-mono text-xs text-muted-foreground">{lead.email}</div>}
                  </td>
                  <td className="font-mono text-sm">{lead.propertyAddress}</td>
                  <td>
                    <span className={`badge ${getStageBadge(lead.stage)}`}>{lead.stage.replace('_', ' ')}</span>
                  </td>
                  <td className="data-display font-bold text-primary">{lead.score}</td>
                  <td className="data-display">{lead.hailSize}"</td>
                  <td className="data-display">${(lead.propertyValue / 1000).toFixed(0)}k</td>
                  <td>
                    <button className="btn btn-secondary text-xs py-2 px-3">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedLead(null)}>
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-foreground uppercase">{selectedLead.name}</h2>
              <button onClick={() => setSelectedLead(null)} className="text-2xl text-muted-foreground">×</button>
            </div>
            
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Property Address</div>
                  <div className="font-mono text-sm">{selectedLead.propertyAddress}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Email</div>
                  <div className="font-mono text-sm">{selectedLead.email || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Phone</div>
                  <div className="font-mono text-sm">{selectedLead.phone || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Stage</div>
                  <span className={`badge ${getStageBadge(selectedLead.stage)}`}>{selectedLead.stage.replace('_', ' ')}</span>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Lead Score</div>
                  <div className="data-display text-2xl font-bold text-primary">{selectedLead.score}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Property Value</div>
                  <div className="data-display">${selectedLead.propertyValue.toLocaleString()}</div>
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Tags</div>
                <div className="flex flex-wrap gap-2">
                  {selectedLead.tags.map((tag: string) => (
                    <span key={tag} className="badge bg-muted text-muted-foreground">{tag}</span>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Notes</div>
                {selectedLead.notes.length > 0 ? (
                  <div className="space-y-2">
                    {selectedLead.notes.map((note: any) => (
                      <div key={note.id} className="p-3 border-2 border-border bg-muted">
                        <div className="text-sm">{note.text}</div>
                        <div className="text-xs text-muted-foreground mt-1 font-mono">{note.author} • {new Date(note.date).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No notes yet</div>
                )}
              </div>

              <div className="flex gap-4 pt-4 border-t-2 border-border">
                <button className="btn btn-primary flex-1">Edit Lead</button>
                <button className="btn btn-secondary flex-1">Skip Trace</button>
                <button className="btn btn-accent flex-1">Add Note</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
