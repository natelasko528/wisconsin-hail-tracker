'use client'

import { useEffect, useRef, useCallback } from 'react'

interface HeatMapLayerProps {
  map: any
  data: [number, number, number][] // [lat, lng, intensity]
  visible: boolean
  radius?: number
  blur?: number
  maxZoom?: number
  minOpacity?: number
  gradient?: { [key: number]: string }
}

/**
 * Leaflet Heat Map Layer Component
 * 
 * Renders a heat map overlay on a Leaflet map using heatmap.js or leaflet-heat
 * Data format: Array of [latitude, longitude, intensity] tuples
 * Intensity should be normalized 0-1
 */
export default function HeatMapLayer({
  map,
  data,
  visible,
  radius = 25,
  blur = 15,
  maxZoom = 18,
  minOpacity = 0.3,
  gradient = {
    0.0: '#0000ff', // Blue - low intensity
    0.25: '#00ffff', // Cyan
    0.5: '#00ff00', // Green
    0.75: '#ffff00', // Yellow
    1.0: '#ff0000' // Red - high intensity
  }
}: HeatMapLayerProps) {
  const heatLayerRef = useRef<any>(null)
  const scriptLoadedRef = useRef(false)

  // Load leaflet.heat script dynamically
  const loadHeatScript = useCallback(async () => {
    if (scriptLoadedRef.current || typeof window === 'undefined') return

    return new Promise<void>((resolve, reject) => {
      // Check if already loaded
      if ((window as any).L?.heatLayer) {
        scriptLoadedRef.current = true
        resolve()
        return
      }

      // Load simpleheat first (dependency)
      const simpleheatScript = document.createElement('script')
      simpleheatScript.src = 'https://unpkg.com/simpleheat@0.4.0/simpleheat.js'
      simpleheatScript.onload = () => {
        // Then load leaflet.heat
        const heatScript = document.createElement('script')
        heatScript.src = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js'
        heatScript.onload = () => {
          scriptLoadedRef.current = true
          resolve()
        }
        heatScript.onerror = reject
        document.head.appendChild(heatScript)
      }
      simpleheatScript.onerror = reject
      document.head.appendChild(simpleheatScript)
    })
  }, [])

  // Initialize heat layer
  useEffect(() => {
    if (!map || typeof window === 'undefined') return

    const initHeatLayer = async () => {
      try {
        await loadHeatScript()
        
        const L = (window as any).L
        if (!L?.heatLayer) {
          console.warn('Leaflet heat not loaded')
          return
        }

        // Create heat layer if it doesn't exist
        if (!heatLayerRef.current) {
          heatLayerRef.current = L.heatLayer([], {
            radius,
            blur,
            maxZoom,
            minOpacity,
            gradient
          })
        }

        // Update visibility
        if (visible) {
          if (!map.hasLayer(heatLayerRef.current)) {
            heatLayerRef.current.addTo(map)
          }
          // Update data
          heatLayerRef.current.setLatLngs(data)
        } else {
          if (map.hasLayer(heatLayerRef.current)) {
            map.removeLayer(heatLayerRef.current)
          }
        }
      } catch (error) {
        console.error('Failed to load heat map:', error)
      }
    }

    initHeatLayer()

    return () => {
      if (heatLayerRef.current && map) {
        try {
          map.removeLayer(heatLayerRef.current)
        } catch (e) {}
      }
    }
  }, [map, visible, data, loadHeatScript, radius, blur, maxZoom, minOpacity, gradient])

  // Update data when it changes
  useEffect(() => {
    if (heatLayerRef.current && visible && data.length > 0) {
      heatLayerRef.current.setLatLngs(data)
    }
  }, [data, visible])

  // No visual render - this is a map layer
  return null
}

/**
 * Alternative: Canvas-based heat map implementation
 * Use this if leaflet.heat doesn't work
 */
export function CanvasHeatMapLayer({
  map,
  data,
  visible,
  radius = 20,
  maxOpacity = 0.6
}: {
  map: any
  data: [number, number, number][]
  visible: boolean
  radius?: number
  maxOpacity?: number
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const overlayRef = useRef<any>(null)

  useEffect(() => {
    if (!map || !visible || typeof window === 'undefined') return

    const L = (window as any).L
    if (!L) return

    // Create canvas overlay
    const canvas = document.createElement('canvas')
    const bounds = map.getBounds()
    const size = map.getSize()
    
    canvas.width = size.x
    canvas.height = size.y
    canvas.style.position = 'absolute'
    canvas.style.top = '0'
    canvas.style.left = '0'
    canvas.style.pointerEvents = 'none'
    canvasRef.current = canvas

    // Draw heat map
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw each point
    data.forEach(([lat, lng, intensity]) => {
      const point = map.latLngToContainerPoint([lat, lng])
      
      // Create radial gradient
      const gradient = ctx.createRadialGradient(
        point.x, point.y, 0,
        point.x, point.y, radius
      )
      
      // Color based on intensity
      const r = Math.round(255 * intensity)
      const g = Math.round(255 * (1 - intensity) * 0.5)
      const b = Math.round(100 * (1 - intensity))
      
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${maxOpacity * intensity})`)
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      
      ctx.fillStyle = gradient
      ctx.fillRect(point.x - radius, point.y - radius, radius * 2, radius * 2)
    })

    // Add canvas to map pane
    const pane = map.getPane('overlayPane')
    if (pane) {
      pane.appendChild(canvas)
    }

    // Update on map move
    const updatePosition = () => {
      const topLeft = map.containerPointToLayerPoint([0, 0])
      L.DomUtil.setPosition(canvas, topLeft)
    }

    map.on('move', updatePosition)
    updatePosition()

    return () => {
      map.off('move', updatePosition)
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas)
      }
    }
  }, [map, data, visible, radius, maxOpacity])

  return null
}
