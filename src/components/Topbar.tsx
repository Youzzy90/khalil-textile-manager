import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Menu, Bell } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Colis, Client, Destinataire, Livreur } from '../types/db'

interface Result {
  type: 'colis' | 'client' | 'destinataire' | 'livreur'
  label: string
  sub: string
  to: string
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [open, setOpen] = useState(false)
  const [alerts, setAlerts] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    supabase.from('alerte').select('id', { count: 'exact', head: true })
      .eq('acquittee', false).then(({ count }) => setAlerts(count ?? 0))
  }, [])

  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); return }
    const term = `%${q.trim()}%`
    let cancelled = false
    ;(async () => {
      const [c, cl, d, l] = await Promise.all([
        supabase.from('colis').select('id,code,statut,ville_destination,client:client(nom_complet)')
          .or(`code.ilike.${term},ville_destination.ilike.${term}`).limit(5),
        supabase.from('client').select('id,nom_complet,telephone,ville')
          .or(`nom_complet.ilike.${term},telephone.ilike.${term},ville.ilike.${term}`).limit(5),
        supabase.from('destinataire').select('id,nom_complet,telephone,ville')
          .or(`nom_complet.ilike.${term},telephone.ilike.${term}`).limit(5),
        supabase.from('livreur').select('id,nom_complet,telephone')
          .or(`nom_complet.ilike.${term},telephone.ilike.${term}`).limit(5),
      ])
      if (cancelled) return
      const r: Result[] = []
      ;(c.data as Colis[] | null)?.forEach(x => r.push({
        type: 'colis', label: x.code, sub: x.ville_destination,
        to: `/colis/${x.id}`,
      }))
      ;(cl.data as Client[] | null)?.forEach(x => r.push({
        type: 'client', label: x.nom_complet, sub: x.telephone,
        to: `/clients?id=${x.id}`,
      }))
      ;(d.data as Destinataire[] | null)?.forEach(x => r.push({
        type: 'destinataire', label: x.nom_complet, sub: x.telephone,
        to: `/destinataires?id=${x.id}`,
      }))
      ;(l.data as Livreur[] | null)?.forEach(x => r.push({
        type: 'livreur', label: x.nom_complet, sub: x.telephone,
        to: `/livreurs?id=${x.id}`,
      }))
      setResults(r.slice(0, 12))
    })()
    return () => { cancelled = true }
  }, [q])

  function go(r: Result) {
    setOpen(false); setQ('')
    navigate(r.to)
  }

  return (
    <header className="sticky top-0 z-20 h-14 bg-bg-base/95 backdrop-blur border-b border-border flex items-center px-4 gap-3">
      <button onClick={onMenu} className="md:hidden btn-ghost p-1.5"><Menu size={20} /></button>

      <div ref={boxRef} className="relative flex-1 max-w-xl">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          className="input pl-9 w-full"
          placeholder="Rechercher colis, client, destinataire, livreur…"
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
        />
        {open && results.length > 0 && (
          <div className="absolute top-full mt-2 w-full card p-1.5 animate-scaleIn z-30">
            {results.map((r, i) => (
              <button key={i} onClick={() => go(r)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-bg-hover text-left">
                <span className="text-[10px] uppercase tracking-wider text-gold-500 font-semibold w-16">{r.type}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-text-primary truncate">{r.label}</div>
                  <div className="text-xs text-text-muted truncate">{r.sub}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <button className="btn-ghost p-2 relative" title="Alertes">
        <Bell size={18} />
        {alerts > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-danger-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
            {alerts > 99 ? '99+' : alerts}
          </span>
        )}
      </button>
    </header>
  )
}
