import { useCallback, useRef, useState } from 'react'

export type ChimeSeverity = 'INFO' | 'WARNING' | 'CRITICAL'

/**
 * Futuristic tactile audio via the Web Audio API — no assets, no libraries.
 * The AudioContext is created lazily on the enable toggle (a user gesture),
 * satisfying browser autoplay policies. Preference persists in localStorage.
 */
export function useSoundFx() {
  const [enabled, setEnabled] = useState(() => localStorage.getItem('fleet-sound') === 'on')
  const ctxRef = useRef<AudioContext | null>(null)
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  const ctx = (): AudioContext => {
    if (!ctxRef.current) ctxRef.current = new AudioContext()
    if (ctxRef.current.state === 'suspended') void ctxRef.current.resume()
    return ctxRef.current
  }

  /** One enveloped oscillator note. */
  const tone = (
    ac: AudioContext,
    freq: number,
    startIn: number,
    dur: number,
    type: OscillatorType,
    peak: number,
  ) => {
    const t0 = ac.currentTime + startIn
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    const lp = ac.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 2400
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    osc.connect(lp).connect(gain).connect(ac.destination)
    osc.start(t0)
    osc.stop(t0 + dur + 0.05)
  }

  /** Soft ping — a telemetry packet batch arrived. */
  const ping = useCallback(() => {
    if (!enabledRef.current) return
    const ac = ctx()
    tone(ac, 1180, 0, 0.09, 'sine', 0.025)
  }, [])

  /** Alert chime, escalating with severity. */
  const chime = useCallback((severity: ChimeSeverity) => {
    if (!enabledRef.current) return
    const ac = ctx()
    if (severity === 'CRITICAL') {
      tone(ac, 880, 0, 0.12, 'square', 0.05)
      tone(ac, 660, 0.14, 0.12, 'square', 0.05)
      tone(ac, 880, 0.28, 0.18, 'square', 0.055)
    } else if (severity === 'WARNING') {
      tone(ac, 640, 0, 0.13, 'triangle', 0.06)
      tone(ac, 500, 0.15, 0.16, 'triangle', 0.055)
    } else {
      tone(ac, 760, 0, 0.1, 'sine', 0.04)
    }
  }, [])

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev
      localStorage.setItem('fleet-sound', next ? 'on' : 'off')
      if (next) {
        // created inside the click gesture; confirm audibly
        enabledRef.current = true
        const ac = ctx()
        tone(ac, 980, 0, 0.08, 'sine', 0.03)
        tone(ac, 1320, 0.09, 0.1, 'sine', 0.03)
      }
      return next
    })
  }, [])

  return { enabled, toggle, ping, chime }
}
