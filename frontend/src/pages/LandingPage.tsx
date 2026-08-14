import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  BellRing,
  Check,
  History,
  Lock,
  LogIn,
  MapPin,
  Radio,
  Satellite,
  Send,
  ShieldCheck,
  Truck,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CyberGridCanvas from '../components/fx/CyberGridCanvas'
import MiniFleetSim from '../components/fx/MiniFleetSim'
import RoiCalculator from '../components/fx/RoiCalculator'

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5 },
}

const hoverLift = {
  whileHover: { y: -4 },
}

const FEATURES = [
  {
    icon: Satellite,
    title: 'Real-time GPS Telemetry',
    text: 'Every truck streams position, speed, bearing and fuel every 2 seconds over WebSockets. Markers glide across a 3D dark map — no refresh, no lag, no polling.',
  },
  {
    icon: MapPin,
    title: 'Geofencing Engine',
    text: 'Draw restricted, delivery or warehouse zones directly on the map. PostGIS-backed spatial evaluation fires enter/exit alerts the instant a vehicle crosses a boundary.',
  },
  {
    icon: History,
    title: 'Route Replay',
    text: 'Scrub through any vehicle’s historical route with play/pause and 2×–5× speed. Every frame is retained in a spatially-indexed telemetry archive.',
  },
  {
    icon: BellRing,
    title: 'Instant Alerting',
    text: 'Speeding, low fuel, and zone breaches push to every dispatcher screen in real time — with a full audit log for compliance reviews.',
  },
  {
    icon: ShieldCheck,
    title: 'Enterprise-grade Core',
    text: 'Spring Boot + PostgreSQL/PostGIS, atomic UPSERTs, GIST spatial indexes, and an in-memory hot path built for high-frequency fleets.',
  },
  {
    icon: Truck,
    title: 'Built for Heavy Fleets',
    text: 'From 20 trucks to 2,000 — batched ingestion and one broadcast frame per tick keep bandwidth flat as your fleet grows.',
  },
]

const PLANS = [
  {
    name: 'Starter',
    price: '$249',
    unit: '/mo',
    tagline: 'Up to 25 vehicles',
    features: ['Live map & telemetry', '5 geofence zones', '30-day route history', 'Email support'],
    highlight: false,
  },
  {
    name: 'Growth',
    price: '$749',
    unit: '/mo',
    tagline: 'Up to 150 vehicles',
    features: [
      'Everything in Starter',
      'Unlimited geofence zones',
      '12-month route history',
      'Real-time alert webhooks',
      'Priority support',
    ],
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    unit: '',
    tagline: 'Unlimited fleet, SLA-backed',
    features: [
      'Everything in Growth',
      'Dedicated cluster & 99.9% SLA',
      'SSO / SAML, audit exports',
      'Custom integrations (ERP, TMS)',
      'Named solutions engineer',
    ],
    highlight: false,
  },
]

/** UI-level gate only: keeps the console out of the public flow. Real security
 *  belongs on the backend (Spring Security) — this is a UX affordance. */
const STAFF_ACCESS_CODE: string = import.meta.env.VITE_STAFF_ACCESS_CODE ?? 'fleet2026'

function StaffLoginModal({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)
  const navigate = useNavigate()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (code === STAFF_ACCESS_CODE) {
      navigate('/dashboard')
    } else {
      setError(true)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <motion.form
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="glass-strong w-full max-w-sm p-7"
      >
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-sky-500/15 p-2">
              <Lock className="h-4 w-4 text-sky-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Dispetcher kirishi</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-5 text-xs text-slate-400">
          Internal dispatcher console — company staff only.
        </p>
        <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-slate-400">
          Access code
        </label>
        <input
          autoFocus
          type="password"
          value={code}
          onChange={(e) => {
            setCode(e.target.value)
            setError(false)
          }}
          placeholder="••••••••"
          className={`input-glass font-mono ${error ? 'border-red-400/60' : ''}`}
        />
        {error && (
          <p className="mt-2 text-xs text-red-400">Noto‘g‘ri kod — access denied.</p>
        )}
        <button
          type="submit"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400"
        >
          <LogIn className="h-4 w-4" /> Kirish
        </button>
        <p className="mt-3 text-center text-[10px] text-slate-500">
          Demo access code: <code className="text-slate-400">fleet2026</code>
        </p>
      </motion.form>
    </div>
  )
}

function ContactForm() {
  const [sent, setSent] = useState(false)

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-strong flex flex-col items-center gap-3 p-10 text-center"
      >
        <div className="rounded-full bg-emerald-500/15 p-3">
          <Check className="h-6 w-6 text-emerald-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">So‘rovingiz qabul qilindi</h3>
        <p className="max-w-sm text-sm text-slate-400">
          Thanks for reaching out — our partnership team will get back to you within one business
          day. (Demo environment: submissions are not transmitted.)
        </p>
      </motion.div>
    )
  }

  return (
    <form
      className="glass-strong grid grid-cols-1 gap-4 p-8 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault()
        setSent(true)
      }}
    >
      <div>
        <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-slate-400">
          Full name
        </label>
        <input required placeholder="Aziza Karimova" className="input-glass" />
      </div>
      <div>
        <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-slate-400">
          Company
        </label>
        <input required placeholder="Silk Road Logistics LLC" className="input-glass" />
      </div>
      <div>
        <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-slate-400">
          Work email
        </label>
        <input required type="email" placeholder="you@company.com" className="input-glass" />
      </div>
      <div>
        <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-slate-400">
          Fleet size
        </label>
        <select className="input-glass" defaultValue="26-150">
          <option value="1-25">1–25 vehicles</option>
          <option value="26-150">26–150 vehicles</option>
          <option value="151-500">151–500 vehicles</option>
          <option value="500+">500+ vehicles</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-slate-400">
          How can we help?
        </label>
        <textarea
          rows={4}
          placeholder="Tell us about your routes, cargo, and current tracking setup…"
          className="input-glass resize-none"
        />
      </div>
      <div className="sm:col-span-2 flex justify-end">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          type="submit"
          className="btn-glow flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white"
        >
          <Send className="h-4 w-4" /> Request demo — So‘rov yuborish
        </motion.button>
      </div>
    </form>
  )
}

export default function LandingPage() {
  const [loginOpen, setLoginOpen] = useState(false)

  return (
    <div className="h-full overflow-y-auto scroll-smooth bg-[#0a0f1c] text-slate-200">
      {/* reactive cyber-grid backdrop */}
      <CyberGridCanvas />

      {/* ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      {/* nav */}
      <nav className="glass-strong sticky top-4 z-30 mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
        <span className="flex items-center gap-2">
          <Radio className="h-6 w-6 text-sky-400" />
          <span className="text-sm font-bold tracking-widest text-white">FLEETVIEW</span>
        </span>
        <div className="ml-auto hidden items-center gap-6 text-xs text-slate-300 sm:flex">
          <a href="#showcase" className="hover:text-white">Showcase</a>
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#roi" className="hover:text-white">ROI</a>
          <a href="#pricing" className="hover:text-white">Pricing</a>
        </div>
        <motion.a
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          href="#contact"
          className="btn-glow rounded-lg px-4 py-2 text-xs font-semibold text-white"
        >
          Request Demo
        </motion.a>
        <button
          onClick={() => setLoginOpen(true)}
          title="Staff only"
          className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400 transition hover:border-white/20 hover:text-slate-200"
        >
          <Lock className="h-3 w-3" /> Dispetcher kirishi
        </button>
      </nav>

      {/* hero */}
      <section className="relative mx-auto max-w-6xl px-6 pb-24 pt-24 text-center">
        <motion.div {...fadeUp}>
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-4 py-1.5 text-xs text-sky-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" />
              <span className="relative h-2 w-2 rounded-full bg-sky-400" />
            </span>
            22 trucks live on our reference fleet right now
          </span>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight text-white sm:text-6xl">
            See your entire fleet.
            <span className="bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent">
              {' '}Every two seconds.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-slate-400 sm:text-lg">
            FleetView is the B2B telematics platform for heavy-cargo operators: live GPS on a 3D
            map, geofence enforcement, instant alerts, and full route replay — built on an
            enterprise Spring Boot + PostGIS core.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <motion.a
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              href="#contact"
              className="btn-glow group flex items-center gap-2 rounded-xl px-8 py-4 text-sm font-semibold text-white"
            >
              Get Started — Request a Demo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              href="#showcase"
              className="glass px-8 py-4 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
            >
              Try the live simulation
            </motion.a>
          </div>
        </motion.div>

        {/* hero stat strip */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="glass mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-6 p-6 sm:grid-cols-4"
        >
          {[
            ['2 s', 'telemetry cadence'],
            ['< 100 ms', 'alert latency'],
            ['99.9%', 'uptime SLA'],
            ['5×', 'route replay speed'],
          ].map(([v, l]) => (
            <div key={l}>
              <div className="font-mono text-2xl font-bold text-white">{v}</div>
              <div className="mt-1 text-[11px] uppercase tracking-wider text-slate-400">{l}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* interactive fleet simulator */}
      <section id="showcase" className="relative mx-auto max-w-6xl scroll-mt-24 px-6 pb-24">
        <motion.div {...fadeUp} className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-white">Fleet Management Showcase</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-400">
            Don’t take our word for it — drive the fleet yourself. Speed the trucks up, breach a
            geofence, and watch the packet and alert counters react exactly like the real
            dispatcher console does.
          </p>
        </motion.div>
        <motion.div {...fadeUp}>
          <MiniFleetSim />
        </motion.div>
        <motion.p {...fadeUp} className="mt-8 text-center text-sm text-slate-400">
          Want the full experience on your own fleet data?{' '}
          <a href="#contact" className="font-semibold text-sky-400 hover:underline">
            Request a guided demo →
          </a>
        </motion.p>
      </section>

      {/* features */}
      <section id="features" className="relative mx-auto max-w-6xl scroll-mt-24 px-6 pb-24">
        <motion.div {...fadeUp} className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-white">Everything a dispatch floor needs</h2>
          <p className="mt-3 text-slate-400">
            One console for tracking, enforcement, and after-the-fact investigation.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              {...fadeUp}
              {...hoverLift}
              transition={{ duration: 0.45, delay: (i % 3) * 0.08 }}
              className="glass p-6 transition-colors hover:border-emerald-500/30 hover:bg-white/[0.07]"
            >
              <div className="mb-4 inline-flex rounded-xl bg-sky-500/15 p-2.5">
                <f.icon className="h-5 w-5 text-sky-400" />
              </div>
              <h3 className="mb-2 text-sm font-semibold text-white">{f.title}</h3>
              <p className="text-[13px] leading-relaxed text-slate-400">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ROI calculator */}
      <section id="roi" className="relative mx-auto max-w-5xl scroll-mt-24 px-6 pb-24">
        <motion.div {...fadeUp} className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-white">What’s FleetView worth to you?</h2>
          <p className="mt-3 text-slate-400">
            Two sliders. Your monthly savings, live.
          </p>
        </motion.div>
        <motion.div {...fadeUp}>
          <RoiCalculator />
        </motion.div>
      </section>

      {/* pricing */}
      <section id="pricing" className="relative mx-auto max-w-6xl scroll-mt-24 px-6 pb-24">
        <motion.div {...fadeUp} className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-white">Enterprise pricing, fleet-sized</h2>
          <p className="mt-3 text-slate-400">Per-fleet plans. No per-seat surprises.</p>
        </motion.div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {PLANS.map((p, i) => (
            <motion.div
              key={p.name}
              {...fadeUp}
              {...hoverLift}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className={`relative flex flex-col p-7 ${
                p.highlight ? 'glass-neon' : 'glass'
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  Most popular
                </span>
              )}
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                {p.name}
              </h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">{p.price}</span>
                <span className="text-sm text-slate-400">{p.unit}</span>
              </div>
              <div className="mt-1 text-xs text-slate-400">{p.tagline}</div>
              <ul className="mt-6 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13px] text-slate-300">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#contact"
                className={`mt-7 rounded-xl px-5 py-2.5 text-center text-sm font-semibold transition ${
                  p.highlight
                    ? 'btn-glow text-white'
                    : 'bg-white/[0.06] text-slate-200 hover:bg-white/10'
                }`}
              >
                {p.price === 'Custom' ? 'Contact sales' : 'Request a demo'}
              </a>
            </motion.div>
          ))}
        </div>
      </section>

      {/* contact — primary CTA target */}
      <section id="contact" className="relative mx-auto max-w-3xl scroll-mt-24 px-6 pb-24">
        <motion.div {...fadeUp} className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-white">Demo so‘rovi qoldirish</h2>
          <p className="mt-3 text-slate-400">
            Request a demo or a B2B partnership call — integrations, white-label deployments, or a
            fleet onboarding pilot. Tell us what you move and where.
          </p>
        </motion.div>
        <motion.div {...fadeUp}>
          <ContactForm />
        </motion.div>
      </section>

      {/* footer */}
      <footer className="relative border-t border-white/5 py-10 text-center text-xs text-slate-500">
        <div className="flex items-center justify-center gap-2 text-slate-400">
          <Radio className="h-4 w-4 text-sky-400" />
          <span className="font-bold tracking-widest">FLEETVIEW</span>
        </div>
        <p className="mt-3">
          Demo platform · Spring Boot + PostGIS + React ·{' '}
          <button onClick={() => setLoginOpen(true)} className="text-slate-400 hover:text-slate-200">
            Staff login
          </button>
        </p>
      </footer>

      <AnimatePresence>
        {loginOpen && <StaffLoginModal onClose={() => setLoginOpen(false)} />}
      </AnimatePresence>
    </div>
  )
}
