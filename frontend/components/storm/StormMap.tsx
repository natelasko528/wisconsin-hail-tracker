'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { ZoomIn, ZoomOut, Crosshair, Maximize2, Minimize2, Layers } from 'lucide-react'

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
  begin_lat?: number
  begin_lon?: number
  end_lat?: number
  end_lon?: number
}

interface Property {
  id: string
  street_address: string
  city: string
  state: string
  zip_code: string
  latitude: number
  longitude: number
  damage_probability?: number
  owner_name?: string
  lead_status?: string
}

interface StormMapProps {
  events: StormEvent[]
  properties?: Property[]
  selectedEvent?: StormEvent | null
  onEventSelect?: (event: StormEvent) => void
  onPropertySelect?: (property: Property) => void
  center?: [number, number]
  zoom?: number
  className?: string
  showPaths?: boolean
  showProperties?: boolean
  showHeatMap?: boolean
  onFullscreenChange?: (isFullscreen: boolean) => void
}

// Get color based on hail severity
const getSeverityColor = (size: number): string => {
  if (size >= 2.5) return '#991b1b' // extreme - maroon
  if (size >= 2.0) return '#dc2626' // severe - dark red
  if (size >= 1.5) return '#ef4444' // significant - red
  if (size >= 1.0) return '#f97316' // moderate - orange
  return '#fbbf24' // minor - yellow
}

const getSeverityLabel = (size: number): string => {
  if (size >= 2.5) return 'Extreme'
  if (size >= 2.0) return 'Severe'
  if (size >= 1.5) return 'Significant'
  if (size >= 1.0) return 'Moderate'
  return 'Minor'
}

// Property status colors
const getPropertyStatusColor = (status?: string): string => {
  switch (status?.toLowerCase()) {
    case 'contacted': return '#a855f7' // purple
    case 'qualified': return '#3b82f6' // blue
    case 'proposal': return '#f59e0b' // amber
    case 'converted':
    case 'closed_won': return '#10b981' // green
    case 'lost':
    case 'closed_lost': return '#6b7280' // gray
    default: return '#06b6d4' // cyan - new
  }
}

// Tile layer configurations
const TILE_LAYERS = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    subdomains: undefined as string | undefined,
    maxZoom: 19
  },
  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: undefined as string | undefined,
    maxZoom: 19
  }
}

// Wisconsin center
const WISCONSIN_CENTER: [number, number] = [44.5, -89.5]
const DEFAULT_ZOOM = 7

// Loading skeleton
function MapSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center bg-slate-900 ${className}`} style={{ minHeight: '400px' }}>
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-400">Loading map...</p>
      </div>
    </div>
  )
}

export default function StormMap({ 
  events, 
  properties = [],
  selectedEvent, 
  onEventSelect,
  onPropertySelect,
  center = WISCONSIN_CENTER,
  zoom = DEFAULT_ZOOM,
  className = '',
  showPaths = true,
  showProperties = false,
  showHeatMap = false,
  onFullscreenChange
}: StormMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [mapLayer, setMapLayer] = useState<'dark' | 'satellite' | 'streets'>('dark')
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapWrapperRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const pathsRef = useRef<any[]>([])
  const propertyMarkersRef = useRef<any[]>([])
  const tileLayerRef = useRef<any>(null)
  const LeafletRef = useRef<any>(null)

  // Initialize on client side only
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Fullscreen toggle handler
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => {
      const newValue = !prev
      onFullscreenChange?.(newValue)
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize()
      }, 300)
      return newValue
    })
  }, [onFullscreenChange])

  // Escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen()
      }
      if (e.key === 'f' || e.key === 'F') {
        if (!document.activeElement || document.activeElement.tagName !== 'INPUT') {
          toggleFullscreen()
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen, toggleFullscreen])

  // Load Leaflet dynamically
  useEffect(() => {
    if (!isClient) return

    const loadLeaflet = async () => {
      try {
        // Import Leaflet CSS
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
          link.crossOrigin = ''
          document.head.appendChild(link)
        }
        
        const L = await import('leaflet')
        LeafletRef.current = L.default || L
        
        // Fix default marker icons
        delete (LeafletRef.current.Icon.Default.prototype as any)._getIconUrl
        LeafletRef.current.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })
        
        setLeafletLoaded(true)
      } catch (error) {
        console.error('Failed to load Leaflet:', error)
      }
    }

    loadLeaflet()
  }, [isClient])

  // Initialize map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current) return
    if (mapInstanceRef.current) return

    const L = LeafletRef.current
    if (!L) return

    const container = mapContainerRef.current
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      const timer = setTimeout(() => {
        setLeafletLoaded(false)
        setTimeout(() => setLeafletLoaded(true), 100)
      }, 100)
      return () => clearTimeout(timer)
    }

    try {
      const map = L.map(container, {
        center: center,
        zoom: zoom,
        zoomControl: false,
        scrollWheelZoom: true,
        preferCanvas: true
      })

      const tileConfig = TILE_LAYERS[mapLayer]
      tileLayerRef.current = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        subdomains: tileConfig.subdomains || 'abc',
        maxZoom: tileConfig.maxZoom || 19
      }).addTo(map)

      mapInstanceRef.current = map

      setTimeout(() => {
        map.invalidateSize()
        setMapReady(true)
      }, 100)

      const resizeObserver = new ResizeObserver(() => {
        map.invalidateSize()
      })
      resizeObserver.observe(container)

      return () => {
        resizeObserver.disconnect()
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
          tileLayerRef.current = null
        }
      }
    } catch (error) {
      console.error('Error initializing map:', error)
    }
  }, [leafletLoaded, center, zoom, mapLayer])

  // Update tile layer
  useEffect(() => {
    if (!mapInstanceRef.current || !LeafletRef.current || !mapReady) return

    const L = LeafletRef.current
    const map = mapInstanceRef.current

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current)
    }

    const tileConfig = TILE_LAYERS[mapLayer]
    tileLayerRef.current = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      subdomains: tileConfig.subdomains || 'abc',
      maxZoom: tileConfig.maxZoom || 19
    }).addTo(map)
  }, [mapLayer, mapReady])

  // Update storm paths
  useEffect(() => {
    if (!mapInstanceRef.current || !LeafletRef.current || !mapReady) return

    const L = LeafletRef.current
    const map = mapInstanceRef.current

    // Clear existing paths
    pathsRef.current.forEach(path => {
      try { map.removeLayer(path) } catch (e) {}
    })
    pathsRef.current = []

    if (!showPaths) return

    // Draw storm paths
    events.forEach(event => {
      const beginLat = event.begin_lat || event.latitude
      const beginLon = event.begin_lon || event.longitude
      const endLat = event.end_lat || event.latitude
      const endLon = event.end_lon || event.longitude
      
      // Only draw path if there's movement
      if (beginLat !== endLat || beginLon !== endLon) {
        const color = getSeverityColor(event.hail_size)
        const weight = Math.max(3, Math.min(12, event.hail_size * 4))
        
        // Create polyline with arrow
        const path = L.polyline(
          [[beginLat, beginLon], [endLat, endLon]],
          {
            color: color,
            weight: weight,
            opacity: 0.7,
            lineCap: 'round',
            lineJoin: 'round'
          }
        )
        
        path.addTo(map)
        pathsRef.current.push(path)
        
        // Add subtle buffer/swath effect
        const buffer = L.polyline(
          [[beginLat, beginLon], [endLat, endLon]],
          {
            color: color,
            weight: weight * 2,
            opacity: 0.15,
            lineCap: 'round',
            lineJoin: 'round'
          }
        )
        buffer.addTo(map)
        pathsRef.current.push(buffer)
      }
    })
  }, [events, showPaths, mapReady])

  // Update storm markers
  useEffect(() => {
    if (!mapInstanceRef.current || !LeafletRef.current || !mapReady) return

    const L = LeafletRef.current
    const map = mapInstanceRef.current

    // Clear existing markers
    markersRef.current.forEach(marker => {
      try { marker.remove() } catch (e) {}
    })
    markersRef.current = []

    // Filter valid events
    const validEvents = events.filter(
      e => e.latitude && e.longitude && 
      !isNaN(e.latitude) && !isNaN(e.longitude) &&
      Math.abs(e.latitude) > 0.01 && Math.abs(e.longitude) > 0.01
    )

    // Add markers for each event
    validEvents.forEach(event => {
      const isSelected = selectedEvent?.id === event.id
      const color = getSeverityColor(event.hail_size)
      const radius = Math.max(6, Math.min(16, event.hail_size * 5))

      const marker = L.circleMarker([event.latitude, event.longitude], {
        radius,
        fillColor: color,
        color: isSelected ? '#ffffff' : color,
        weight: isSelected ? 3 : 2,
        opacity: 1,
        fillOpacity: isSelected ? 0.95 : 0.75
      })

      // Popup content
      const popupContent = `
        <div style="min-width: 200px; font-family: system-ui, sans-serif; color: #1e293b; padding: 4px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${color};"></div>
            <strong style="font-size: 15px;">${event.hail_size}" Hail</strong>
            <span style="font-size: 11px; padding: 2px 8px; border-radius: 9999px; background: ${color}22; color: ${color}; font-weight: 600;">
              ${getSeverityLabel(event.hail_size)}
            </span>
          </div>
          <div style="font-size: 13px; color: #475569; margin-bottom: 8px;">
            <div style="margin-bottom: 4px;">📍 ${event.city || 'Unknown'}, ${event.county || ''} County</div>
            <div style="color: #64748b; font-size: 12px;">
              📅 ${new Date(event.event_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </div>
          ${event.damage_property && event.damage_property !== '0' ? `
            <div style="margin-top: 8px; padding: 8px; background: #fef2f2; border-radius: 6px; font-size: 12px; color: #dc2626;">
              ⚠️ Property Damage Reported
            </div>
          ` : ''}
          <div style="margin-top: 12px; display: flex; gap: 6px;">
            <a href="/storms/${event.id}" style="flex: 1; text-align: center; padding: 8px 12px; background: #06b6d4; color: white; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 500;">
              View Details
            </a>
            <a href="/skip-trace?lat=${event.latitude}&lng=${event.longitude}&address=${encodeURIComponent(`${event.city || ''}, ${event.county} County, WI`)}" style="flex: 1; text-align: center; padding: 8px 12px; background: #1e293b; color: white; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 500;">
              Skip Trace
            </a>
          </div>
        </div>
      `

      marker.bindPopup(popupContent, { maxWidth: 300 })

      marker.on('click', () => {
        onEventSelect?.(event)
      })

      marker.addTo(map)
      markersRef.current.push(marker)
    })
  }, [events, selectedEvent, onEventSelect, mapReady])

  // Update property markers
  useEffect(() => {
    if (!mapInstanceRef.current || !LeafletRef.current || !mapReady) return

    const L = LeafletRef.current
    const map = mapInstanceRef.current

    // Clear existing property markers
    propertyMarkersRef.current.forEach(marker => {
      try { map.removeLayer(marker) } catch (e) {}
    })
    propertyMarkersRef.current = []

    if (!showProperties || properties.length === 0) return

    // Add property markers
    properties.forEach(property => {
      if (!property.latitude || !property.longitude) return
      
      const color = getPropertyStatusColor(property.lead_status)
      
      const marker = L.circleMarker([property.latitude, property.longitude], {
        radius: 8,
        fillColor: color,
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.85
      })

      // Property popup
      const popupContent = `
        <div style="min-width: 220px; font-family: system-ui, sans-serif; color: #1e293b; padding: 4px;">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 8px;">
            ${property.street_address}
          </div>
          <div style="font-size: 13px; color: #475569; margin-bottom: 8px;">
            ${property.city}, ${property.state} ${property.zip_code}
          </div>
          ${property.owner_name ? `
            <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">
              👤 ${property.owner_name}
            </div>
          ` : ''}
          ${property.damage_probability ? `
            <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">
              📊 Damage Probability: ${Math.round(property.damage_probability * 100)}%
            </div>
          ` : ''}
          <div style="margin-top: 12px; display: flex; gap: 6px;">
            <a href="/properties/${property.id}" style="flex: 1; text-align: center; padding: 8px 12px; background: #06b6d4; color: white; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 500;">
              View Property
            </a>
            <a href="/skip-trace?address=${encodeURIComponent(`${property.street_address}, ${property.city}, ${property.state} ${property.zip_code}`)}" style="flex: 1; text-align: center; padding: 8px 12px; background: #10b981; color: white; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 500;">
              Skip Trace
            </a>
          </div>
        </div>
      `

      marker.bindPopup(popupContent, { maxWidth: 280 })

      marker.on('click', () => {
        onPropertySelect?.(property)
      })

      marker.addTo(map)
      propertyMarkersRef.current.push(marker)
    })
  }, [properties, showProperties, onPropertySelect, mapReady])

  // Map control handlers
  const handleZoomIn = useCallback(() => {
    mapInstanceRef.current?.zoomIn()
  }, [])

  const handleZoomOut = useCallback(() => {
    mapInstanceRef.current?.zoomOut()
  }, [])

  const handleResetView = useCallback(() => {
    mapInstanceRef.current?.setView(WISCONSIN_CENTER, DEFAULT_ZOOM)
  }, [])

  // Show loading state
  if (!isClient || !leafletLoaded) {
    return <MapSkeleton className={className} />
  }

  return (
    <div 
      ref={mapWrapperRef}
      className={`
        relative ${className}
        ${isFullscreen ? 'fixed inset-0 z-[9999] bg-slate-900' : ''}
        transition-all duration-300
      `} 
      style={{ minHeight: isFullscreen ? '100vh' : '400px' }}
    >
      {/* Map Layer Toggle */}
      <div className="absolute top-4 left-4 z-[1000]">
        <div className="bg-slate-800/95 backdrop-blur border border-slate-700 rounded-lg p-1 shadow-lg flex gap-1">
          {(['dark', 'satellite', 'streets'] as const).map((layer) => (
            <button
              key={layer}
              onClick={() => setMapLayer(layer)}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-md transition-all
                ${mapLayer === layer 
                  ? 'bg-cyan-600 text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }
              `}
            >
              {layer.charAt(0).toUpperCase() + layer.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={toggleFullscreen}
          className="w-8 h-8 bg-slate-800/95 backdrop-blur border border-slate-700 rounded-lg shadow-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen (F)'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 bg-slate-800/95 backdrop-blur border border-slate-700 rounded-lg shadow-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 bg-slate-800/95 backdrop-blur border border-slate-700 rounded-lg shadow-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetView}
          className="w-8 h-8 bg-slate-800/95 backdrop-blur border border-slate-700 rounded-lg shadow-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          title="Reset View"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-800/95 backdrop-blur border border-slate-700 rounded-lg p-3 shadow-lg">
        <div className="text-xs font-semibold text-white mb-2">Hail Size</div>
        <div className="space-y-1">
          {[
            { label: '< 1" (Minor)', color: '#fbbf24' },
            { label: '1"-1.5" (Moderate)', color: '#f97316' },
            { label: '1.5"-2" (Significant)', color: '#ef4444' },
            { label: '2"-2.5" (Severe)', color: '#dc2626' },
            { label: '> 2.5" (Extreme)', color: '#991b1b' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full border border-white/30" 
                style={{ backgroundColor: color }}
              />
              <span className="text-[10px] text-slate-400">{label}</span>
            </div>
          ))}
        </div>
        {showProperties && (
          <>
            <div className="border-t border-slate-600 my-2" />
            <div className="text-xs font-semibold text-white mb-2">Properties</div>
            <div className="space-y-1">
              {[
                { label: 'New Lead', color: '#06b6d4' },
                { label: 'Contacted', color: '#a855f7' },
                { label: 'Converted', color: '#10b981' },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full border-2 border-white" 
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[10px] text-slate-400">{label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Event Count */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]">
        <div className="bg-slate-800/95 backdrop-blur border border-slate-700 rounded-full px-4 py-1.5 shadow-lg">
          <span className="text-sm font-medium text-white">
            <span className="text-cyan-400 font-mono">{events.length.toLocaleString()}</span>
            {' '}storm events
            {showPaths && (
              <span className="text-slate-400 ml-2">• paths enabled</span>
            )}
          </span>
        </div>
      </div>

      {/* Fullscreen Exit Hint */}
      {isFullscreen && (
        <div className="absolute bottom-4 right-4 z-[1000]">
          <div className="bg-slate-800/95 backdrop-blur border border-slate-700 rounded-lg px-3 py-2 shadow-lg">
            <span className="text-xs text-slate-400">
              Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300 font-mono">Esc</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300 font-mono">F</kbd> to exit
            </span>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full absolute inset-0"
        style={{ 
          minHeight: isFullscreen ? '100vh' : '400px',
          background: '#0f172a' 
        }}
      />
    </div>
  )
}
