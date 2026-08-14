import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'

// The console pulls in MapLibre + Recharts (~1.4 MB) — split it out so the
// marketing page ships only a lightweight chunk.
const DashboardPage = lazy(() => import('./pages/DashboardPage'))

function ConsoleLoader() {
  return (
    <div className="flex h-full items-center justify-center bg-[#0a0f1c]">
      <div className="glass-strong flex items-center gap-3 px-6 py-4 text-sm text-slate-300">
        <span className="h-2 w-2 animate-ping rounded-full bg-sky-400" />
        Loading dispatcher console…
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/dashboard"
          element={
            <Suspense fallback={<ConsoleLoader />}>
              <DashboardPage />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
