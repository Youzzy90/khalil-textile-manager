import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Filter, X, Package } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PageHeader } from '../components/PageHeader'
import { DataTable, Column } from '../components/DataTable'
import { StatusBadge } from '../components/StatusBadge'
import { EmptyState } from '../components/feedback'
import { formatMontant, formatDate } from '../lib/format'
import { STATUT_LABELS } from '../lib/labels'
import type { Colis, ColisStatut, Livreur } from '../types/db'

const STATUTS: ColisStatut[] = ['RECU', 'EXPEDIE', 'EN_LIVRAISON', 'LIVRE', 'RETOURNE', 'ANNULE']

export function ColisListPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<Colis[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filtres, setFiltres] = useState<{ statuts: ColisStatut[]; ville: string; livreurId: string }>({
    statuts: [], ville: '', livreurId: '',
  })
  const [villes, setVilles] = useState<string[]>([])
  const [livreurs, setLivreurs] = useState<Livreur[]>([])

  useEffect(() => {
    supabase.from('ville').select('nom').order('nom').then(({ data }) =>
      setVilles((data ?? []).map(v => v.nom)))
    supabase.from('livreur').select('id,nom_complet').eq('supprime', false).order('nom_complet')
      .then(({ data }) => setLivreurs((data as Livreur[]) ?? []))
    load()
  }, [])

  async function load() {
    setLoading(true)
    let q = supabase.from('colis').select(`
      id,code,statut,montant,montant_paye,paye,priorite,ville_destination,date_reception,
      client:client(id,nom_complet,telephone,ville),
      destinataire:destinataire(id,nom_complet,telephone,ville),
      livreur:livreur(id,nom_complet)
    `).eq('supprime', false)

    if (filtres.statuts.length > 0) q = q.in('statut', filtres.statuts)
    if (filtres.ville) q = q.eq('ville_destination', filtres.ville)
    if (filtres.livreurId) q = q.eq('livreur_id', filtres.livreurId)

    q = q.order('date_reception', { ascending: false }).limit(500)
    const { data, error } = await q
    if (error) { console.error(error); setRows([]) }
    else setRows((data as unknown as Colis[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [filtres])

  const filtered = useMemo(() => {
    if (!search.trim()) return rows
    const t = search.toLowerCase()
    return rows.filter(r =>
      r.code.toLowerCase().includes(t) ||
      r.client?.nom_complet?.toLowerCase().includes(t) ||
      r.destinataire?.nom_complet?.toLowerCase().includes(t) ||
      r.ville_destination.toLowerCase().includes(t) ||
      r.client?.telephone?.includes(t) ||
      r.destinataire?.telephone?.includes(t),
    )
  }, [rows, search])

  function toggleStatut(s: ColisStatut) {
    setFiltres(f => ({
      ...f,
      statuts: f.statuts.includes(s) ? f.statuts.filter(x => x !== s) : [...f.statuts, s],
    }))
  }

  const columns: Column<Colis>[] = [
    { key: 'code', header: 'Code', sortValue: r => r.code, render: r => <span className="font-mono text-gold-500 font-medium">{r.code}</span> },
    { key: 'statut', header: 'Statut', sortValue: r => r.statut, render: r => <StatusBadge statut={r.statut} /> },
    { key: 'client', header: 'Expéditeur', sortValue: r => r.client?.nom_complet ?? '', render: r => <span className="text-text-primary">{r.client?.nom_complet ?? '—'}</span> },
    { key: 'destinataire', header: 'Destinataire', sortValue: r => r.destinataire?.nom_complet ?? '', render: r => <span>{r.destinataire?.nom_complet ?? '—'}</span> },
    { key: 'ville', header: 'Ville', sortValue: r => r.ville_destination, render: r => r.ville_destination },
    { key: 'montant', header: 'Montant', sortValue: r => r.montant, render: r => <span className="font-mono">{formatMontant(r.montant)}</span> },
    { key: 'paye', header: 'Payé', sortValue: r => (r.paye ? 1 : 0), render: r => r.paye
      ? <span className="badge bg-success-100/20 text-success-300 border border-success-500/30">Payé</span>
      : <span className="badge bg-warning-100/20 text-warning-300 border border-warning-500/30">Impayé</span> },
    { key: 'livreur', header: 'Livreur', sortValue: r => r.livreur?.nom_complet ?? 'zzz', render: r => r.livreur?.nom_complet ?? <span className="text-text-muted">Non affecté</span> },
    { key: 'date', header: 'Date', sortValue: r => r.date_reception, render: r => formatDate(r.date_reception) },
  ]

  return (
    <div>
      <PageHeader
        title="Colis"
        subtitle={`${filtered.length} colis${filtres.statuts.length ? ` — ${filtres.statuts.map(s => STATUT_LABELS[s]).join(', ')}` : ''}`}
        search={{ value: search, onChange: setSearch, placeholder: 'Code, nom, téléphone, ville…' }}
        onAdd={() => navigate('/colis/nouveau')}
        addLabel="Nouveau colis"
        actions={
          <button onClick={() => setShowFilters(s => !s)} className={showFilters ? 'btn-secondary' : 'btn-ghost'}>
            <Filter size={16} /> Filtres
          </button>
        }
      />

      <div className="flex gap-4">
        {showFilters && (
          <aside className="w-64 shrink-0 card p-4 h-fit sticky top-20 animate-slideInRight">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Filtres</h3>
              <button onClick={() => setFiltres({ statuts: [], ville: '', livreurId: '' })} className="text-xs text-text-muted hover:text-text-primary">Réinitialiser</button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="label">Statut</div>
                <div className="flex flex-wrap gap-1.5">
                  {STATUTS.map(s => (
                    <button key={s} onClick={() => toggleStatut(s)}
                      className={`badge cursor-pointer transition ${filtres.statuts.includes(s) ? 'bg-gold-500/20 text-gold-500 border border-gold-500/40' : 'bg-bg-soft text-text-secondary border border-border hover:border-gold-500/30'}`}>
                      {STATUT_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="label">Ville destination</div>
                <select className="input" value={filtres.ville} onChange={e => setFiltres(f => ({ ...f, ville: e.target.value }))}>
                  <option value="">Toutes</option>
                  {villes.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <div>
                <div className="label">Livreur</div>
                <select className="input" value={filtres.livreurId} onChange={e => setFiltres(f => ({ ...f, livreurId: e.target.value }))}>
                  <option value="">Tous</option>
                  {livreurs.map(l => <option key={l.id} value={l.id}>{l.nom_complet}</option>)}
                </select>
              </div>
            </div>
          </aside>
        )}

        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="card"><div className="py-20 text-center text-text-muted">Chargement…</div></div>
          ) : filtered.length === 0 ? (
            <div className="card">
              <EmptyState icon={<Package size={28} />} title="Aucun colis"
                message="Aucun colis ne correspond à vos critères. Créez votre premier colis pour commencer."
                action={<button onClick={() => navigate('/colis/nouveau')} className="btn-primary"><Plus size={16} /> Nouveau colis</button>} />
            </div>
          ) : (
            <div className="card overflow-hidden">
              <DataTable columns={columns} rows={filtered} rowKey={r => r.id}
                onRowClick={r => navigate(`/colis/${r.id}`)}
                initialSort={{ key: 'date', dir: 'desc' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
