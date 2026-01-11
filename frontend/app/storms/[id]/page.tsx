'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import AppLayout from '@/components/AppLayout'
import Link from 'next/link'
import { 
  ArrowLeft,
  MapPin,
  Calendar,
  CloudLightning,
  Download,
  Share,
  Home,
  AlertTriangle,
  TrendingUp,
  Target,
  FileText,
  Users,
  ExternalLink,
  Copy,
  CheckCircle
} from 'lucide-react'
import { format } from 'date-fns'

// Dynamic map import
const StormMap = dynamic(
  () => import('@/components/storm/StormMap'),
  { ssr: false }
)

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
  damage_crops?: string
  narrative?: string
  source?: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const getSeverityInfo = (size: number) => {
  if (size >= 2.5) return { label: 'Extreme', class: 'badge-hail-extreme', color: 'destructive', description: 'Catastrophic damage - immediate action required' }
  if (size >= 2.0) return { label: 'Severe', class: 'badge-hail-severe', color: 'destructive', description: 'Major structural damage likely' }
  if (size >= 1.5) return { label: 'Significant', class: 'badge-hail-significant', color: 'warning', description: 'Moderate damage expected' }
  if (size >= 1.0) return { label: 'Moderate', class: 'badge-hail-moderate', color: 'warning', description: 'Minor damage possible' }
  return { label: 'Minor', class: 'badge-hail-minor', color: 'success', description: 'Cosmetic damage only' }
}

export default function StormDetailPage() {
  const params = useParams()
  const router = useRouter()
  const stormId = params.id as string

  const [storm, setStorm] = useState<StormEvent | null>(null)
  const [nearbyStorms, setNearbyStorms] = useState<StormEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [isConverting, setIsConverting] = useState(false)

  // Fetch storm data
  const fetchStorm = useCallback(async () => {
    if (!stormId) return
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/hail/${stormId}`)
      const data = await response.json()
      if (data.success || data.data) {
        setStorm(data.data || data)
      }
    } catch (error) {
      console.error('Error fetching storm:', error)
    } finally {
      setIsLoading(false)
    }
  }, [stormId])

  useEffect(() => {
    fetchStorm()
  }, [fetchStorm])

  const handleCopyLocation = async () => {
    if (!storm) return
    const text = `${storm.city || 'Unknown'}, ${storm.county} County, ${storm.state || 'WI'} - ${storm.latitude.toFixed(4)}, ${storm.longitude.toFixed(4)}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleConvertToLead = async () => {
    if (!storm) return
    setIsConverting(true)
    try {
      const response = await fetch(`${API_URL}/api/hail/convert-to-leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stormEventIds: [storm.id] })
      })
      const data = await response.json()
      if (data.success) {
        alert('Lead created successfully!')
        router.push('/leads')
      }
    } catch (error) {
      console.error('Error converting to lead:', error)
    } finally {
      setIsConverting(false)
    }
  }

  const handleExportReport = () => {
    // Generate PDF report
    window.print()
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-foreground-muted">Loading storm data...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!storm) {
    return (
      <AppLayout>
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <CloudLightning className="w-12 h-12 text-foreground-subtle mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Storm not found</h2>
            <p className="text-foreground-muted mb-4">The storm event you're looking for doesn't exist.</p>
            <Link href="/" className="btn btn-primary">
              Back to Storm Command
            </Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  const severity = getSeverityInfo(storm.hail_size)
  const estimatedDamage = storm.hail_size >= 2.5 ? { min: 15000, max: 50000 } :
                          storm.hail_size >= 2.0 ? { min: 8000, max: 20000 } :
                          storm.hail_size >= 1.5 ? { min: 4000, max: 12000 } :
                          storm.hail_size >= 1.0 ? { min: 1500, max: 6000 } :
                          { min: 500, max: 2000 }

  return (
    <AppLayout>
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 border-b border-border bg-background-secondary/50 backdrop-blur">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="btn btn-ghost btn-icon btn-sm">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-destructive-muted flex items-center justify-center">
                  <CloudLightning className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h1 className="font-display text-lg font-bold text-foreground">
                    Storm Event #{storm.event_id || storm.id.slice(0, 8)}
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-foreground-muted">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{storm.city || 'Unknown'}, {storm.county} County</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`badge ${severity.class}`}>
                {severity.label}
              </span>
              <button onClick={handleCopyLocation} className="btn btn-ghost btn-sm">
                {copied ? <CheckCircle className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </button>
              <button className="btn btn-ghost btn-sm">
                <Share className="w-4 h-4" />
              </button>
              <button onClick={handleExportReport} className="btn btn-outline btn-sm">
                <Download className="w-4 h-4" />
                Export PDF
              </button>
              <button 
                onClick={handleConvertToLead}
                disabled={isConverting}
                className="btn btn-primary btn-sm"
              >
                <Users className="w-4 h-4" />
                Convert to Lead
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Map */}
              <div className="card overflow-hidden p-0">
                <div className="h-80">
                  <StormMap
                    events={[storm]}
                    selectedEvent={storm}
                    center={[storm.latitude, storm.longitude]}
                    zoom={10}
                    className="h-full"
                  />
                </div>
              </div>

              {/* Severity Card */}
              <div className={`card border-l-4 ${
                storm.hail_size >= 2.0 ? 'border-l-destructive bg-destructive-muted/20' :
                storm.hail_size >= 1.5 ? 'border-l-warning bg-warning-muted/20' :
                'border-l-primary bg-primary-muted/20'
              }`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="font-mono text-5xl font-bold text-foreground">
                    {storm.hail_size}"
                  </div>
                  <div>
                    <span className={`badge ${severity.class} mb-1`}>
                      {severity.label} Hail
                    </span>
                    <p className="text-sm text-foreground-muted">{severity.description}</p>
                  </div>
                </div>
                
                {storm.damage_property && storm.damage_property !== '0' && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    <span className="text-sm font-medium text-destructive">
                      Property Damage Reported: {storm.damage_property}
                    </span>
                  </div>
                )}
              </div>

              {/* Narrative */}
              {storm.narrative && (
                <div className="card">
                  <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Event Narrative
                  </h3>
                  <p className="text-foreground-muted leading-relaxed">{storm.narrative}</p>
                </div>
              )}

              {/* Damage Estimate */}
              <div className="card">
                <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-success" />
                  Estimated Repair Costs
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-xs text-foreground-subtle uppercase mb-1">Low Estimate</div>
                    <div className="font-mono text-xl font-bold text-foreground">
                      ${estimatedDamage.min.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-4 bg-primary-muted rounded-lg text-center">
                    <div className="text-xs text-foreground-subtle uppercase mb-1">Average</div>
                    <div className="font-mono text-xl font-bold text-primary">
                      ${((estimatedDamage.min + estimatedDamage.max) / 2).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-xs text-foreground-subtle uppercase mb-1">High Estimate</div>
                    <div className="font-mono text-xl font-bold text-foreground">
                      ${estimatedDamage.max.toLocaleString()}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-foreground-subtle mt-4">
                  * Estimates based on average roof repair costs for {storm.hail_size}" hail damage. Actual costs may vary.
                </p>
              </div>

              {/* Insurance Report Section */}
              <div className="card">
                <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-warning" />
                  Insurance-Ready Report
                </h3>
                <p className="text-sm text-foreground-muted mb-4">
                  Generate a professional report documenting this hail event for insurance claims.
                </p>
                <div className="flex items-center gap-3">
                  <button className="btn btn-primary">
                    <Download className="w-4 h-4" />
                    Generate PDF Report
                  </button>
                  <button className="btn btn-outline">
                    <Share className="w-4 h-4" />
                    Share Report
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Event Details Card */}
              <div className="card">
                <h3 className="font-display font-semibold text-foreground mb-4">Event Details</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-border-muted">
                    <span className="text-sm text-foreground-muted">Event ID</span>
                    <span className="font-mono text-sm">{storm.event_id || storm.id.slice(0, 12)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border-muted">
                    <span className="text-sm text-foreground-muted">Date</span>
                    <span className="text-sm font-medium">
                      {format(new Date(storm.event_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border-muted">
                    <span className="text-sm text-foreground-muted">Time</span>
                    <span className="text-sm font-medium">
                      {format(new Date(storm.event_date), 'h:mm a')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border-muted">
                    <span className="text-sm text-foreground-muted">Location</span>
                    <span className="text-sm font-medium text-right">
                      {storm.city || 'Unknown'}<br />
                      <span className="text-foreground-muted">{storm.county} County, {storm.state || 'WI'}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border-muted">
                    <span className="text-sm text-foreground-muted">Coordinates</span>
                    <span className="font-mono text-xs">
                      {storm.latitude.toFixed(4)}, {storm.longitude.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-foreground-muted">Source</span>
                    <span className="text-sm">{storm.source || 'NOAA'}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card">
                <h3 className="font-display font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button 
                    onClick={handleConvertToLead}
                    disabled={isConverting}
                    className="w-full btn btn-primary justify-start"
                  >
                    <Users className="w-4 h-4" />
                    Convert to Lead
                  </button>
                  <a
                    href={`https://www.google.com/maps?q=${storm.latitude},${storm.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full btn btn-outline justify-start"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in Google Maps
                  </a>
                  <button className="w-full btn btn-outline justify-start">
                    <Target className="w-4 h-4" />
                    Find Nearby Properties
                  </button>
                </div>
              </div>

              {/* Hail Size Reference */}
              <div className="card">
                <h3 className="font-display font-semibold text-foreground mb-4">Hail Size Reference</h3>
                <div className="space-y-3">
                  {[
                    { size: '< 1"', equiv: 'Pea to Quarter', damage: 'Cosmetic' },
                    { size: '1" - 1.5"', equiv: 'Quarter to Golf Ball', damage: 'Minor' },
                    { size: '1.5" - 2"', equiv: 'Golf Ball to Lime', damage: 'Moderate' },
                    { size: '2" - 2.5"', equiv: 'Lime to Tennis Ball', damage: 'Major' },
                    { size: '> 2.5"', equiv: 'Larger than Tennis Ball', damage: 'Catastrophic' },
                  ].map((item, i) => (
                    <div 
                      key={i} 
                      className={`p-2 rounded text-xs ${
                        (storm.hail_size < 1 && i === 0) ||
                        (storm.hail_size >= 1 && storm.hail_size < 1.5 && i === 1) ||
                        (storm.hail_size >= 1.5 && storm.hail_size < 2 && i === 2) ||
                        (storm.hail_size >= 2 && storm.hail_size < 2.5 && i === 3) ||
                        (storm.hail_size >= 2.5 && i === 4)
                          ? 'bg-primary-muted ring-1 ring-primary'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold">{item.size}</span>
                        <span className="text-foreground-subtle">{item.damage}</span>
                      </div>
                      <div className="text-foreground-muted mt-0.5">{item.equiv}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AppLayout>
  )
}
