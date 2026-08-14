import maplibregl from 'maplibre-gl'
import { useEffect, useRef, useState } from 'react'
import type { TelemetryFrame, Zone } from '../../types'
import { MAP_STYLES, type MapStyleId } from './mapStyles'

const SPEEDING_KPH = 90
const FOLLOW_PITCH = 58
const FOLLOW_ZOOM = 13.5
const FOLLOW_ORBIT_DEG_PER_FRAME = 0.05

interface AnimTarget {
  fromLon: number
  fromLat: number
  fromBearing: number
  toLon: number
  toLat: number
  toBearing: number
  start: number
  duration: number
  frame: TelemetryFrame
}

interface FollowState {
  id: number
  orbitBearing: number
  activatedAt: number
}

interface Props {
  frames: TelemetryFrame[]
  tickMillis: number
  zones: Zone[]
  drawMode: boolean
  onPolygonComplete: (coords: [number, number][]) => void
  onDrawCancel: () => void
  replayPath: [number, number][] | null
  replayPosition: TelemetryFrame | null
  selectedVehicleId: number | null
  onSelectVehicle: (id: number) => void
  styleId: MapStyleId
  followedVehicleId: number | null
  onFollowInterrupted: () => void
}

/** Top-view truck icon rendered onto a canvas, pointing north. */
function truckIcon(color: string): ImageData {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.translate(size / 2, size / 2)

  ctx.fillStyle = color
  ctx.strokeStyle = 'rgba(10,15,28,0.9)'
  ctx.lineWidth = 3
  roundRect(ctx, -11, -8, 22, 30, 5)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#e2e8f0'
  roundRect(ctx, -9, -24, 18, 14, 5)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = 'rgba(10,15,28,0.7)'
  roundRect(ctx, -6, -21, 12, 4, 2)
  ctx.fill()

  return ctx.getImageData(0, 0, size, size)
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function lerpAngle(a: number, b: number, t: number): number {
  const d = ((b - a + 540) % 360) - 180
  return (a + d * t + 360) % 360
}

/**
 * (Re)installs every custom image, source, and layer. Idempotent — safe to call
 * after any setStyle() once the new style has loaded.
 */
function installOverlays(map: maplibregl.Map) {
  if (!map.hasImage('truck')) map.addImage('truck', truckIcon('#38bdf8'))
  if (!map.hasImage('truck-warn')) map.addImage('truck-warn', truckIcon('#fbbf24'))

  // 3D buildings — only on the vector (CARTO) basemap
  if (!map.getLayer('buildings-3d')) {
    try {
      if (map.getSource('carto')) {
        map.addLayer({
          id: 'buildings-3d',
          type: 'fill-extrusion',
          source: 'carto',
          'source-layer': 'building',
          minzoom: 13,
          paint: {
            'fill-extrusion-color': '#1e293b',
            'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 12],
            'fill-extrusion-opacity': 0.65,
          },
        })
      }
    } catch {
      /* basemap without a building layer — skip */
    }
  }

  if (!map.getSource('zones')) {
    map.addSource('zones', { type: 'geojson', data: emptyFC() })
    map.addLayer({
      id: 'zones-fill',
      type: 'fill',
      source: 'zones',
      paint: {
        'fill-color': ['get', 'color'],
        'fill-opacity': ['case', ['get', 'active'], 0.14, 0.05],
      },
    })
    map.addLayer({
      id: 'zones-line',
      type: 'line',
      source: 'zones',
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 2,
        'line-opacity': ['case', ['get', 'active'], 0.9, 0.35],
        'line-dasharray': [2, 1],
      },
    })
  }

  if (!map.getSource('replay')) {
    map.addSource('replay', { type: 'geojson', data: emptyFC() })
    map.addLayer({
      id: 'replay-line',
      type: 'line',
      source: 'replay',
      filter: ['==', '$type', 'LineString'],
      paint: { 'line-color': '#a78bfa', 'line-width': 3, 'line-opacity': 0.8 },
    })
    map.addLayer({
      id: 'replay-point',
      type: 'circle',
      source: 'replay',
      filter: ['==', '$type', 'Point'],
      paint: {
        'circle-radius': 8,
        'circle-color': '#a78bfa',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#0a0f1c',
      },
    })
  }

  if (!map.getSource('draw')) {
    map.addSource('draw', { type: 'geojson', data: emptyFC() })
    map.addLayer({
      id: 'draw-fill',
      type: 'fill',
      source: 'draw',
      filter: ['==', '$type', 'Polygon'],
      paint: { 'fill-color': '#38bdf8', 'fill-opacity': 0.12 },
    })
    map.addLayer({
      id: 'draw-line',
      type: 'line',
      source: 'draw',
      filter: ['==', '$type', 'LineString'],
      paint: { 'line-color': '#38bdf8', 'line-width': 2, 'line-dasharray': [1, 1] },
    })
    map.addLayer({
      id: 'draw-points',
      type: 'circle',
      source: 'draw',
      filter: ['==', '$type', 'Point'],
      paint: { 'circle-radius': 4, 'circle-color': '#38bdf8' },
    })
  }

  if (!map.getSource('vehicles')) {
    map.addSource('vehicles', { type: 'geojson', data: emptyFC() })
    map.addLayer({
      id: 'vehicles-glow',
      type: 'circle',
      source: 'vehicles',
      paint: {
        'circle-radius': 14,
        'circle-color': ['case', ['get', 'speeding'], '#fbbf24', '#38bdf8'],
        'circle-blur': 1,
        'circle-opacity': 0.35,
      },
    })
    map.addLayer({
      id: 'vehicles-icons',
      type: 'symbol',
      source: 'vehicles',
      layout: {
        'icon-image': ['case', ['get', 'speeding'], 'truck-warn', 'truck'],
        'icon-size': 0.55,
        'icon-rotate': ['get', 'bearing'],
        'icon-rotation-alignment': 'map',
        'icon-allow-overlap': true,
        'text-field': ['step', ['zoom'], '', 7, ['get', 'plate']],
        'text-font': ['Montserrat Regular'],
        'text-size': 10,
        'text-offset': [0, 2],
        'text-optional': true,
      },
      paint: {
        'text-color': '#94a3b8',
        'text-halo-color': '#0a0f1c',
        'text-halo-width': 1.2,
      },
    })
  }
}

export default function FleetMap({
  frames,
  tickMillis,
  zones,
  drawMode,
  onPolygonComplete,
  onDrawCancel,
  replayPath,
  replayPosition,
  selectedVehicleId,
  onSelectVehicle,
  styleId,
  followedVehicleId,
  onFollowInterrupted,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [ready, setReady] = useState(false)
  const [overlayVersion, setOverlayVersion] = useState(0)
  const animRef = useRef<Map<number, AnimTarget>>(new Map())
  const drawPointsRef = useRef<[number, number][]>([])
  const followRef = useRef<FollowState | null>(null)
  const selectHandlerRef = useRef(onSelectVehicle)
  const drawCompleteRef = useRef(onPolygonComplete)
  const drawCancelRef = useRef(onDrawCancel)
  const followInterruptedRef = useRef(onFollowInterrupted)
  const drawModeRef = useRef(drawMode)
  selectHandlerRef.current = onSelectVehicle
  drawCompleteRef.current = onPolygonComplete
  drawCancelRef.current = onDrawCancel
  followInterruptedRef.current = onFollowInterrupted
  drawModeRef.current = drawMode

  // ---------- map bootstrap ----------
  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current!,
      style: MAP_STYLES.cyber.spec,
      center: [67.8, 40.6],
      zoom: 5.6,
      pitch: 45,
      bearing: -8,
      antialias: true,
      attributionControl: { compact: true },
    })
    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right')

    map.on('load', () => {
      installOverlays(map)

      map.on('click', 'vehicles-icons', (e) => {
        if (drawModeRef.current) return
        const id = e.features?.[0]?.properties?.id
        if (id != null) selectHandlerRef.current(Number(id))
      })
      map.on('mouseenter', 'vehicles-icons', () => {
        if (!drawModeRef.current) map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'vehicles-icons', () => {
        map.getCanvas().style.cursor = drawModeRef.current ? 'crosshair' : ''
      })

      // manual camera input breaks cinema follow
      const interrupt = () => {
        if (followRef.current) followInterruptedRef.current()
      }
      map.on('dragstart', interrupt)
      map.on('wheel', interrupt)
      map.on('pitchstart', interrupt)

      setReady(true)
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // ---------- basemap style switching ----------
  const prevStyleRef = useRef<MapStyleId>('cyber')
  useEffect(() => {
    if (!ready || prevStyleRef.current === styleId) return
    prevStyleRef.current = styleId
    const map = mapRef.current!
    map.setStyle(MAP_STYLES[styleId].spec)

    let cancelled = false
    const rebuild = () => {
      if (cancelled) return
      if (!map.isStyleLoaded()) {
        setTimeout(rebuild, 80)
        return
      }
      installOverlays(map)
      setOverlayVersion((v) => v + 1)
    }
    map.once('styledata', rebuild)
    return () => {
      cancelled = true
    }
  }, [styleId, ready])

  // ---------- marker interpolation ----------
  useEffect(() => {
    if (!ready) return
    const now = performance.now()
    for (const f of frames) {
      const prev = animRef.current.get(f.vehicleId)
      animRef.current.set(f.vehicleId, {
        fromLon: prev ? currentLon(prev, now) : f.lon,
        fromLat: prev ? currentLat(prev, now) : f.lat,
        fromBearing: prev ? currentBearing(prev, now) : f.bearingDeg,
        toLon: f.lon,
        toLat: f.lat,
        toBearing: f.bearingDeg,
        start: now,
        duration: tickMillis,
        frame: f,
      })
    }
  }, [frames, ready, tickMillis])

  useEffect(() => {
    if (!ready) return
    let raf = 0
    const loop = () => {
      const map = mapRef.current
      const src = map?.getSource('vehicles') as maplibregl.GeoJSONSource | undefined
      const now = performance.now()
      if (src) {
        const features = [...animRef.current.values()].map((a) => ({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [currentLon(a, now), currentLat(a, now)],
          },
          properties: {
            id: a.frame.vehicleId,
            plate: a.frame.plateNumber ?? '',
            bearing: currentBearing(a, now),
            speeding: a.frame.speedKph > SPEEDING_KPH,
          },
        }))
        src.setData({ type: 'FeatureCollection', features })
      }

      // cinema follow: once the intro flight lands, track + slow orbit
      const follow = followRef.current
      if (map && follow && now - follow.activatedAt > 1700) {
        const a = animRef.current.get(follow.id)
        if (a) {
          follow.orbitBearing =
            (follow.orbitBearing + FOLLOW_ORBIT_DEG_PER_FRAME) % 360
          map.jumpTo({
            center: [currentLon(a, now), currentLat(a, now)],
            bearing: follow.orbitBearing,
            pitch: FOLLOW_PITCH,
          })
        }
      }

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [ready])

  // ---------- follow activation ----------
  useEffect(() => {
    if (!ready) return
    const map = mapRef.current!
    if (followedVehicleId == null) {
      followRef.current = null
      return
    }
    const a = animRef.current.get(followedVehicleId)
    const start: [number, number] = a
      ? [a.toLon, a.toLat]
      : [map.getCenter().lng, map.getCenter().lat]
    followRef.current = {
      id: followedVehicleId,
      orbitBearing: map.getBearing(),
      activatedAt: performance.now(),
    }
    map.flyTo({
      center: start,
      zoom: FOLLOW_ZOOM,
      pitch: FOLLOW_PITCH,
      duration: 1600,
      essential: true,
    })

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') followInterruptedRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [followedVehicleId, ready])

  // ---------- zones ----------
  useEffect(() => {
    if (!ready) return
    const src = mapRef.current?.getSource('zones') as maplibregl.GeoJSONSource | undefined
    src?.setData({
      type: 'FeatureCollection',
      features: zones.map((z) => ({
        type: 'Feature' as const,
        geometry: { type: 'Polygon' as const, coordinates: [z.coordinates] },
        properties: { id: z.id, name: z.name, color: z.color, active: z.active },
      })),
    })
  }, [zones, ready, overlayVersion])

  // ---------- polygon drawing ----------
  useEffect(() => {
    if (!ready) return
    const map = mapRef.current!
    if (!drawMode) {
      drawPointsRef.current = []
      renderDraw(map)
      map.getCanvas().style.cursor = ''
      return
    }
    map.getCanvas().style.cursor = 'crosshair'
    map.doubleClickZoom.disable()

    const onClick = (e: maplibregl.MapMouseEvent) => {
      drawPointsRef.current = [...drawPointsRef.current, [e.lngLat.lng, e.lngLat.lat]]
      renderDraw(map)
    }
    const onDblClick = (e: maplibregl.MapMouseEvent) => {
      e.preventDefault()
      const pts = drawPointsRef.current
      if (pts.length >= 3) {
        drawCompleteRef.current(pts)
      } else {
        drawCancelRef.current()
      }
      drawPointsRef.current = []
      renderDraw(map)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        drawPointsRef.current = []
        renderDraw(map)
        drawCancelRef.current()
      }
    }
    map.on('click', onClick)
    map.on('dblclick', onDblClick)
    window.addEventListener('keydown', onKey)
    return () => {
      map.off('click', onClick)
      map.off('dblclick', onDblClick)
      window.removeEventListener('keydown', onKey)
      map.doubleClickZoom.enable()
      map.getCanvas().style.cursor = ''
    }
  }, [drawMode, ready])

  const renderDraw = (map: maplibregl.Map) => {
    const src = map.getSource('draw') as maplibregl.GeoJSONSource | undefined
    if (!src) return
    const pts = drawPointsRef.current
    const features: GeoJSON.Feature[] = pts.map((p) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: p },
      properties: {},
    }))
    if (pts.length >= 2) {
      features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [...pts, pts[0]] },
        properties: {},
      })
    }
    if (pts.length >= 3) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [[...pts, pts[0]]] },
        properties: {},
      })
    }
    src.setData({ type: 'FeatureCollection', features })
  }

  // ---------- replay ----------
  useEffect(() => {
    if (!ready) return
    const src = mapRef.current?.getSource('replay') as maplibregl.GeoJSONSource | undefined
    if (!src) return
    const features: GeoJSON.Feature[] = []
    if (replayPath && replayPath.length >= 2) {
      features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: replayPath },
        properties: {},
      })
    }
    if (replayPosition) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [replayPosition.lon, replayPosition.lat] },
        properties: {},
      })
    }
    src.setData({ type: 'FeatureCollection', features })
  }, [replayPath, replayPosition, ready, overlayVersion])

  // ---------- fly to selection (unless cinema already owns the camera) ----------
  useEffect(() => {
    if (!ready || selectedVehicleId == null) return
    if (followedVehicleId === selectedVehicleId) return
    const a = animRef.current.get(selectedVehicleId)
    if (a) {
      mapRef.current?.flyTo({ center: [a.toLon, a.toLat], zoom: 9, duration: 1200 })
    }
  }, [selectedVehicleId, ready, followedVehicleId])

  return <div ref={containerRef} className="absolute inset-0" />
}

const emptyFC = (): GeoJSON.FeatureCollection => ({ type: 'FeatureCollection', features: [] })

const currentLon = (a: AnimTarget, now: number) =>
  a.fromLon + (a.toLon - a.fromLon) * progress(a, now)
const currentLat = (a: AnimTarget, now: number) =>
  a.fromLat + (a.toLat - a.fromLat) * progress(a, now)
const currentBearing = (a: AnimTarget, now: number) =>
  lerpAngle(a.fromBearing, a.toBearing, progress(a, now))
const progress = (a: AnimTarget, now: number) =>
  Math.min(1, (now - a.start) / a.duration)
