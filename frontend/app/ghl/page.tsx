'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function GHLPage() {
  const [syncLogs, setSyncLogs] = useState<any[]>([])

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ghl/sync/logs`)
      .then(res => res.json())
      .then(data => setSyncLogs(data.data))
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b-4 border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-xl font-bold text-primary uppercase">← Dashboard</Link>
            <h1 className="text-2xl font-bold text-foreground uppercase">GoHighLevel</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="card border-l-4 border-l-secondary mb-8">
          <h3 className="text-lg font-bold text-secondary mb-2 uppercase">Connected</h3>
          <p className="text-sm text-muted-foreground font-mono">Two-way sync active</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card text-center">
            <div className="text-4xl mb-4">🔄</div>
            <h4 className="font-bold mb-2">Sync All Leads</h4>
            <button className="btn btn-primary w-full">Sync Now</button>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-4">📊</div>
            <h4 className="font-bold mb-2">Import Contacts</h4>
            <button className="btn btn-secondary w-full">Import</button>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-4">⚙️</div>
            <h4 className="font-bold mb-2">Configure</h4>
            <button className="btn btn-accent w-full">Settings</button>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-bold text-foreground mb-4 uppercase">Sync Log</h3>
          <div className="space-y-3">
            {syncLogs.map((log, idx) => (
              <div key={idx} className="p-4 border-2 border-border font-mono text-sm">
                <div className="font-bold">{log.action.toUpperCase()}</div>
                <div className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
