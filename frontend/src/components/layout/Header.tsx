import { Activity, Radio, Truck, Volume2, VolumeX, Wifi, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'

interface Props {
  connected: boolean
  activeCount: number
  unackAlerts: number
  soundOn: boolean
  onToggleSound: () => void
}

export default function Header({
  connected,
  activeCount,
  unackAlerts,
  soundOn,
  onToggleSound,
}: Props) {
  const [healthy, setHealthy] = useState<boolean | null>(null)

  useEffect(() => {
    let mounted = true
    const poll = () =>
      api
        .health()
        .then((h) => mounted && setHealthy(h.status === 'UP'))
        .catch(() => mounted && setHealthy(false))
    poll()
    const t = setInterval(poll, 10_000)
    return () => {
      mounted = false
      clearInterval(t)
    }
  }, [])

  return (
    <header className="glass-strong absolute top-4 left-4 right-4 z-20 flex items-center gap-6 px-6 py-3">
      <Link to="/" title="Back to site" className="flex items-center gap-2">
        <Radio className="h-6 w-6 text-sky-400" />
        <div>
          <div className="text-sm font-bold tracking-widest text-white">FLEETVIEW</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400">
            Dispatcher Console
          </div>
        </div>
      </Link>

      <div className="ml-auto flex items-center gap-5 text-xs">
        <span className="flex items-center gap-1.5 text-slate-300">
          <Truck className="h-4 w-4 text-sky-400" />
          <span className="font-mono text-sm text-white">{activeCount}</span> active
        </span>

        <span className="flex items-center gap-1.5 text-slate-300">
          <Activity
            className={`h-4 w-4 ${healthy == null ? 'text-slate-500' : healthy ? 'text-emerald-400' : 'text-red-400'}`}
          />
          {healthy == null ? 'checking…' : healthy ? 'System UP' : 'System DOWN'}
        </span>

        {unackAlerts > 0 && (
          <span className="rounded-full bg-red-500/20 px-2.5 py-1 font-mono text-red-300">
            {unackAlerts} alerts
          </span>
        )}

        <button
          onClick={onToggleSound}
          title={soundOn ? 'Mute tactile audio' : 'Enable tactile audio'}
          className={`rounded-lg p-2 transition ${
            soundOn
              ? 'bg-sky-500/15 text-sky-300'
              : 'text-slate-500 hover:bg-white/10 hover:text-slate-300'
          }`}
        >
          {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>

        <span
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-medium ${
            connected
              ? 'bg-emerald-500/15 text-emerald-300'
              : 'bg-red-500/15 text-red-300'
          }`}
        >
          {connected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          {connected ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>
    </header>
  )
}
