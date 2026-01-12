'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Mail, MessageSquare, Send, Phone, Plus, X, Play, BarChart3 } from 'lucide-react'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null)

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
    fetch(`${apiUrl}/api/campaigns`)
      .then(res => res.json())
      .then(data => { 
        setCampaigns(data.data || [])
        setLoading(false) 
      })
      .catch(() => setLoading(false))
  }, [])

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      active: 'bg-green-100 text-green-800 border-green-200',
      scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
      paused: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      completed: 'bg-purple-100 text-purple-800 border-purple-200'
    }
    return classes[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail size={24} className="text-blue-500" />
      case 'sms': return <MessageSquare size={24} className="text-green-500" />
      case 'direct_mail': return <Send size={24} className="text-purple-500" />
      case 'ringless_voicemail': return <Phone size={24} className="text-orange-500" />
      default: return <Mail size={24} className="text-gray-500" />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard" 
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
              >
                ← Dashboard
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <BarChart3 size={24} className="text-primary" />
                <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Campaigns</h1>
              </div>
            </div>
            <button className="btn-primary flex items-center gap-2">
              <Plus size={18} />
              <span className="hidden sm:inline">New Campaign</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading campaigns...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="card p-8 text-center">
            <BarChart3 size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">No campaigns yet</p>
            <p className="text-muted-foreground mb-4">Create your first marketing campaign to start reaching leads</p>
            <button className="btn-primary">
              <Plus size={18} />
              Create Campaign
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map(campaign => (
              <div 
                key={campaign.id} 
                className="card p-5 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedCampaign(campaign)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 rounded-lg bg-muted">
                    {getTypeIcon(campaign.type)}
                  </div>
                  <span className={`badge ${getStatusBadge(campaign.status)}`}>
                    {campaign.status}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{campaign.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {campaign.type?.replace('_', ' ')} • {campaign.leadsCount || 0} leads
                </p>
                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border">
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">{campaign.stats?.sent || 0}</div>
                    <div className="text-xs text-muted-foreground">Sent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{campaign.stats?.opened || 0}</div>
                    <div className="text-xs text-muted-foreground">Opened</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{campaign.stats?.clicked || 0}</div>
                    <div className="text-xs text-muted-foreground">Clicked</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Campaign Detail Modal */}
      {selectedCampaign && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setSelectedCampaign(null)}
        >
          <div 
            className="card max-w-lg w-full p-6 animate-slide-in-from-bottom"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  {getTypeIcon(selectedCampaign.type)}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{selectedCampaign.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedCampaign.type?.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCampaign(null)} 
                className="btn-ghost p-2 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</div>
                  <span className={`badge ${getStatusBadge(selectedCampaign.status)}`}>
                    {selectedCampaign.status}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Leads</div>
                  <div className="text-lg font-bold text-foreground">{selectedCampaign.leadsCount || 0}</div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Performance</div>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-foreground">{selectedCampaign.stats?.sent || 0}</div>
                    <div className="text-xs text-muted-foreground">Sent</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-green-600">{selectedCampaign.stats?.opened || 0}</div>
                    <div className="text-xs text-muted-foreground">Opened</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-blue-600">{selectedCampaign.stats?.clicked || 0}</div>
                    <div className="text-xs text-muted-foreground">Clicked</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-purple-600">{selectedCampaign.stats?.converted || 0}</div>
                    <div className="text-xs text-muted-foreground">Converted</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                {selectedCampaign.status === 'draft' && (
                  <button className="btn-primary flex-1 flex items-center justify-center gap-2">
                    <Play size={16} />
                    Launch Campaign
                  </button>
                )}
                <button className="btn-secondary flex-1">Edit</button>
                <button className="btn-outline flex-1">View Report</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
