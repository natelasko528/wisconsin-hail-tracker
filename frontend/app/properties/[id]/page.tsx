'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AppLayout from '@/components/AppLayout'
import { 
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Cloud,
  Home,
  User,
  ExternalLink,
  Search,
  MessageSquare,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  FileText,
  Edit,
  Trash2,
  Plus,
  Navigation,
  Building2
} from 'lucide-react'
import { format } from 'date-fns'

interface Property {
  id: string
  street_address: string
  city: string
  state: string
  zip_code: string
  county?: string
  full_address?: string
  latitude?: number
  longitude?: number
  property_type?: string
  year_built?: number
  square_footage?: number
  roof_type?: string
  roof_age_years?: number
  property_value?: number
  owner_name?: string
  owner_phone?: string
  owner_email?: string
  damage_probability?: number
  lead_status?: string
  data_source?: string
  created_at?: string
}

interface StormImpact {
  id: string
  storm_event_id: string
  hail_size: number
  distance_miles: number
  damage_probability: number
  event_date: string
  city?: string
  county?: string
}

interface SkipTraceResult {
  id: string
  phones?: { number: string; type: string }[]
  emails?: { email: string; type: string }[]
  confidence_score?: number
  searched_at: string
}

interface CommunicationLog {
  id: string
  type: string
  direction: string
  status: string
  notes?: string
  created_at: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function PropertyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.id as string

  const [property, setProperty] = useState<Property | null>(null)
  const [stormImpacts, setStormImpacts] = useState<StormImpact[]>([])
  const [skipTraceResults, setSkipTraceResults] = useState<SkipTraceResult[]>([])
  const [communications, setCommunications] = useState<CommunicationLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'storms' | 'activity' | 'skipTrace'>('overview')
  const [isSkipTracing, setIsSkipTracing] = useState(false)

  // Fetch property data
  const fetchProperty = useCallback(async () => {
    if (!propertyId) return
    setIsLoading(true)
    
    try {
      const response = await fetch(`${API_URL}/api/properties/${propertyId}`)
      const data = await response.json()
      
      if (data.success && data.data) {
        setProperty(data.data)
        if (data.data.storm_impacts) {
          setStormImpacts(data.data.storm_impacts)
        }
        if (data.data.skip_trace_results) {
          setSkipTraceResults(data.data.skip_trace_results)
        }
        if (data.data.communications) {
          setCommunications(data.data.communications)
        }
      }
    } catch (error) {
      console.error('Error fetching property:', error)
    } finally {
      setIsLoading(false)
    }
  }, [propertyId])

  useEffect(() => {
    fetchProperty()
  }, [fetchProperty])

  // Run skip trace
  const handleSkipTrace = async () => {
    if (!property) return
    setIsSkipTracing(true)
    
    try {
      const address = `${property.street_address}, ${property.city}, ${property.state} ${property.zip_code}`
      const response = await fetch(`${API_URL}/api/skiptrace/single`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          address,
          propertyId: property.id 
        })
      })
      
      const data = await response.json()
      if (data.success) {
        // Refresh property data to get new skip trace results
        fetchProperty()
      }
    } catch (error) {
      console.error('Error running skip trace:', error)
    } finally {
      setIsSkipTracing(false)
    }
  }

  // Add to campaign
  const handleAddToCampaign = async () => {
    if (!property) return
    
    try {
      const response = await fetch(`${API_URL}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: property.id,
          status: 'New',
          source: 'property_detail'
        })
      })
      
      const data = await response.json()
      if (data.success) {
        alert('Lead created successfully!')
        router.push(`/leads/${data.data.id}`)
      }
    } catch (error) {
      console.error('Error creating lead:', error)
    }
  }

  // Get damage probability color
  const getDamageProbColor = (prob: number) => {
    if (prob >= 0.8) return 'text-destructive'
    if (prob >= 0.5) return 'text-warning'
    return 'text-success'
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-foreground-muted">Loading property...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!property) {
    return (
      <AppLayout>
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <Home className="w-12 h-12 text-foreground-subtle mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Property Not Found</h2>
            <p className="text-foreground-muted mb-4">The property you're looking for doesn't exist.</p>
            <Link href="/" className="btn btn-primary">
              Back to Map
            </Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  const latestSkipTrace = skipTraceResults[0]

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
              <div>
                <h1 className="font-display text-lg font-bold text-foreground">
                  {property.street_address}
                </h1>
                <p className="text-sm text-foreground-muted">
                  {property.city}, {property.state} {property.zip_code}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {property.latitude && property.longitude && (
                <a
                  href={`https://www.google.com/maps?q=${property.latitude},${property.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm"
                >
                  <Navigation className="w-4 h-4" />
                  Directions
                </a>
              )}
              <button onClick={handleAddToCampaign} className="btn btn-primary btn-sm">
                <Plus className="w-4 h-4" />
                Create Lead
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-4 flex gap-1">
            {(['overview', 'storms', 'activity', 'skipTrace'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  px-4 py-2 text-sm font-medium rounded-t-lg transition-colors
                  ${activeTab === tab
                    ? 'bg-background text-foreground border-t border-x border-border'
                    : 'text-foreground-muted hover:text-foreground'
                  }
                `}
              >
                {tab === 'skipTrace' ? 'Skip Trace' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Property Details Card */}
                  <div className="card p-6">
                    <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      Property Details
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {property.property_type && (
                        <div>
                          <div className="text-xs text-foreground-subtle uppercase">Type</div>
                          <div className="font-medium">{property.property_type}</div>
                        </div>
                      )}
                      {property.year_built && (
                        <div>
                          <div className="text-xs text-foreground-subtle uppercase">Year Built</div>
                          <div className="font-medium">{property.year_built}</div>
                        </div>
                      )}
                      {property.square_footage && (
                        <div>
                          <div className="text-xs text-foreground-subtle uppercase">Sq Footage</div>
                          <div className="font-medium">{property.square_footage.toLocaleString()} sqft</div>
                        </div>
                      )}
                      {property.roof_type && (
                        <div>
                          <div className="text-xs text-foreground-subtle uppercase">Roof Type</div>
                          <div className="font-medium">{property.roof_type}</div>
                        </div>
                      )}
                      {property.roof_age_years && (
                        <div>
                          <div className="text-xs text-foreground-subtle uppercase">Roof Age</div>
                          <div className="font-medium">{property.roof_age_years} years</div>
                        </div>
                      )}
                      {property.property_value && (
                        <div>
                          <div className="text-xs text-foreground-subtle uppercase">Est. Value</div>
                          <div className="font-medium">${property.property_value.toLocaleString()}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Street View Embed (placeholder) */}
                  <div className="card overflow-hidden">
                    <div className="h-64 bg-muted flex items-center justify-center">
                      {property.latitude && property.longitude ? (
                        <iframe
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          loading="lazy"
                          allowFullScreen
                          src={`https://www.google.com/maps/embed/v1/streetview?key=YOUR_API_KEY&location=${property.latitude},${property.longitude}&heading=0&pitch=0`}
                        />
                      ) : (
                        <div className="text-center text-foreground-muted">
                          <MapPin className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm">Street View not available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Owner Contact */}
                  {(property.owner_name || property.owner_phone || property.owner_email || latestSkipTrace) && (
                    <div className="card p-6">
                      <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-accent" />
                        Owner Information
                      </h3>
                      
                      {property.owner_name && (
                        <div className="mb-4">
                          <div className="text-sm text-foreground-muted">Owner Name</div>
                          <div className="font-semibold text-lg">{property.owner_name}</div>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-3">
                        {(property.owner_phone || latestSkipTrace?.phones?.[0]) && (
                          <a
                            href={`tel:${property.owner_phone || latestSkipTrace?.phones?.[0]?.number}`}
                            className="btn btn-primary"
                          >
                            <Phone className="w-4 h-4" />
                            {property.owner_phone || latestSkipTrace?.phones?.[0]?.number}
                          </a>
                        )}
                        {(property.owner_email || latestSkipTrace?.emails?.[0]) && (
                          <a
                            href={`mailto:${property.owner_email || latestSkipTrace?.emails?.[0]?.email}`}
                            className="btn btn-outline"
                          >
                            <Mail className="w-4 h-4" />
                            Email
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Damage Probability */}
                  {property.damage_probability !== undefined && (
                    <div className="card p-6">
                      <h4 className="text-xs text-foreground-subtle uppercase mb-2">Damage Probability</h4>
                      <div className={`font-mono text-4xl font-bold ${getDamageProbColor(property.damage_probability)}`}>
                        {Math.round(property.damage_probability * 100)}%
                      </div>
                      <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            property.damage_probability >= 0.8 ? 'bg-destructive' :
                            property.damage_probability >= 0.5 ? 'bg-warning' : 'bg-success'
                          }`}
                          style={{ width: `${property.damage_probability * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="card p-6">
                    <h4 className="font-display font-semibold text-foreground mb-4">Quick Actions</h4>
                    <div className="space-y-2">
                      <button 
                        onClick={handleSkipTrace}
                        disabled={isSkipTracing}
                        className="w-full btn btn-primary justify-start"
                      >
                        <Search className="w-4 h-4" />
                        {isSkipTracing ? 'Running...' : 'Run Skip Trace'}
                      </button>
                      <button onClick={handleAddToCampaign} className="w-full btn btn-outline justify-start">
                        <TrendingUp className="w-4 h-4" />
                        Create Lead
                      </button>
                      {property.latitude && property.longitude && (
                        <Link 
                          href={`/?lat=${property.latitude}&lng=${property.longitude}&zoom=16`}
                          className="w-full btn btn-outline justify-start"
                        >
                          <MapPin className="w-4 h-4" />
                          View on Map
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Storm History Summary */}
                  {stormImpacts.length > 0 && (
                    <div className="card p-6">
                      <h4 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Cloud className="w-5 h-5 text-warning" />
                        Storm History
                      </h4>
                      <div className="space-y-3">
                        {stormImpacts.slice(0, 3).map(impact => (
                          <div key={impact.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                            <div>
                              <div className="font-mono font-bold">{impact.hail_size}"</div>
                              <div className="text-xs text-foreground-muted">
                                {format(new Date(impact.event_date), 'MMM d, yyyy')}
                              </div>
                            </div>
                            <span className={`badge ${
                              impact.hail_size >= 2.0 ? 'badge-hail-severe' :
                              impact.hail_size >= 1.5 ? 'badge-hail-significant' : 'badge-hail-moderate'
                            }`}>
                              {impact.distance_miles.toFixed(1)}mi
                            </span>
                          </div>
                        ))}
                        {stormImpacts.length > 3 && (
                          <button 
                            onClick={() => setActiveTab('storms')}
                            className="text-sm text-primary hover:underline"
                          >
                            View all {stormImpacts.length} storms →
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Storms Tab */}
            {activeTab === 'storms' && (
              <div className="space-y-4">
                <h3 className="font-display text-lg font-semibold">Storm Impact History</h3>
                {stormImpacts.length === 0 ? (
                  <div className="card p-8 text-center">
                    <Cloud className="w-12 h-12 text-foreground-subtle mx-auto mb-4" />
                    <p className="text-foreground-muted">No storm impacts recorded for this property</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {stormImpacts.map(impact => (
                      <div key={impact.id} className="card p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-warning-muted flex items-center justify-center">
                              <Cloud className="w-6 h-6 text-warning" />
                            </div>
                            <div>
                              <div className="font-mono text-2xl font-bold">{impact.hail_size}" Hail</div>
                              <div className="text-sm text-foreground-muted">
                                {impact.city}, {impact.county} County
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {format(new Date(impact.event_date), 'MMMM d, yyyy')}
                            </div>
                            <div className="text-sm text-foreground-muted">
                              {impact.distance_miles.toFixed(2)} miles away
                            </div>
                            <div className={`text-sm font-medium ${getDamageProbColor(impact.damage_probability)}`}>
                              {Math.round(impact.damage_probability * 100)}% damage probability
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-4">
                <h3 className="font-display text-lg font-semibold">Communication History</h3>
                {communications.length === 0 ? (
                  <div className="card p-8 text-center">
                    <MessageSquare className="w-12 h-12 text-foreground-subtle mx-auto mb-4" />
                    <p className="text-foreground-muted">No communication history yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {communications.map(comm => (
                      <div key={comm.id} className="card p-4 flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          comm.type === 'call' ? 'bg-primary-muted text-primary' :
                          comm.type === 'email' ? 'bg-accent-muted text-accent' :
                          'bg-muted text-foreground-muted'
                        }`}>
                          {comm.type === 'call' ? <Phone className="w-5 h-5" /> :
                           comm.type === 'email' ? <Mail className="w-5 h-5" /> :
                           <MessageSquare className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">{comm.type}</span>
                            <span className="text-xs text-foreground-muted">{comm.direction}</span>
                            <span className={`badge text-xs ${
                              comm.status === 'completed' ? 'badge-success' : 'badge-secondary'
                            }`}>
                              {comm.status}
                            </span>
                          </div>
                          {comm.notes && (
                            <p className="text-sm text-foreground-muted mt-1">{comm.notes}</p>
                          )}
                          <div className="text-xs text-foreground-subtle mt-2">
                            {format(new Date(comm.created_at), 'MMM d, yyyy h:mm a')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Skip Trace Tab */}
            {activeTab === 'skipTrace' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold">Skip Trace Results</h3>
                  <button 
                    onClick={handleSkipTrace}
                    disabled={isSkipTracing}
                    className="btn btn-primary"
                  >
                    <Search className="w-4 h-4" />
                    {isSkipTracing ? 'Running...' : 'Run New Skip Trace'}
                  </button>
                </div>

                {skipTraceResults.length === 0 ? (
                  <div className="card p-8 text-center">
                    <Search className="w-12 h-12 text-foreground-subtle mx-auto mb-4" />
                    <p className="text-foreground-muted mb-4">No skip trace results yet</p>
                    <button 
                      onClick={handleSkipTrace}
                      disabled={isSkipTracing}
                      className="btn btn-primary"
                    >
                      Run Skip Trace
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {skipTraceResults.map((result, index) => (
                      <div key={result.id} className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            {index === 0 && (
                              <span className="badge badge-primary">Latest</span>
                            )}
                            <span className="text-sm text-foreground-muted">
                              {format(new Date(result.searched_at), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                          {result.confidence_score && (
                            <span className={`text-sm font-medium ${
                              result.confidence_score >= 0.8 ? 'text-success' :
                              result.confidence_score >= 0.5 ? 'text-warning' : 'text-foreground-muted'
                            }`}>
                              {Math.round(result.confidence_score * 100)}% confidence
                            </span>
                          )}
                        </div>

                        {result.phones && result.phones.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-foreground mb-2">Phone Numbers</h4>
                            <div className="space-y-2">
                              {result.phones.map((phone, i) => (
                                <a 
                                  key={i}
                                  href={`tel:${phone.number}`}
                                  className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-secondary transition-colors"
                                >
                                  <Phone className="w-4 h-4 text-primary" />
                                  <span className="font-mono">{phone.number}</span>
                                  <span className="text-xs text-foreground-muted capitalize">{phone.type}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {result.emails && result.emails.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-foreground mb-2">Email Addresses</h4>
                            <div className="space-y-2">
                              {result.emails.map((email, i) => (
                                <a 
                                  key={i}
                                  href={`mailto:${email.email}`}
                                  className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-secondary transition-colors"
                                >
                                  <Mail className="w-4 h-4 text-accent" />
                                  <span>{email.email}</span>
                                  <span className="text-xs text-foreground-muted capitalize">{email.type}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </AppLayout>
  )
}
