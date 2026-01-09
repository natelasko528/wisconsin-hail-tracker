'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function SkiptracePage() {
  const [leads, setLeads] = useState<any[]>([])
  const [processing, setProcessing] = useState<string[]>([])
  const [results, setResults] = useState<Map<number, any>>(new Map())

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leads`)
      .then(res => res.json())
      .then(data => setLeads(data.data))
  }, [])

  const handleSkipTrace = async (leadId: number) => {
    setProcessing([...processing, leadId.toString()])
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/skiptrace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId })
      })
      const data = await res.json()
      setResults(new Map(results.set(leadId, data.data)))
    } finally {
      setProcessing(processing.filter(id => id !== leadId.toString()))
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b-4 border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-xl font-bold text-primary uppercase">← Dashboard</Link>
            <h1 className="text-2xl font-bold text-foreground uppercase">Skip Tracing</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="card border-l-4 border-l-primary mb-8">
          <h3 className="text-lg font-bold text-primary mb-2 uppercase">About Skip Tracing</h3>
          <p className="text-sm text-muted-foreground font-mono">
            Automatically find homeowner contact information using TLOxp and NCFS database.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leads.map(lead => {
            const result = results.get(lead.id)
            const isProcessing = processing.includes(lead.id.toString())

            return (
              <div key={lead.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="font-bold text-foreground">{lead.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{lead.propertyAddress}</div>
                  </div>
                  <span className="badge bg-secondary text-secondary-foreground">Score: {lead.score}</span>
                </div>

                {result ? (
                  <div className="space-y-3 pt-4 border-t-2 border-border">
                    <div className="text-xs uppercase tracking-wider text-primary font-bold">Results</div>
                    <div className="font-mono text-sm">{result.data.phones[0]?.number}</div>
                    <div className="font-mono text-sm">{result.data.emails[0]?.address}</div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSkipTrace(lead.id)}
                    disabled={isProcessing}
                    className="btn btn-primary w-full mt-4"
                  >
                    {isProcessing ? 'Processing...' : 'Skip Trace'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
