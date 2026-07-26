import { ReactNode, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-text-secondary gap-3">
      <Loader2 size={28} className="animate-spin text-gold-500" />
      {label && <div className="text-sm">{label}</div>}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, message, action }: {
  icon: ReactNode; title: string; message?: string; action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-3 rounded-xl bg-bg-hover text-text-muted mb-3">{Icon}</div>
      <div className="text-base font-semibold text-text-primary">{title}</div>
      {message && <div className="text-sm text-text-secondary mt-1 max-w-md">{message}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): {
  data: T | null; loading: boolean; error: string | null; reload: () => void
} {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let alive = true
    setLoading(true); setError(null)
    fn().then(d => { if (alive) { setData(d); setLoading(false) } })
      .catch(e => { if (alive) { setError(e.message ?? String(e)); setLoading(false) } })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  return { data, loading, error, reload: () => setTick(t => t + 1) }
}
