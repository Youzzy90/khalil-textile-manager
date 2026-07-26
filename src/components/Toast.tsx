import { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export type ToastKind = 'success' | 'error' | 'info'
export interface Toast { id: number; kind: ToastKind; message: string }

let counter = 0
let pushExternal: ((kind: ToastKind, message: string) => void) | null = null

export function toast(kind: ToastKind, message: string) {
  pushExternal?.(kind, message)
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    pushExternal = (kind, message) => {
      const id = ++counter
      setToasts(t => [...t, { id, kind, message }])
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500)
    }
    return () => { pushExternal = null }
  }, [])

  function remove(id: number) { setToasts(t => t.filter(x => x.id !== id)) }

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 w-80 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id}
          className={`card flex items-start gap-3 p-3.5 animate-slideInRight pointer-events-auto
            ${t.kind === 'success' ? 'border-success-500/40' : t.kind === 'error' ? 'border-danger-500/40' : 'border-info-500/40'}`}>
          {t.kind === 'success' && <CheckCircle2 size={18} className="text-success-500 shrink-0 mt-0.5" />}
          {t.kind === 'error' && <AlertCircle size={18} className="text-danger-500 shrink-0 mt-0.5" />}
          {t.kind === 'info' && <Info size={18} className="text-info-500 shrink-0 mt-0.5" />}
          <div className="text-sm text-text-primary flex-1">{t.message}</div>
          <button onClick={() => remove(t.id)} className="text-text-muted hover:text-text-primary"><X size={14} /></button>
        </div>
      ))}
    </div>
  )
}
