'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/campaigns`)
      .then(res => res.json())
      .then(data => { setCampaigns(data.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const getStatusBadge = (status: string) => {
    const classes = {
      active: 'bg-secondary text-secondary-foreground',
      scheduled: 'bg-accent text-accent-foreground',
      draft: 'bg-muted text-muted-foreground'
    }
    return classes[status] || 'bg-muted'
  }

  const getTypeIcon = (type: string) => {
    const icons = { email: '✉', sms: '📱', direct_mail: '📬', ringless_voicemail: '🔔' }
    return icons[type] || '📢'
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b-4 border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-xl font-bold text-primary uppercase">← Dashboard</Link>
            <h1 className="text-2xl font-bold text-foreground uppercase">Campaigns</h1>
            <button className="btn btn-primary">+ New Campaign</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map(campaign => (
            <div key={campaign.id} className="card cursor-pointer hover:shadow-lg" onClick={() => setSelectedCampaign(campaign)}>
              <div className="flex items-start justify-between mb-4">
                <div className="text-3xl">{getTypeIcon(campaign.type)}</div>
                <span className={`badge ${getStatusBadge(campaign.status)}`}>{campaign.status}</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2 uppercase">{campaign.name}</h3>
              <p className="text-sm font-mono text-muted-foreground mb-4">{campaign.type} • {campaign.leadsCount} leads</p>
              <div className="grid grid-cols-3 gap-2 pt-4 border-t-2 border-border">
                <div className="text-center">
                  <div className="data-display text-lg font-bold">{campaign.stats?.sent || 0}</div>
                  <div className="text-xs text-muted-foreground">Sent</div>
                </div>
                <div className="text-center">
                  <div className="data-display text-lg font-bold text-accent">{campaign.stats?.opened || 0}</div>
                  <div className="text-xs text-muted-foreground">Opened</div>
                </div>
                <div className="text-center">
                  <div className="data-display text-lg font-bold text-secondary">{campaign.stats?.clicked || 0}</div>
                  <div className="text-xs text-muted-foreground">Clicked</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
