import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Check, Fuel, LogIn, LogOut, Siren } from 'lucide-react'
import type { FleetAlert } from '../../types'

interface Props {
  alerts: FleetAlert[]
  onAck: (id: number) => void
}

const ICONS: Record<FleetAlert['alertType'], typeof Siren> = {
  ZONE_ENTER: LogIn,
  ZONE_EXIT: LogOut,
  SPEEDING: AlertTriangle,
  LOW_FUEL: Fuel,
}

const SEVERITY_STYLE: Record<FleetAlert['severity'], string> = {
  CRITICAL: 'border-red-500/40 bg-red-500/10 text-red-300',
  WARNING: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  INFO: 'border-sky-500/30 bg-sky-500/5 text-sky-300',
}

export default function AlertsFeed({ alerts, onAck }: Props) {
  return (
    <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto pr-1">
      <AnimatePresence initial={false}>
        {alerts.map((a) => {
          const Icon = ICONS[a.alertType] ?? Siren
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, height: 0 }}
              layout
              className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs ${SEVERITY_STYLE[a.severity]}`}
            >
              <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-slate-200">{a.message}</div>
                <div className="mt-0.5 text-[10px] text-slate-500">
                  {new Date(a.createdAt).toLocaleTimeString()}
                </div>
              </div>
              {!a.acknowledged && (
                <button
                  onClick={() => onAck(a.id)}
                  title="Acknowledge"
                  className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
      {alerts.length === 0 && (
        <div className="px-3 py-2 text-xs text-slate-500">No alerts yet — fleet is quiet.</div>
      )}
    </div>
  )
}
