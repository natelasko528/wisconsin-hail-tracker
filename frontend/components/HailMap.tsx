'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface StormEvent {
  id: string
  event_date: string
  city: string
  county: string
  state: string
  latitude: number
  longitude: number
  hail_size: number
  severity: 'critical' | 'high' | 'medium' | 'low'
  damage_property?: string
}

interface HailMapProps {
  storms: StormEvent[]
  selectedStorms: Set<string>
  onStormSelect: (id: string) => void
}

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e'
}

// Wisconsin center coordinates
const WISCONSIN_CENTER: [number, number] = [44.5, -89.5]
const DEFAULT_ZOOM = 7

export default function HailMap({ storms, selectedStorms, onStormSelect }: HailMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<L.CircleMarker[]>([])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // Initialize map
    mapRef.current = L.map(containerRef.current, {
      center: WISCONSIN_CENTER,
      zoom: DEFAULT_ZOOM,
      scrollWheelZoom: true
    })

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapRef.current)

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Update markers when storms change
  useEffect(() => {
    if (!mapRef.current) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // Filter storms with valid coordinates
    const validStorms = storms.filter(
      s => s.latitude && s.longitude && 
      !isNaN(s.latitude) && !isNaN(s.longitude) &&
      s.latitude !== 0 && s.longitude !== 0
    )

    if (validStorms.length === 0) return

    // Add markers for each storm
    validStorms.forEach(storm => {
      const isSelected = selectedStorms.has(storm.id)
      const color = SEVERITY_COLORS[storm.severity]
      const radius = Math.max(6, Math.min(15, storm.hail_size * 5))

      const marker = L.circleMarker([storm.latitude, storm.longitude], {
        radius,
        fillColor: color,
        color: isSelected ? '#000' : color,
        weight: isSelected ? 3 : 1,
        opacity: 1,
        fillOpacity: 0.7
      })

      marker.bindPopup(`
        <div style="min-width: 200px;">
          <strong style="font-size: 14px; display: block; margin-bottom: 8px;">${storm.city || storm.county}</strong>
          <div style="font-size: 12px; color: #666;">
            <p><strong>Date:</strong> ${storm.event_date ? new Date(storm.event_date).toLocaleDateString() : 'N/A'}</p>
            <p><strong>County:</strong> ${storm.county}, ${storm.state}</p>
            <p><strong>Hail Size:</strong> ${storm.hail_size}" (${storm.severity})</p>
            ${storm.damage_property ? `<p><strong>Damage:</strong> ${storm.damage_property}</p>` : ''}
          </div>
          <button 
            onclick="window.dispatchEvent(new CustomEvent('hail-map-select', { detail: '${storm.id}' }))"
            style="margin-top: 10px; padding: 6px 12px; background: ${isSelected ? '#e5e7eb' : '#22c55e'}; color: ${isSelected ? '#374151' : 'white'}; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; width: 100%;"
          >
            ${isSelected ? 'Deselect' : 'Select for Lead'}
          </button>
        </div>
      `)

      marker.on('click', () => {
        marker.openPopup()
      })

      marker.addTo(mapRef.current!)
      markersRef.current.push(marker)
    })

    // Fit bounds to show all markers if we have any
    if (validStorms.length > 0 && validStorms.length <= 1000) {
      const bounds = L.latLngBounds(validStorms.map(s => [s.latitude, s.longitude]))
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 })
    }
  }, [storms, selectedStorms])

  // Handle selection events from popup buttons
  useEffect(() => {
    const handleSelect = (e: CustomEvent) => {
      onStormSelect(e.detail)
    }

    window.addEventListener('hail-map-select' as any, handleSelect)
    return () => window.removeEventListener('hail-map-select' as any, handleSelect)
  }, [onStormSelect])

  return (
    <div className="relative">
      <div ref={containerRef} className="h-[500px] w-full" />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 rounded-lg shadow-lg p-3 z-[1000]">
        <div className="text-xs font-semibold mb-2">Severity</div>
        <div className="space-y-1">
          {Object.entries(SEVERITY_COLORS).map(([severity, color]) => (
            <div key={severity} className="flex items-center gap-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: color }}
              />
              <span className="capitalize">{severity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats overlay */}
      <div className="absolute top-4 right-4 bg-white/95 rounded-lg shadow-lg p-3 z-[1000]">
        <div className="text-xs text-muted-foreground">
          Showing {storms.filter(s => s.latitude && s.longitude).length} events on map
        </div>
        {selectedStorms.size > 0 && (
          <div className="text-xs font-semibold text-primary mt-1">
            {selectedStorms.size} selected
          </div>
        )}
      </div>
    </div>
  )
}
