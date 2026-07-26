import { useEffect, useState } from 'react'
import { Plus, TrendingUp, TrendingDown, Wallet, BarChart3, LineChart as LineChartIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { logActivite, genererNumeroEcriture } from '../lib/audit'
import { PageHeader } from '../components/PageHeader'
import { DataTable, Column } from '../components/DataTable'
import { Modal } from '../components/Modal'
import { StatCard } from '../components/StatCard'
import { toast } from '../components/Toast'
import { formatMontant, formatDate } from '../lib/format'
import { CATEGORIES_CHARGE } from '../lib/labels'
import type { EcritureComptable, Charge } from '../types/db'

export function ComptabilitePage() {
  const { utilisateur } = useAuth()
  const [rows, setRows] = useState<EcritureComptable[]>([])
  const [loading, setLoading] = useState(true)
  const [periode, setPeriode] = useState<'jour' | 'semaine' | 'mois' | 'annee' | 'tout'>('mois')
  const [showCharge, setShowCharge] = useState(false)
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), categorie: 'CHARGE_CARBURANT', libelle: '', montant: '', moyen: 'ESPECES', beneficiaire: '', notes: '' })

  useEffect(() => { load() }, [periode])

  async function load() {
    setLoading(true)
    let q = supabase.from('ecriture_comptable').select('*').eq('supprime', false).order('date_ecriture', { ascending: false })
    const now = new Date()
    if (periode === 'jour') { const d = new Date(); d.setHours(0, 0, 0, 0); q = q.gte('date_ecriture', d.toISOString()) }
    if (periode === 'semaine') { const d = new Date(); d.setDate(d.getDate() - 7); q = q.gte('date_ecriture', d.toISOString()) }
    if (periode === 'mois') { const d = new Date(); d.setMonth(d.getMonth() - 1); q = q.gte('date_ecriture', d.toISOString()) }
    if (periode === 'annee') { const d = new Date(); d.setFullYear(d.getFullYear() - 1); q = q.gte('date_ecriture', d.toISOString()) }
    const { data } = await q.limit(1000)
    setRows((data as EcritureComptable[]) ?? [])
    setLoading(false)
  }

  async function saveCharge() {
    if (!utilisateur) return
    if (!form.libelle.trim() || !form.montant || Number(form.montant) <= 0) { toast('error', 'Libellé et montant requis.'); return }
    const numEcr = await genererNumeroEcriture()
    const { data: c, error: e1 } = await supabase.from('charge').insert({
      date: form.date, categorie: form.categorie, libelle: form.libelle, montant: Number(form.montant),
      moyen: form.moyen, beneficiaire: form.beneficiaire || null, notes: form.notes || null,
      utilisateur_id: utilisateur.id,
    }).select().single()
    if (e1) { toast('error', e1.message); return }
    const charge = c as Charge
    const { error: e2 } = await supabase.from('ecriture_comptable').insert({
      numero: numEcr, sens: 'SORTIE', categorie: form.categorie, libelle: form.libelle,
      montant: Number(form.montant), moyen: form.moyen, charge_id: charge.id,
      utilisateur_id: utilisateur.id, automatique: true,
    })
    if (e2) { toast('error', e2.message); return }
    await logActivite(utilisateur, 'COMPTA', 'CHARGE_CREATE', { type: 'charge', id: charge.id }, { montant: form.montant })
    toast('success', 'Charge enregistrée.')
    setShowCharge(false)
    setForm({ date: new Date().toISOString().slice(0, 10), categorie: 'CHARGE_CARBURANT', libelle: '', montant: '', moyen: 'ESPECES', beneficiaire: '', notes: '' })
    load()
  }

  const recettes = rows.filter(r => r.sens === 'ENTREE').reduce((s, r) => s + Number(r.montant), 0)
  const charges = rows.filter(r => r.sens === 'SORTIE').reduce((s, r) => s + Number(r.montant), 0)
  const benefice = recettes - charges

  const parCategorie = new Map<string, number>()
  rows.filter(r => r.sens === 'SORTIE').forEach(r => parCategorie.set(r.categorie, (parCategorie.get(r.categorie) ?? 0) + Number(r.montant)))

  const columns: Column<EcritureComptable>[] = [
    { key: 'num', header: 'N°', sortValue: r => r.numero, render: r => <span className="font-mono text-xs text-gold-500">{r.numero}</span> },
    { key: 'date', header: 'Date', sortValue: r => r.date_ecriture, render: r => formatDate(r.date_ecriture, true) },
    { key: 'sens', header: 'Sens', sortValue: r => r.sens, render: r => r.sens === 'ENTREE'
      ? <span className="badge bg-success-100/20 text-success-300 border border-success-500/30"><TrendingUp size={12} /> Entrée</span>
      : <span className="badge bg-danger-100/20 text-danger-300 border border-danger-500/30"><TrendingDown size={12} /> Sortie</span> },
    { key: 'cat', header: 'Catégorie', sortValue: r => r.categorie, render: r => <span className="text-xs">{r.categorie.replace('CHARGE_', '').replace('RECETTE_', '').replace('_', ' ')}</span> },
    { key: 'lib', header: 'Libellé', render: r => r.libelle },
    { key: 'montant', header: 'Montant', sortValue: r => r.montant, render: r => <span className={`font-mono font-semibold ${r.sens === 'ENTREE' ? 'text-success-500' : 'text-danger-500'}`}>{r.sens === 'ENTREE' ? '+' : '−'} {formatMontant(r.montant)}</span> },
    { key: 'auto', header: 'Type', sortValue: r => r.automatique ? 1 : 0, render: r => r.automatique ? <span className="text-xs text-text-muted">Auto</span> : <span className="text-xs text-text-secondary">Manuel</span> },
  ]

  return (
    <div>
      <PageHeader title="Comptabilité" subtitle="Journal comptable et analyse financière"
        actions={
          <button onClick={() => setShowCharge(true)} className="btn-primary"><Plus size={16} /> Nouvelle charge</button>
        } />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <StatCard label="Recettes" value={formatMontant(recettes)} icon={TrendingUp} accent />
        <StatCard label="Charges" value={formatMontant(charges)} icon={TrendingDown} />
        <StatCard label="Bénéfice" value={formatMontant(benefice)} icon={Wallet} accent />
      </div>

      {(() => {
        const jours: { jour: string; entrees: number; sorties: number }[] = []
        const map = new Map<string, { entrees: number; sorties: number }>()
        rows.forEach(r => {
          const d = new Date(r.date_ecriture)
          const key = d.toISOString().slice(0, 10)
          if (!map.has(key)) map.set(key, { entrees: 0, sorties: 0 })
          const v = map.get(key)!
          if (r.sens === 'ENTREE') v.entrees += Number(r.montant); else v.sorties += Number(r.montant)
        })
        const sorted = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-14)
        sorted.forEach(([key, v]) => {
          const d = new Date(key)
          jours.push({ jour: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }), entrees: v.entrees, sorties: v.sorties })
        })
        const maxVal = Math.max(...jours.map(j => Math.max(j.entrees, j.sorties)), 1)
        if (jours.length === 0) return null
        return (
          <div className="card p-5 mb-4 animate-fadeIn">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><LineChartIcon size={16} className="text-gold-500" /> Évolution des entrées / sorties (14 derniers jours)</h3>
            <div className="flex items-end gap-1.5 h-44 relative">
              {jours.map((j, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="flex-1 flex items-end gap-0.5 w-full justify-center">
                    <div className="relative w-1/2 max-w-[14px] bg-success-500/20 rounded-t-sm overflow-hidden flex items-end">
                      <div className="w-full bg-success-500 rounded-t-sm transition-all duration-500 group-hover:brightness-125" style={{ height: `${Math.max((j.entrees / maxVal) * 100, 2)}%` }} title={`Entrées: ${formatMontant(j.entrees)}`} />
                    </div>
                    <div className="relative w-1/2 max-w-[14px] bg-danger-500/20 rounded-t-sm overflow-hidden flex items-end">
                      <div className="w-full bg-danger-500 rounded-t-sm transition-all duration-500 group-hover:brightness-125" style={{ height: `${Math.max((j.sorties / maxVal) * 100, 2)}%` }} title={`Sorties: ${formatMontant(j.sorties)}`} />
                    </div>
                  </div>
                  <span className="text-[9px] text-text-muted">{j.jour}</span>
                  <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-bg-elevated border border-border rounded-md px-2 py-1 text-[10px] whitespace-nowrap z-10 shadow-float">
                    <span className="text-success-500">+{formatMontant(j.entrees)}</span> · <span className="text-danger-500">−{formatMontant(j.sorties)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-4 mt-3 text-xs text-text-muted">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-success-500 rounded-sm" /> Entrées</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-danger-500 rounded-sm" /> Sorties</span>
            </div>
          </div>
        )
      })()}

      <div className="flex gap-2 mb-4">
        {(['jour', 'semaine', 'mois', 'annee', 'tout'] as const).map(p => (
          <button key={p} onClick={() => setPeriode(p)} className={periode === p ? 'btn-secondary' : 'btn-ghost'}>
            {p === 'jour' ? 'Aujourd\'hui' : p === 'semaine' ? '7 jours' : p === 'mois' ? '30 jours' : p === 'annee' ? 'Année' : 'Tout'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card overflow-hidden">
          {loading ? <div className="py-20 text-center text-text-muted">Chargement…</div> :
            <DataTable columns={columns} rows={rows} rowKey={r => r.id} pageSize={25} />
          }
        </div>
        <div className="card p-4 h-fit">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><BarChart3 size={16} className="text-gold-500" /> Charges par catégorie</h3>
          <div className="space-y-2">
            {parCategorie.size === 0 ? <div className="text-sm text-text-muted py-4 text-center">Aucune charge</div> :
              Array.from(parCategorie.entries()).sort((a, b) => b[1] - a[1]).map(([cat, m]) => {
                const label = CATEGORIES_CHARGE.find(c => c.value === cat)?.label ?? cat.replace('CHARGE_', '').replace('_', ' ')
                const pct = charges > 0 ? (m / charges) * 100 : 0
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-1"><span className="text-text-secondary">{label}</span><span className="font-mono">{formatMontant(m)}</span></div>
                    <div className="h-1.5 bg-bg-soft rounded-full overflow-hidden"><div className="h-full bg-gold-500/70" style={{ width: `${pct}%` }} /></div>
                  </div>
                )
              })
            }
          </div>
        </div>
      </div>

      <Modal open={showCharge} onClose={() => setShowCharge(false)} title="Nouvelle charge"
        footer={<><button onClick={() => setShowCharge(false)} className="btn-ghost">Annuler</button><button onClick={saveCharge} className="btn-primary">Enregistrer</button></>}>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Date</label><input type="date" className="input" value={form.date} onChange={e => setForm(s => ({ ...s, date: e.target.value }))} /></div>
          <div><label className="label">Catégorie</label><select className="input" value={form.categorie} onChange={e => setForm(s => ({ ...s, categorie: e.target.value }))}>
            {CATEGORIES_CHARGE.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select></div>
          <div className="col-span-2"><label className="label">Libellé *</label><input className="input" value={form.libelle} onChange={e => setForm(s => ({ ...s, libelle: e.target.value }))} /></div>
          <div><label className="label">Montant *</label><input type="number" className="input" value={form.montant} onChange={e => setForm(s => ({ ...s, montant: e.target.value }))} /></div>
          <div><label className="label">Moyen</label><select className="input" value={form.moyen} onChange={e => setForm(s => ({ ...s, moyen: e.target.value }))}>
            <option value="ESPECES">Espèces</option><option value="WAVE">Wave</option><option value="ORANGE_MONEY">Orange Money</option><option value="CARTE">Carte</option><option value="VIREMENT">Virement</option>
          </select></div>
          <div><label className="label">Bénéficiaire</label><input className="input" value={form.beneficiaire} onChange={e => setForm(s => ({ ...s, beneficiaire: e.target.value }))} /></div>
          <div className="col-span-2"><label className="label">Notes</label><textarea className="input" value={form.notes} onChange={e => setForm(s => ({ ...s, notes: e.target.value }))} /></div>
        </div>
      </Modal>
    </div>
  )
}
