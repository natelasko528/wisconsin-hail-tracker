'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Navigation,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  ChevronRight,
  Home,
  Compass,
  RefreshCw,
  Filter,
  List,
  Map as MapIcon
} from 'lucide-react'

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
  distance?: number
  canvass_status?: 'pending' | 'knocked' | 'not_home' | 'interested' | 'not_interested'
}

interface CanvassingModeProps {
  properties: Property[]
  userLocation: { lat: number; lng: number } | null
  onPropertyUpdate: (id: string, status: Property['canvass_status']) => void
  onRefresh: () => void
  isLoading?: boolean
}

/**
 * Mobile-optimized Canvassing Mode Component
 * 
 * Features:
 * - GPS-based nearby property list
 * - Large touch-friendly buttons
 * - Quick status updates
 * - One-tap call/directions
 * - Offline-ready design
 */
export default function CanvassingMode({
  properties,
  userLocation,
  onPropertyUpdate,
  onRefresh,
  isLoading = false
}: CanvassingModeProps) {
  const [expandedProperty, setExpandedProperty] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<Property['canvass_status'] | 'all'>('all')
  const [sortBy, setSortBy] = useState<'distance' | 'damage'>('distance')

  // Calculate distance from user location
  const calculateDistance = useCallback((lat?: number, lng?: number): number => {
    if (!userLocation || !lat || !lng) return Infinity
    
    const R = 3959 // Earth's radius in miles
    const dLat = (lat - userLocation.lat) * Math.PI / 180
    const dLon = (lng - userLocation.lng) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }, [userLocation])

  // Sort and filter properties
  const sortedProperties = properties
    .map(p => ({ ...p, distance: calculateDistance(p.latitude, p.longitude) }))
    .filter(p => filterStatus === 'all' || p.canvass_status === filterStatus)
    .sort((a, b) => {
      if (sortBy === 'distance') return a.distance - b.distance
      return (b.damage_probability || 0) - (a.damage_probability || 0)
    })
    .slice(0, 20) // Limit to nearest 20

  // Get status badge styling
  const getStatusBadge = (status?: Property['canvass_status']) => {
    switch (status) {
      case 'knocked':
        return { icon: CheckCircle, class: 'bg-success-muted text-success', label: 'Knocked' }
      case 'not_home':
        return { icon: Clock, class: 'bg-warning-muted text-warning', label: 'Not Home' }
      case 'interested':
        return { icon: CheckCircle, class: 'bg-primary-muted text-primary', label: 'Interested!' }
      case 'not_interested':
        return { icon: XCircle, class: 'bg-destructive-muted text-destructive', label: 'Not Interested' }
      default:
        return { icon: MapPin, class: 'bg-muted text-foreground-muted', label: 'Pending' }
    }
  }

  // Quick action buttons
  const handleCall = (phone?: string) => {
    if (phone) {
      window.location.href = `tel:${phone}`
    }
  }

  const handleDirections = (lat?: number, lng?: number) => {
    if (lat && lng) {
      window.open(`https://maps.google.com/maps?daddr=${lat},${lng}`, '_blank')
    }
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header with GPS status */}
      <header className="flex-shrink-0 p-4 bg-background-secondary border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Compass className={`w-5 h-5 ${userLocation ? 'text-success' : 'text-foreground-subtle'}`} />
            <span className="text-sm font-medium">
              {userLocation ? 'GPS Active' : 'Locating...'}
            </span>
          </div>
          <button 
            onClick={onRefresh}
            disabled={isLoading}
            className="btn btn-ghost btn-sm btn-icon"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filter/Sort buttons */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          <button
            onClick={() => setSortBy('distance')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              sortBy === 'distance' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground-muted'
            }`}
          >
            Nearest First
          </button>
          <button
            onClick={() => setSortBy('damage')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              sortBy === 'damage' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground-muted'
            }`}
          >
            Highest Damage
          </button>
          <div className="h-4 w-px bg-border mx-1" />
          {(['all', 'pending', 'not_home'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filterStatus === status ? 'bg-secondary text-foreground' : 'bg-muted text-foreground-muted'
              }`}
            >
              {status === 'all' ? 'All' : status === 'pending' ? 'New' : 'Follow Up'}
            </button>
          ))}
        </div>
      </header>

      {/* Property List */}
      <main className="flex-1 overflow-y-auto">
        {sortedProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <Home className="w-12 h-12 text-foreground-subtle mb-4" />
            <h3 className="font-semibold mb-2">No Properties Nearby</h3>
            <p className="text-sm text-foreground-muted mb-4">
              {userLocation 
                ? 'No properties found in your area. Try adjusting filters.'
                : 'Enable location services to see nearby properties.'}
            </p>
            <button onClick={onRefresh} className="btn btn-primary">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border-muted">
            {sortedProperties.map((property) => {
              const status = getStatusBadge(property.canvass_status)
              const isExpanded = expandedProperty === property.id
              const StatusIcon = status.icon

              return (
                <div key={property.id} className="bg-background">
                  {/* Property Card */}
                  <button
                    onClick={() => setExpandedProperty(isExpanded ? null : property.id)}
                    className="w-full p-4 text-left focus:outline-none active:bg-muted transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Distance indicator */}
                      <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-muted flex flex-col items-center justify-center">
                        <span className="font-mono text-lg font-bold text-foreground">
                          {property.distance < 1 
                            ? Math.round(property.distance * 5280) 
                            : property.distance.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-foreground-muted uppercase">
                          {property.distance < 1 ? 'ft' : 'mi'}
                        </span>
                      </div>

                      {/* Property info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.class}`}>
                            {status.label}
                          </span>
                          {property.damage_probability && property.damage_probability > 0.7 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-destructive-muted text-destructive">
                              High Risk
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-foreground truncate">
                          {property.street_address}
                        </h3>
                        <p className="text-sm text-foreground-muted">
                          {property.city}, {property.state} {property.zip_code}
                        </p>
                        {property.owner_name && (
                          <p className="text-sm text-foreground-subtle mt-1">
                            {property.owner_name}
                          </p>
                        )}
                      </div>

                      <ChevronRight 
                        className={`w-5 h-5 text-foreground-subtle transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`} 
                      />
                    </div>
                  </button>

                  {/* Expanded Actions */}
                  {isExpanded && (
                    <div className="px-4 pb-4 animate-fade-in-down">
                      {/* Quick Actions Row */}
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <button
                          onClick={() => handleCall(property.owner_phone)}
                          disabled={!property.owner_phone}
                          className="btn btn-primary h-14 text-base"
                        >
                          <Phone className="w-5 h-5" />
                          Call
                        </button>
                        <button
                          onClick={() => handleDirections(property.latitude, property.longitude)}
                          disabled={!property.latitude || !property.longitude}
                          className="btn btn-outline h-14 text-base"
                        >
                          <Navigation className="w-5 h-5" />
                          Directions
                        </button>
                      </div>

                      {/* Status Update Buttons */}
                      <p className="text-xs text-foreground-subtle uppercase tracking-wider mb-2">
                        Update Status
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => onPropertyUpdate(property.id, 'knocked')}
                          className="btn btn-sm bg-success-muted text-success hover:bg-success/20"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Knocked
                        </button>
                        <button
                          onClick={() => onPropertyUpdate(property.id, 'not_home')}
                          className="btn btn-sm bg-warning-muted text-warning hover:bg-warning/20"
                        >
                          <Clock className="w-4 h-4" />
                          Not Home
                        </button>
                        <button
                          onClick={() => onPropertyUpdate(property.id, 'interested')}
                          className="btn btn-sm bg-primary-muted text-primary hover:bg-primary/20"
                        >
                          Interested!
                        </button>
                        <button
                          onClick={() => onPropertyUpdate(property.id, 'not_interested')}
                          className="btn btn-sm bg-destructive-muted text-destructive hover:bg-destructive/20"
                        >
                          Not Interested
                        </button>
                      </div>

                      {/* View Details Link */}
                      <Link
                        href={`/properties/${property.id}`}
                        className="block mt-4 text-center text-sm text-primary hover:underline"
                      >
                        View Full Details →
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Bottom Stats Bar */}
      <footer className="flex-shrink-0 p-3 bg-background-secondary border-t border-border">
        <div className="flex items-center justify-around text-center">
          <div>
            <div className="font-mono text-lg font-bold text-foreground">
              {sortedProperties.length}
            </div>
            <div className="text-[10px] text-foreground-muted uppercase">Nearby</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <div className="font-mono text-lg font-bold text-success">
              {sortedProperties.filter(p => p.canvass_status === 'knocked').length}
            </div>
            <div className="text-[10px] text-foreground-muted uppercase">Knocked</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <div className="font-mono text-lg font-bold text-primary">
              {sortedProperties.filter(p => p.canvass_status === 'interested').length}
            </div>
            <div className="text-[10px] text-foreground-muted uppercase">Interested</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <div className="font-mono text-lg font-bold text-warning">
              {sortedProperties.filter(p => p.canvass_status === 'not_home').length}
            </div>
            <div className="text-[10px] text-foreground-muted uppercase">Follow Up</div>
          </div>
        </div>
      </footer>
    </div>
  )
}

/**
 * Mobile Bottom Navigation for Canvassing
 */
export function CanvassingBottomNav({
  activeTab,
  onTabChange
}: {
  activeTab: 'map' | 'list' | 'stats'
  onTabChange: (tab: 'map' | 'list' | 'stats') => void
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background-secondary border-t border-border safe-area-pb">
      <div className="flex items-center justify-around h-16">
        <button
          onClick={() => onTabChange('map')}
          className={`flex flex-col items-center gap-1 px-6 py-2 ${
            activeTab === 'map' ? 'text-primary' : 'text-foreground-muted'
          }`}
        >
          <MapIcon className="w-6 h-6" />
          <span className="text-xs font-medium">Map</span>
        </button>
        <button
          onClick={() => onTabChange('list')}
          className={`flex flex-col items-center gap-1 px-6 py-2 ${
            activeTab === 'list' ? 'text-primary' : 'text-foreground-muted'
          }`}
        >
          <List className="w-6 h-6" />
          <span className="text-xs font-medium">Nearby</span>
        </button>
        <button
          onClick={() => onTabChange('stats')}
          className={`flex flex-col items-center gap-1 px-6 py-2 ${
            activeTab === 'stats' ? 'text-primary' : 'text-foreground-muted'
          }`}
        >
          <Navigation className="w-6 h-6" />
          <span className="text-xs font-medium">Route</span>
        </button>
      </div>
    </nav>
  )
}
