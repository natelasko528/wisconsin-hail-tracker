'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Map as MapIcon, List, BarChart3 } from 'lucide-react'

// Dynamically import canvassing components
const CanvassingMode = dynamic(
  () => import('@/components/mobile/CanvassingMode'),
  { ssr: false }
)

const StormMap = dynamic(
  () => import('@/components/storm/StormMap'),
  { ssr: false }
)

interface Property {
  id: string
  street_address: string
  city: string
  state: string
  zip_code: string
  latitude?: number
  longitude?: number
  owner_name?: string
  owner_phone?: string
  damage_probability?: number
  lead_status?: string
  canvass_status?: 'pending' | 'knocked' | 'not_home' | 'interested' | 'not_interested'
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/**
 * Mobile Canvassing Page
 * 
 * Optimized for field sales reps:
 * - GPS-based property discovery
 * - Large touch targets
 * - Quick status updates
 * - Offline support (future)
 */
export default function CanvassPage() {
  const [activeTab, setActiveTab] = useState<'map' | 'list' | 'stats'>('list')
  const [properties, setProperties] = useState<Property[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [todayStats, setTodayStats] = useState({
    total: 0,
    knocked: 0,
    interested: 0,
    notHome: 0,
    notInterested: 0
  })

  // Get user's GPS location
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
          setLocationError(null)
        },
        (error) => {
          console.error('Geolocation error:', error)
          setLocationError(error.message)
          // Default to Wisconsin center if no GPS
          setUserLocation({ lat: 43.0731, lng: -89.4012 })
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      )

      return () => navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  // Fetch nearby properties
  const fetchProperties = useCallback(async () => {
    if (!userLocation) return

    setIsLoading(true)
    try {
      // Fetch properties within ~2 miles of user
      const bounds = {
        north: userLocation.lat + 0.03,
        south: userLocation.lat - 0.03,
        east: userLocation.lng + 0.04,
        west: userLocation.lng - 0.04
      }

      const response = await fetch(
        `${API_URL}/api/properties?` +
        `north=${bounds.north}&south=${bounds.south}&east=${bounds.east}&west=${bounds.west}&limit=50`
      )
      const data = await response.json()

      if (data.success && data.data) {
        setProperties(data.data)
        updateStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching properties:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userLocation])

  // Fetch on location change
  useEffect(() => {
    if (userLocation) {
      fetchProperties()
    }
  }, [userLocation, fetchProperties])

  // Update local stats
  const updateStats = (props: Property[]) => {
    setTodayStats({
      total: props.length,
      knocked: props.filter(p => p.canvass_status === 'knocked').length,
      interested: props.filter(p => p.canvass_status === 'interested').length,
      notHome: props.filter(p => p.canvass_status === 'not_home').length,
      notInterested: props.filter(p => p.canvass_status === 'not_interested').length
    })
  }

  // Handle property status update
  const handlePropertyUpdate = async (id: string, status: Property['canvass_status']) => {
    try {
      // Update local state immediately for responsiveness
      setProperties(prev => prev.map(p => 
        p.id === id ? { ...p, canvass_status: status } : p
      ))

      // Sync with server
      await fetch(`${API_URL}/api/properties/${id}/canvass`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canvass_status: status })
      })

      // Update stats
      updateStats(properties.map(p => 
        p.id === id ? { ...p, canvass_status: status } : p
      ))
    } catch (error) {
      console.error('Error updating property:', error)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'map' && (
          <StormMap
            events={[]}
            properties={properties.filter(p => p.latitude != null && p.longitude != null) as any}
            showProperties={true}
            center={userLocation ? [userLocation.lat, userLocation.lng] : undefined}
            zoom={15}
            className="h-full w-full"
          />
        )}

        {activeTab === 'list' && (
          <CanvassingMode
            properties={properties}
            userLocation={userLocation}
            onPropertyUpdate={handlePropertyUpdate}
            onRefresh={fetchProperties}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'stats' && (
          <div className="h-full overflow-y-auto p-4">
            <h2 className="font-display text-xl font-bold mb-6">Today's Progress</h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="card p-4">
                <div className="text-foreground-muted text-sm mb-1">Total Nearby</div>
                <div className="font-mono text-3xl font-bold text-foreground">
                  {todayStats.total}
                </div>
              </div>
              <div className="card p-4">
                <div className="text-success text-sm mb-1">Knocked</div>
                <div className="font-mono text-3xl font-bold text-success">
                  {todayStats.knocked}
                </div>
              </div>
              <div className="card p-4">
                <div className="text-primary text-sm mb-1">Interested</div>
                <div className="font-mono text-3xl font-bold text-primary">
                  {todayStats.interested}
                </div>
              </div>
              <div className="card p-4">
                <div className="text-warning text-sm mb-1">Follow Up</div>
                <div className="font-mono text-3xl font-bold text-warning">
                  {todayStats.notHome}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="card p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground-muted">Completion Rate</span>
                <span className="font-mono text-sm font-medium">
                  {todayStats.total > 0 
                    ? Math.round(((todayStats.knocked + todayStats.interested + todayStats.notInterested) / todayStats.total) * 100)
                    : 0}%
                </span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill"
                  style={{ 
                    width: todayStats.total > 0 
                      ? `${((todayStats.knocked + todayStats.interested + todayStats.notInterested) / todayStats.total) * 100}%`
                      : '0%'
                  }}
                />
              </div>
            </div>

            {/* Location Status */}
            <div className="card p-4">
              <h3 className="font-semibold mb-2">GPS Status</h3>
              {userLocation ? (
                <div className="text-sm text-foreground-muted">
                  <p>📍 {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</p>
                </div>
              ) : (
                <p className="text-sm text-warning">
                  {locationError || 'Acquiring location...'}
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="flex-shrink-0 bg-background-secondary border-t border-border">
        <div className="flex items-center justify-around h-16">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex flex-col items-center gap-1 px-6 py-2 min-w-[80px] ${
              activeTab === 'map' ? 'text-primary' : 'text-foreground-muted'
            }`}
          >
            <MapIcon className="w-6 h-6" />
            <span className="text-xs font-medium">Map</span>
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex flex-col items-center gap-1 px-6 py-2 min-w-[80px] ${
              activeTab === 'list' ? 'text-primary' : 'text-foreground-muted'
            }`}
          >
            <List className="w-6 h-6" />
            <span className="text-xs font-medium">Nearby</span>
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex flex-col items-center gap-1 px-6 py-2 min-w-[80px] ${
              activeTab === 'stats' ? 'text-primary' : 'text-foreground-muted'
            }`}
          >
            <BarChart3 className="w-6 h-6" />
            <span className="text-xs font-medium">Stats</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
