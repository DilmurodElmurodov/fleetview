import { AnimatePresence } from 'framer-motion'
import { Contrast, Moon, PenLine, Satellite, Trash2, VideoOff } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import Header from '../components/layout/Header'
import FleetMap from '../components/map/FleetMap'
import { MAP_STYLES, type MapStyleId } from '../components/map/mapStyles'
import ZoneModal from '../components/map/ZoneModal'
import ReplayPlayer from '../components/controls/ReplayPlayer'
import SimulatorControls from '../components/controls/SimulatorControls'
import AlertsFeed from '../components/sidebar/AlertsFeed'
import FleetStats from '../components/sidebar/FleetStats'
import TelemetryPanel from '../components/sidebar/TelemetryPanel'
import VehicleHud from '../components/sidebar/VehicleHud'
import { useSoundFx } from '../hooks/useSoundFx'
import { useTelemetrySocket } from '../hooks/useTelemetrySocket'
import type { FleetAlert, ReplayState, SimStatus, TelemetryFrame, Vehicle, Zone } from '../types'

const STYLE_ICONS: Record<MapStyleId, typeof Moon> = {
  cyber: Moon,
  satellite: Satellite,
  mono: Contrast,
}

const MAX_ALERTS = 50
const MAX_SPEED_SAMPLES = 60

export default function DashboardPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [alerts, setAlerts] = useState<FleetAlert[]>([])
  const [simStatus, setSimStatus] = useState<SimStatus | null>(null)
  const [lastBatch, setLastBatch] = useState<TelemetryFrame[]>([])
  const [liveFrames, setLiveFrames] = useState<Map<number, TelemetryFrame>>(new Map())
  const [speedHistory, setSpeedHistory] = useState<{ t: string; avg: number }[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null)
  const [followedVehicleId, setFollowedVehicleId] = useState<number | null>(null)
  const [mapStyle, setMapStyle] = useState<MapStyleId>('cyber')
  const [drawMode, setDrawMode] = useState(false)
  const [pendingPolygon, setPendingPolygon] = useState<[number, number][] | null>(null)
  const [replay, setReplay] = useState<ReplayState>({
    vehicleId: null,
    frames: [],
    index: 0,
    playing: false,
    speed: 1,
  })

  // ---------- initial load ----------
  useEffect(() => {
    api.vehicles().then(setVehicles).catch(console.error)
    api.zones().then(setZones).catch(console.error)
    api.alerts(MAX_ALERTS).then(setAlerts).catch(console.error)
    api.simStatus().then(setSimStatus).catch(console.error)
    api
      .liveTelemetry()
      .then((frames) => {
        setLastBatch(frames)
        setLiveFrames(new Map(frames.map((f) => [f.vehicleId, f])))
      })
      .catch(console.error)
  }, [])

  // ---------- tactile audio ----------
  const sfx = useSoundFx()

  // ---------- websocket ----------
  const onTelemetry = useCallback(
    (frames: TelemetryFrame[]) => {
      setLastBatch(frames)
      setLiveFrames((prev) => {
        const next = new Map(prev)
        for (const f of frames) next.set(f.vehicleId, f)
        return next
      })
      if (frames.length > 0) {
        sfx.ping()
        const avg = frames.reduce((s, f) => s + f.speedKph, 0) / frames.length
        setSpeedHistory((h) =>
          [...h, { t: new Date().toLocaleTimeString(), avg }].slice(-MAX_SPEED_SAMPLES),
        )
      }
    },
    [sfx.ping],
  )

  const onAlert = useCallback(
    (alert: FleetAlert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, MAX_ALERTS))
      sfx.chime(alert.severity)
    },
    [sfx.chime],
  )

  const { connected } = useTelemetrySocket(onTelemetry, onAlert)

  // ---------- replay playback ----------
  const replayRef = useRef(replay)
  replayRef.current = replay
  useEffect(() => {
    if (!replay.playing) return
    const interval = setInterval(() => {
      setReplay((r) => {
        if (r.index >= r.frames.length - 1) return { ...r, playing: false }
        return { ...r, index: r.index + 1 }
      })
    }, 400 / replay.speed)
    return () => clearInterval(interval)
  }, [replay.playing, replay.speed])

  const loadReplay = (vehicleId: number) => {
    api
      .history(vehicleId, 2000)
      .then((frames) =>
        setReplay({ vehicleId, frames, index: 0, playing: frames.length > 1, speed: 1 }),
      )
      .catch(console.error)
  }

  // ---------- zone drawing ----------
  const handlePolygonComplete = useCallback((coords: [number, number][]) => {
    setDrawMode(false)
    setPendingPolygon(coords)
  }, [])

  const confirmZone = (name: string, zoneType: string) => {
    if (!pendingPolygon) return
    api
      .createZone({ name, zoneType, coordinates: pendingPolygon })
      .then(() => api.zones().then(setZones))
      .catch(console.error)
      .finally(() => setPendingPolygon(null))
  }

  const deleteZone = (id: number) => {
    api
      .deleteZone(id)
      .then(() => api.zones().then(setZones))
      .catch(console.error)
  }

  const ackAlert = (id: number) => {
    api.ackAlert(id).catch(console.error)
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)))
  }

  const toggleFollow = (id: number) => {
    setSelectedVehicleId(id)
    setFollowedVehicleId((prev) => (prev === id ? null : id))
  }

  const unack = alerts.filter((a) => !a.acknowledged).length
  const replayActive = replay.vehicleId != null && replay.frames.length > 0
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) ?? null
  const followedVehicle = vehicles.find((v) => v.id === followedVehicleId) ?? null

  return (
    <div className="relative h-full w-full overflow-hidden">
      <FleetMap
        frames={lastBatch}
        tickMillis={simStatus?.tickMillis ?? 2000}
        zones={zones}
        drawMode={drawMode}
        onPolygonComplete={handlePolygonComplete}
        onDrawCancel={() => setDrawMode(false)}
        replayPath={replayActive ? replay.frames.map((f) => [f.lon, f.lat]) : null}
        replayPosition={replayActive ? replay.frames[replay.index] : null}
        selectedVehicleId={selectedVehicleId}
        onSelectVehicle={setSelectedVehicleId}
        styleId={mapStyle}
        followedVehicleId={followedVehicleId}
        onFollowInterrupted={() => setFollowedVehicleId(null)}
      />

      <Header
        connected={connected}
        activeCount={liveFrames.size}
        unackAlerts={unack}
        soundOn={sfx.enabled}
        onToggleSound={sfx.toggle}
      />

      {/* cinema-mode indicator */}
      {followedVehicle && (
        <div className="absolute left-1/2 top-24 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-violet-400/40 bg-violet-500/15 px-4 py-1.5 text-xs text-violet-200 backdrop-blur-xl">
          <span className="relative flex h-2 w-2">
            <span className="absolute h-full w-full animate-ping rounded-full bg-violet-400 opacity-60" />
            <span className="relative h-2 w-2 rounded-full bg-violet-400" />
          </span>
          CINEMA · {followedVehicle.plateNumber}
          <button
            onClick={() => setFollowedVehicleId(null)}
            title="Exit follow (Esc)"
            className="ml-1 rounded-full p-0.5 hover:bg-white/10"
          >
            <VideoOff className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* left tools */}
      <div className="absolute left-4 top-24 z-20 flex flex-col gap-2">
        <button
          onClick={() => setDrawMode((d) => !d)}
          className={`glass-strong flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
            drawMode ? 'text-sky-300 ring-1 ring-sky-400/60' : 'text-slate-300 hover:text-white'
          }`}
        >
          <PenLine className="h-4 w-4" />
          {drawMode ? 'Drawing… (dbl-click to finish, Esc to cancel)' : 'Draw geofence zone'}
        </button>

        {/* basemap style switcher */}
        <div className="glass-strong flex items-center gap-1 p-1.5">
          {(Object.keys(MAP_STYLES) as MapStyleId[]).map((id) => {
            const Icon = STYLE_ICONS[id]
            return (
              <button
                key={id}
                onClick={() => setMapStyle(id)}
                title={MAP_STYLES[id].label}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition ${
                  mapStyle === id
                    ? 'bg-sky-500/25 text-sky-300 ring-1 ring-sky-400/50'
                    : 'text-slate-400 hover:bg-white/10 hover:text-slate-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {MAP_STYLES[id].label}
              </button>
            )
          })}
        </div>

        <div className="glass-strong max-h-56 space-y-1 overflow-y-auto p-2">
          <div className="px-2 pt-1 text-[10px] uppercase tracking-wider text-slate-500">
            Zones
          </div>
          {zones.map((z) => (
            <div
              key={z.id}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-300 hover:bg-white/5"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: z.color }}
              />
              <span className="min-w-0 flex-1 truncate">{z.name}</span>
              <button
                onClick={() => deleteZone(z.id)}
                className="rounded p-0.5 text-slate-500 hover:text-red-400"
                title="Delete zone"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* right sidebar */}
      <aside className="absolute bottom-4 right-4 top-24 z-20 flex w-80 flex-col gap-3">
        <FleetStats speedHistory={speedHistory} liveFrames={liveFrames} />
        <div className="glass-strong p-3">
          <div className="mb-2 text-[11px] uppercase tracking-wider text-slate-400">
            Live alerts
          </div>
          <AlertsFeed alerts={alerts} onAck={ackAlert} />
        </div>
        <TelemetryPanel
          vehicles={vehicles}
          liveFrames={liveFrames}
          selectedVehicleId={selectedVehicleId}
          onSelect={setSelectedVehicleId}
          followedVehicleId={followedVehicleId}
          onFollow={toggleFollow}
        />
      </aside>

      {/* HUD drawer for the selected vehicle */}
      <AnimatePresence>
        {selectedVehicle && (
          <VehicleHud
            key={selectedVehicle.id}
            vehicle={selectedVehicle}
            live={liveFrames.get(selectedVehicle.id) ?? selectedVehicle.live}
            following={followedVehicleId === selectedVehicle.id}
            onToggleFollow={() => toggleFollow(selectedVehicle.id)}
            onClose={() => {
              setSelectedVehicleId(null)
              if (followedVehicleId === selectedVehicle.id) setFollowedVehicleId(null)
            }}
          />
        )}
      </AnimatePresence>

      {/* bottom-left control cluster */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-wrap items-center gap-3">
        <SimulatorControls
          status={simStatus}
          onStart={() => api.simStart().then(setSimStatus)}
          onStop={() => api.simStop().then(setSimStatus)}
          onSpeed={(x) => api.simSpeed(x).then(setSimStatus)}
        />
        <ReplayPlayer
          replay={replay}
          vehicles={vehicles}
          onLoad={loadReplay}
          onTogglePlay={() => setReplay((r) => ({ ...r, playing: !r.playing }))}
          onSpeed={(x) => setReplay((r) => ({ ...r, speed: x }))}
          onSeek={(i) => setReplay((r) => ({ ...r, index: i, playing: false }))}
          onClose={() =>
            setReplay({ vehicleId: null, frames: [], index: 0, playing: false, speed: 1 })
          }
        />
      </div>

      {pendingPolygon && (
        <ZoneModal onConfirm={confirmZone} onCancel={() => setPendingPolygon(null)} />
      )}
    </div>
  )
}
