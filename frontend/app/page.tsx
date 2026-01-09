'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function HomePage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stats/dashboard`)
      .then(res => res.json())
      .then(data => { setStats(data.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Brutalist Header */}
      <header className="border-b-4 border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-wider uppercase">
                Wisconsin Hail CRM
              </h1>
              <p className="text-sm font-mono text-muted-foreground mt-1">
                Lead Generation • Skip Tracing • Marketing Automation
              </p>
            </div>
            <div className="flex gap-4">
              <Link href="/dashboard" className="btn btn-primary">
                Dashboard
              </Link>
              <button 
                onClick={() => document.documentElement.classList.toggle('dark')}
                className="btn btn-secondary"
              >
                Theme
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b-2 border-border bg-card py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-6 uppercase">
                Storm-Verified Lead Generation
              </h2>
              <p className="text-lg text-muted-foreground mb-8 font-mono">
                Leverage NOAA hail data (2023-2026) with automated skip tracing, 
                marketing campaigns, and GoHighLevel integration.
              </p>
              <div className="flex gap-4 flex-wrap">
                <Link href="/leads" className="btn btn-primary">
                  View Leads
                </Link>
                <Link href="/campaigns" className="btn btn-secondary">
                  Campaigns
                </Link>
                <Link href="/skiptrace" className="btn btn-accent">
                  Skip Trace
                </Link>
              </div>
            </div>
            
            {/* Quick Stats */}
            {stats && (
              <div className="grid grid-cols-2 gap-4">
                <div className="card">
                  <div className="data-display text-4xl font-bold text-primary">{stats.overview.totalLeads}</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mt-2">Total Leads</div>
                </div>
                <div className="card">
                  <div className="data-display text-4xl font-bold text-secondary">{stats.overview.activeCampaigns}</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mt-2">Active Campaigns</div>
                </div>
                <div className="card">
                  <div className="data-display text-4xl font-bold text-accent">{stats.overview.conversionRate}%</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mt-2">Conversion Rate</div>
                </div>
                <div className="card">
                  <div className="data-display text-4xl font-bold text-destructive">${(stats.overview.pipelineValue / 1000000).toFixed(1)}M</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mt-2">Pipeline Value</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-2xl font-bold text-foreground mb-8 uppercase">Features</h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="card border-l-4 border-l-primary">
              <h4 className="text-lg font-bold text-primary mb-3 uppercase">Hail Data API</h4>
              <p className="text-sm text-muted-foreground font-mono">
                Wisconsin hail reports (2023-2026) with severity scoring, 
                county filtering, and statistics.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card border-l-4 border-l-secondary">
              <h4 className="text-lg font-bold text-secondary mb-3 uppercase">Lead CRM</h4>
              <p className="text-sm text-muted-foreground font-mono">
                Full pipeline management with stages, scoring, notes, 
                tags, and team assignment.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card border-l-4 border-l-accent">
              <h4 className="text-lg font-bold text-accent mb-3 uppercase">Skip Tracing</h4>
              <p className="text-sm text-muted-foreground font-mono">
                Bulk skip tracing with phone verification, email validation, 
                and property owner confirmation.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card border-l-4 border-l-destructive">
              <h4 className="text-lg font-bold text-destructive mb-3 uppercase">Marketing Automation</h4>
              <p className="text-sm text-muted-foreground font-mono">
                Email sequences, SMS campaigns, direct mail integration, 
                and ringless voicemail.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="card border-l-4 border-l-primary">
              <h4 className="text-lg font-bold text-primary mb-3 uppercase">GoHighLevel Sync</h4>
              <p className="text-sm text-muted-foreground font-mono">
                Two-way contact sync, pipeline synchronization, 
                workflow triggers, and webhooks.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="card border-l-4 border-l-secondary">
              <h4 className="text-lg font-bold text-secondary mb-3 uppercase">Mobile-First</h4>
              <p className="text-sm text-muted-foreground font-mono">
                Touch-optimized interface with 44px+ targets, 
                responsive design, and offline support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Brutalist Footer */}
      <footer className="border-t-4 border-border bg-card py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="font-mono text-sm text-muted-foreground">
              WISCONSIN HAIL CRM v2.0.0 • ULTRATHINK EDITION
            </div>
            <div className="font-mono text-sm text-muted-foreground">
              {new Date().getFullYear()} • BRUTALIST DESIGN SYSTEM
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
