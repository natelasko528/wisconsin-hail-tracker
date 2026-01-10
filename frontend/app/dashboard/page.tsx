'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stats/dashboard`).then(r => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leads?limit=10`).then(r => r.json())
    ]).then(([statsData, leadsData]) => {
      setStats(statsData.data)
      setLeads(leadsData.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const getSeverityBadge = (severity: string) => {
    const classes: Record<string, string> = {
      critical: 'badge-critical',
      high: 'badge-high',
      medium: 'badge-medium',
      low: 'badge-low'
    }
    return classes[severity] || 'badge-low'
  }

  const getStageBadge = (stage: string) => {
    return `stage-${stage}`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-4 border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-xl font-bold text-primary uppercase">
                ← Home
              </Link>
              <h1 className="text-2xl font-bold text-foreground uppercase">Dashboard</h1>
            </div>
            <nav className="flex gap-4">
              <Link href="/leads" className="btn btn-secondary text-sm">Leads</Link>
              <Link href="/campaigns" className="btn btn-secondary text-sm">Campaigns</Link>
              <Link href="/skiptrace" className="btn btn-secondary text-sm">Skip Trace</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="font-mono text-sm text-muted-foreground mt-4">LOADING DATA...</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="card">
                  <div className="data-display text-3xl font-bold text-primary">{stats.overview.totalLeads}</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mt-2">Total Leads</div>
                </div>
                <div className="card">
                  <div className="data-display text-3xl font-bold text-secondary">{stats.overview.activeCampaigns}</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mt-2">Active Campaigns</div>
                </div>
                <div className="card">
                  <div className="data-display text-3xl font-bold text-accent">{stats.overview.conversionRate}%</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mt-2">Conversion Rate</div>
                </div>
                <div className="card">
                  <div className="data-display text-3xl font-bold text-destructive">${(stats.overview.pipelineValue / 1000000).toFixed(1)}M</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mt-2">Pipeline Value</div>
                </div>
              </div>
            )}

            {/* Main Grid */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Recent Leads */}
              <div className="card">
                <h3 className="text-lg font-bold text-foreground mb-4 uppercase flex items-center justify-between">
                  Recent Leads
                  <Link href="/leads" className="text-sm text-accent hover:underline">View All →</Link>
                </h3>
                <div className="space-y-3">
                  {leads.slice(0, 5).map(lead => (
                    <div key={lead.id} className="border-2 border-border p-4 hover:bg-muted transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-bold text-foreground">{lead.name}</div>
                          <div className="font-mono text-xs text-muted-foreground">{lead.propertyAddress}</div>
                        </div>
                        <span className={`badge ${getStageBadge(lead.stage)}`}>{lead.stage}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-mono text-muted-foreground">
                        <span>Score: {lead.score}</span>
                        <span>Hail: {lead.hailSize}"</span>
                        <span>${(lead.propertyValue / 1000).toFixed(0)}k</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hail Activity */}
              {stats && (
                <div className="card">
                  <h3 className="text-lg font-bold text-foreground mb-4 uppercase">Hail Activity</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 border-2 border-border">
                      <span className="text-sm font-mono">Total Reports</span>
                      <span className="data-display font-bold text-primary">{stats.hailActivity.totalReports}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border-2 border-border">
                      <span className="text-sm font-mono">Critical Events</span>
                      <span className="data-display font-bold text-destructive">{stats.hailActivity.criticalEvents}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border-2 border-border">
                      <span className="text-sm font-mono">Affected Counties</span>
                      <span className="data-display font-bold text-accent">{stats.hailActivity.affectedCounties}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border-2 border-border">
                      <span className="text-sm font-mono">Avg Hail Size</span>
                      <span className="data-display font-bold text-secondary">{stats.hailActivity.avgHailSize}"</span>
                    </div>
                  </div>

                  {/* Severity Breakdown */}
                  <div className="mt-6 pt-6 border-t-2 border-border">
                    <h4 className="text-sm font-bold text-foreground mb-3 uppercase">Severity Breakdown</h4>
                    <div className="space-y-2">
                      {Object.entries(stats.hailActivity.severityBreakdown || {}).map(([severity, count]) => (
                        <div key={severity} className="flex items-center gap-3">
                          <span className={`badge ${getSeverityBadge(severity)}`}>{severity}</span>
                          <div className="flex-1 h-6 bg-muted border border-border">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${(Number(count) / stats.hailActivity.totalReports) * 100}%` }}
                            ></div>
                          </div>
                          <span className="data-display text-sm w-8 text-right">{String(count)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Activity Feed */}
            {stats && (
              <div className="card mt-8">
                <h3 className="text-lg font-bold text-foreground mb-4 uppercase">Recent Activity</h3>
                <div className="space-y-3">
                  {stats.recentActivity.map((activity: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-4 p-3 border-2 border-border">
                      <div className="w-2 h-2 bg-primary mt-2"></div>
                      <div className="flex-1">
                        <div className="font-mono text-sm text-foreground">{activity.message}</div>
                        <div className="text-xs text-muted-foreground mt-1">{activity.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
