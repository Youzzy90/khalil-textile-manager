import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Menu, Bell, Package, Users, MapPin, Truck, CornerDownLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Colis, Client, Destinataire, Livreur } from '../types/db'

interface Result {
  type: 'colis' | 'client' | 'destinataire' | 'livreur'
  label: string
  sub: string
  to: string
}

const TYPE_ICON = {
  colis: Package, client: Users, destinataire: MapPin, livreur: Truck,
}
const TYPE_LABEL = {
  colis: 'Colis', client: 'Client', destinataire: 'Destinataire', livreur: 'Livreur',
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [open, setOpen] = useState(false)
  const [alerts, setAlerts] = useState(0)
  const [activeIdx, setActiveIdx] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
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
      ;(c.data as Colis[] | null)?.forEach(x => r.push({ type: 'colis', label: x.code, sub: x.ville_destination, to: `/colis/${x.id}` }))
      ;(cl.data as Client[] | null)?.forEach(x => r.push({ type: 'client', label: x.nom_complet, sub: x.telephone, to: `/clients?id=${x.id}` }))
      ;(d.data as Destinataire[] | null)?.forEach(x => r.push({ type: 'destinataire', label: x.nom_complet, sub: x.telephone, to: `/destinataires?id=${x.id}` }))
      ;(l.data as Livreur[] | null)?.forEach(x => r.push({ type: 'livreur', label: x.nom_complet, sub: x.telephone, to: `/livreurs?id=${x.id}` }))
      setResults(r.slice(0, 8))
      setActiveIdx(0)
    })()
    return () => { cancelled = true }
  }, [q])

  function go(r: Result) { setOpen(false); setQ(''); navigate(r.to) }

  function onKey(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); go(results[activeIdx]) }
    else if (e.key === 'Escape') setOpen(false)
  }

  return (
    <header className="sticky top-0 z-20 h-16 glass border-b border-border flex items-center px-4 gap-3">
      <button onClick={onMenu} className="md:hidden btn-ghost p-1.5"><Menu size={20} /></button>

      <div ref={boxRef} className="relative flex-1 max-w-xl">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          ref={inputRef}
          className="input pl-10 pr-16 w-full bg-bg-soft/80"
          placeholder="Rechercher colis, client, destinataire…"
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-text-muted bg-bg-hover px-1.5 py-0.5 rounded border border-border font-mono hidden md:block">⌘K</kbd>
        {open && results.length > 0 && (
          <div className="absolute top-full mt-2 w-full card p-1.5 animate-scaleIn z-30 shadow-float">
            <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-text-muted font-semibold">Résultats</div>
            {results.map((r, i) => {
              const Icon = TYPE_ICON[r.type]
              return (
                <button key={i} onClick={() => go(r)}
                  onMouseEnter={() => setActiveIdx(i)}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-colors
                    ${activeIdx === i ? 'bg-gold-500/10' : 'hover:bg-bg-hover'}`}>
                  <span className="shrink-0 p-1.5 rounded-md bg-bg-hover text-text-secondary">
                    <Icon size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-text-primary truncate">{r.label}</div>
                    <div className="text-xs text-text-muted truncate">{r.sub}</div>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium shrink-0">{TYPE_LABEL[r.type]}</span>
                </button>
              )
            })}
            <div className="flex items-center justify-between px-2.5 py-1.5 mt-1 border-t border-border-soft">
              <span className="text-[10px] text-text-muted flex items-center gap-1"><CornerDownLeft size={10} /> pour ouvrir</span>
              <span className="text-[10px] text-text-muted">↑↓ naviguer</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button className="btn-ghost p-2 relative group" title="Alertes">
          <Bell size={18} />
          {alerts > 0 && (
            <span className="absolute top-1 right-1 bg-danger-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center animate-pulseGold ring-2 ring-bg-base">
              {alerts > 99 ? '99+' : alerts}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
