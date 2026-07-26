import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Printer } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PageHeader } from '../components/PageHeader'
import { DataTable, Column } from '../components/DataTable'
import { formatMontant, formatDateTime } from '../lib/format'
import { MOYEN_LABELS } from '../lib/labels'
import type { Paiement } from '../types/db'

export function PaiementsPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<Paiement[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [periode, setPeriode] = useState<'jour' | 'semaine' | 'mois' | 'tout'>('mois')

  useEffect(() => { load() }, [periode])

  async function load() {
    setLoading(true)
    let q = supabase.from('paiement').select(`*,colis:colis(code,client_id)`).order('date_paiement', { ascending: false })
    const now = new Date()
    if (periode === 'jour') { const d = new Date(); d.setHours(0, 0, 0, 0); q = q.gte('date_paiement', d.toISOString()) }
    if (periode === 'semaine') { const d = new Date(); d.setDate(d.getDate() - 7); q = q.gte('date_paiement', d.toISOString()) }
    if (periode === 'mois') { const d = new Date(); d.setMonth(d.getMonth() - 1); q = q.gte('date_paiement', d.toISOString()) }
    const { data } = await q.limit(500)
    setRows((data as Paiement[]) ?? [])
    setLoading(false)
  }

  const filtered = rows.filter(r => !search || r.numero_recu.toLowerCase().includes(search.toLowerCase()) || (r.colis?.code ?? '').toLowerCase().includes(search.toLowerCase()) || (r.reference ?? '').toLowerCase().includes(search.toLowerCase()))

  const total = filtered.filter(r => !r.rembourse).reduce((s, r) => s + Number(r.montant), 0)

  const columns: Column<Paiement>[] = [
    { key: 'recu', header: 'N° reçu', sortValue: r => r.numero_recu, render: r => <span className="font-mono text-gold-500">{r.numero_recu}</span> },
    { key: 'date', header: 'Date', sortValue: r => r.date_paiement, render: r => formatDateTime(r.date_paiement) },
    { key: 'colis', header: 'Colis', sortValue: r => r.colis?.code ?? '', render: r => <button onClick={() => navigate(`/colis/${r.colis_id}`)} className="font-mono text-gold-500 hover:underline">{r.colis?.code}</button> },
    { key: 'montant', header: 'Montant', sortValue: r => r.montant, render: r => <span className="font-mono font-semibold">{formatMontant(r.montant)}</span> },
    { key: 'moyen', header: 'Moyen', sortValue: r => r.moyen, render: r => <span className="badge bg-bg-soft text-text-secondary border border-border">{MOYEN_LABELS[r.moyen]}</span> },
    { key: 'ref', header: 'Référence', render: r => <span className="font-mono text-xs text-text-secondary">{r.reference ?? '—'}</span> },
    { key: 'statut', header: 'Statut', sortValue: r => r.rembourse ? 1 : 0, render: r => r.rembourse
      ? <span className="badge bg-danger-100/20 text-danger-300 border border-danger-500/30">Remboursé</span>
      : <span className="badge bg-success-100/20 text-success-300 border border-success-500/30">Actif</span> },
  ]

  return (
    <div>
      <PageHeader title="Paiements" subtitle={`${filtered.length} paiements — Total ${formatMontant(total)}`} search={{ value: search, onChange: setSearch, placeholder: 'N° reçu, colis, référence…' }} />
      <div className="flex gap-2 mb-4">
        {(['jour', 'semaine', 'mois', 'tout'] as const).map(p => (
          <button key={p} onClick={() => setPeriode(p)} className={periode === p ? 'btn-secondary' : 'btn-ghost'}>
            {p === 'jour' ? 'Aujourd\'hui' : p === 'semaine' ? '7 jours' : p === 'mois' ? '30 jours' : 'Tout'}
          </button>
        ))}
      </div>
      {loading ? <div className="card py-20 text-center text-text-muted">Chargement…</div> :
        rows.length === 0 ? (
          <div className="card"><div className="py-16 text-center"><CreditCard className="mx-auto text-text-muted mb-3" size={28} /><div className="font-semibold">Aucun paiement</div><div className="text-sm text-text-secondary mt-1">Les paiements encaissés apparaîtront ici.</div></div></div>
        ) : <div className="card overflow-hidden"><DataTable columns={columns} rows={filtered} rowKey={r => r.id} /></div>
      }
    </div>
  )
}
