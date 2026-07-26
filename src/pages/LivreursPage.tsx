import { useEffect, useState } from 'react'
import { Plus, Edit3, Trash2, Truck, Banknote, MapPin, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { logActivite, genererNumeroEcriture } from '../lib/audit'
import { PageHeader } from '../components/PageHeader'
import { DataTable, Column } from '../components/DataTable'
import { Modal } from '../components/Modal'
import { toast } from '../components/Toast'
import { valideTelephone, formatDate, formatMontant } from '../lib/format'
import { VEHICULE_LABELS, COMMISSION_LABELS, LIVREUR_STATUT_LABELS } from '../lib/labels'
// plaque & date_embauche supprimés ; commission en montant fixe uniquement
import { parseZones } from '../lib/zones'
import type { Livreur, CommissionLivreur, Ville } from '../types/db'

interface Row extends Livreur { en_cours: number; livres: number; commission_due: number; zoneList: string[] }

type LivreurForm = {
  nom_complet: string; telephone: string; type_vehicule: Livreur['type_vehicule']; zones: string[];
  statut: Livreur['statut']; type_commission: Livreur['type_commission']; valeur_commission: string; notes: string;
}
const empty: LivreurForm = {
  nom_complet: '', telephone: '', type_vehicule: 'MOTO', zones: [],
  statut: 'ACTIF', type_commission: 'AUCUNE', valeur_commission: '0', notes: '',
}

export function LivreursPage() {
  const { utilisateur } = useAuth()
  const isAdmin = utilisateur?.role === 'ADMIN'
  const [rows, setRows] = useState<Row[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<LivreurForm>(empty)
  const [commissions, setCommissions] = useState<CommissionLivreur[]>([])
  const [showComm, setShowComm] = useState(false)
  const [villes, setVilles] = useState<Ville[]>([])
  const [zoneInput, setZoneInput] = useState('')

  useEffect(() => { load(); supabase.from('ville').select('*').eq('actif', true).order('nom').then(({ data }) => setVilles((data as Ville[]) ?? [])) }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('livreur').select('*').eq('supprime', false).order('nom_complet')
    const livs = (data as Livreur[]) ?? []
    if (livs.length === 0) { setRows([]); setLoading(false); return }
    const ids = livs.map(l => l.id)
    const { data: colis } = await supabase.from('colis').select('livreur_id,statut').in('livreur_id', ids).eq('supprime', false)
    const enCours = new Map<number, number>(); const livres = new Map<number, number>()
    ;(colis ?? []).forEach((r: any) => {
      if (r.statut === 'EN_LIVRAISON') enCours.set(r.livreur_id, (enCours.get(r.livreur_id) ?? 0) + 1)
      if (r.statut === 'LIVRE') livres.set(r.livreur_id, (livres.get(r.livreur_id) ?? 0) + 1)
    })
    const { data: comms } = await supabase.from('commission_livreur').select('montant,payee,livreur_id').in('livreur_id', ids)
    const due = new Map<number, number>()
    ;(comms ?? []).forEach((c: any) => { if (!c.payee) due.set(c.livreur_id, (due.get(c.livreur_id) ?? 0) + Number(c.montant)) })
    setRows(livs.map(l => ({ ...l, en_cours: enCours.get(l.id) ?? 0, livres: livres.get(l.id) ?? 0, commission_due: due.get(l.id) ?? 0, zoneList: parseZones(l.zones) })))
    setLoading(false)
  }

  function openNew() { setEditId(null); setForm(empty); setZoneInput(''); setOpen(true) }

  function addZone(v: string) {
    const z = v.trim().toLowerCase()
    if (!z) return
    setForm(s => s.zones.includes(z) ? s : { ...s, zones: [...s.zones, z] })
    setZoneInput('')
  }
  function removeZone(z: string) {
    setForm(s => ({ ...s, zones: s.zones.filter(x => x !== z) }))
  }
  function openEdit(l: Livreur) {
    setEditId(l.id)
    setForm({
      nom_complet: l.nom_complet, telephone: l.telephone, type_vehicule: l.type_vehicule,
      zones: parseZones(l.zones), statut: l.statut,
      type_commission: l.type_commission, valeur_commission: String(l.valeur_commission), notes: l.notes ?? '',
    })
    setZoneInput('')
    setOpen(true)
  }

  async function save() {
    if (!form.nom_complet.trim()) { toast('error', 'Nom requis.'); return }
    if (!valideTelephone(form.telephone)) { toast('error', 'Téléphone invalide.'); return }
    const payload = {
      nom_complet: form.nom_complet, telephone: form.telephone, type_vehicule: form.type_vehicule,
      zones: form.zones.length ? form.zones.join(',') : null, statut: form.statut,
      type_commission: form.type_commission,
      valeur_commission: Number(form.valeur_commission) || 0, notes: form.notes || null,
    }
    if (editId) {
      const { error } = await supabase.from('livreur').update(payload).eq('id', editId)
      if (error) { toast('error', error.message); return }
      await logActivite(utilisateur, 'LIVREUR', 'LIVREUR_EDIT', { type: 'livreur', id: editId })
      toast('success', 'Livreur modifié.')
    } else {
      const { data, error } = await supabase.from('livreur').insert(payload).select().single()
      if (error) { toast('error', error.message); return }
      await logActivite(utilisateur, 'LIVREUR', 'LIVREUR_CREATE', { type: 'livreur', id: (data as Livreur).id })
      toast('success', 'Livreur créé.')
    }
    setOpen(false); load()
  }

  async function remove(l: Livreur) {
    if (!confirm(`Supprimer le livreur ${l.nom_complet} ?`)) return
    const { error } = await supabase.from('livreur').update({ supprime: true }).eq('id', l.id)
    if (error) { toast('error', error.message); return }
    await logActivite(utilisateur, 'LIVREUR', 'LIVREUR_DELETE', { type: 'livreur', id: l.id })
    toast('success', 'Livreur supprimé.')
    load()
  }

  async function payerCommissions(l: Livreur) {
    const dues = commissions.filter(c => c.livreur_id === l.id && !c.payee)
    if (dues.length === 0) { toast('info', 'Aucune commission due.'); return }
    const total = dues.reduce((s, c) => s + Number(c.montant), 0)
    if (!confirm(`Payer ${formatMontant(total)} de commissions à ${l.nom_complet} (${dues.length} colis) ?`)) return
    const numEcr = await genererNumeroEcriture()
    const { data: ecr } = await supabase.from('ecriture_comptable').insert({
      numero: numEcr, sens: 'SORTIE', categorie: 'CHARGE_COMMISSION',
      libelle: `Commission ${l.nom_complet} (${dues.length} colis)`, montant: total, moyen: 'ESPECES',
      utilisateur_id: utilisateur!.id, automatique: true,
    }).select().single()
    await supabase.from('commission_livreur').update({ payee: true, date_paiement: new Date().toISOString(), ecriture_id: (ecr as any)?.id ?? null })
      .in('id', dues.map(d => d.id))
    await logActivite(utilisateur, 'LIVREUR', 'COMMISSION_PAY', { type: 'livreur', id: l.id }, { montant: total })
    toast('success', `Commissions payées : ${formatMontant(total)}.`)
    load()
  }

  async function voirCommissions(l: Livreur) {
    const { data } = await supabase.from('commission_livreur').select('*,livreur:livreur(nom_complet),colis:colis(code)')
      .eq('livreur_id', l.id).order('date_generation', { ascending: false })
    setCommissions((data as CommissionLivreur[]) ?? [])
    setShowComm(true)
  }

  const filtered = rows.filter(r => !search || r.nom_complet.toLowerCase().includes(search.toLowerCase()) || r.telephone.includes(search))

  const columns: Column<Row>[] = [
    { key: 'nom', header: 'Nom', sortValue: r => r.nom_complet, render: r => <div><div className="font-medium">{r.nom_complet}</div><div className="text-xs text-text-muted">{VEHICULE_LABELS[r.type_vehicule]}</div></div> },
    { key: 'tel', header: 'Téléphone', sortValue: r => r.telephone, render: r => <span className="font-mono">{r.telephone}</span> },
    { key: 'statut', header: 'Statut', sortValue: r => r.statut, render: r => {
      const c = r.statut === 'ACTIF' ? 'bg-success-100/20 text-success-300 border border-success-500/30' : r.statut === 'EN_CONGE' ? 'bg-warning-100/20 text-warning-300 border border-warning-500/30' : 'bg-bg-hover text-text-secondary border border-border'
      return <span className={`badge ${c}`}>{LIVREUR_STATUT_LABELS[r.statut]}</span>
    } },
    { key: 'zones', header: 'Zones', sortValue: r => r.zoneList.length, render: r => r.zoneList.length === 0
      ? <span className="text-xs text-text-muted">—</span>
      : <div className="flex flex-wrap gap-1 max-w-[180px]">{r.zoneList.slice(0, 3).map(z => <span key={z} className="badge bg-gold-500/10 text-gold-500 border border-gold-500/30 capitalize text-[10px]"><MapPin size={9} /> {z}</span>)}{r.zoneList.length > 3 && <span className="text-[10px] text-text-muted">+{r.zoneList.length - 3}</span>}</div> },
    { key: 'encours', header: 'En cours', sortValue: r => r.en_cours, render: r => <span className="font-mono">{r.en_cours}</span> },
    { key: 'livres', header: 'Livrés', sortValue: r => r.livres, render: r => <span className="font-mono text-success-500">{r.livres}</span> },
    { key: 'comm', header: 'Commission due', sortValue: r => r.commission_due, render: r => <span className={`font-mono ${r.commission_due > 0 ? 'text-gold-500' : 'text-text-muted'}`}>{formatMontant(r.commission_due)}</span> },
    { key: 'actions', header: '', render: r => (
      <div className="flex gap-1 justify-end">
        <button onClick={(e) => { e.stopPropagation(); voirCommissions(r) }} className="btn-ghost p-1.5" title="Commissions"><Banknote size={14} /></button>
        <button onClick={(e) => { e.stopPropagation(); openEdit(r) }} className="btn-ghost p-1.5"><Edit3 size={14} /></button>
        {isAdmin && <button onClick={(e) => { e.stopPropagation(); remove(r) }} className="btn-ghost p-1.5 text-danger-500"><Trash2 size={14} /></button>}
      </div>
    ) },
  ]

  return (
    <div>
      <PageHeader title="Livreurs" subtitle={`${rows.length} livreurs`} search={{ value: search, onChange: setSearch }} onAdd={openNew} addLabel="Nouveau livreur" />
      {loading ? <div className="card py-20 text-center text-text-muted">Chargement…</div> :
        rows.length === 0 ? (
          <div className="card"><div className="py-16 text-center"><Truck className="mx-auto text-text-muted mb-3" size={28} /><div className="font-semibold">Aucun livreur</div></div></div>
        ) : <div className="card overflow-hidden"><DataTable columns={columns} rows={filtered} rowKey={r => r.id} /></div>
      }

      <Modal open={open} onClose={() => setOpen(false)} title={editId ? 'Modifier le livreur' : 'Nouveau livreur'} size="lg"
        footer={<><button onClick={() => setOpen(false)} className="btn-ghost">Annuler</button><button onClick={save} className="btn-primary">Enregistrer</button></>}>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="label">Nom complet *</label><input className="input" value={form.nom_complet} onChange={e => setForm(s => ({ ...s, nom_complet: e.target.value }))} /></div>
          <div><label className="label">Téléphone *</label><input className="input" value={form.telephone} onChange={e => setForm(s => ({ ...s, telephone: e.target.value }))} /></div>
          <div><label className="label">Type de véhicule</label><select className="input" value={form.type_vehicule} onChange={e => setForm(s => ({ ...s, type_vehicule: e.target.value as Livreur['type_vehicule'] }))}>
            {Object.entries(VEHICULE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select></div>

          <div className="col-span-2">
            <label className="label">Zones de livraison</label>
            <div className="flex flex-wrap gap-1.5 mb-2 min-h-[2rem]">
              {form.zones.map(z => (
                <span key={z} className="badge bg-gold-500/10 text-gold-500 border border-gold-500/30 capitalize gap-1">
                  <MapPin size={10} /> {z}
                  <button type="button" onClick={() => removeZone(z)} className="hover:text-danger-500"><X size={11} /></button>
                </span>
              ))}
              {form.zones.length === 0 && <span className="text-xs text-text-muted">Aucune zone — ce livreur ne sera pas auto-attribué</span>}
            </div>
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="Ajouter une ville…" value={zoneInput}
                onChange={e => setZoneInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addZone(zoneInput) } }} />
              <button type="button" onClick={() => addZone(zoneInput)} className="btn-secondary"><Plus size={14} /> Ajouter</button>
            </div>
            {villes.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-[10px] text-text-muted mr-1">Suggestions :</span>
                {villes.filter(v => !form.zones.includes(v.nom.toLowerCase())).slice(0, 6).map(v => (
                  <button key={v.id} type="button" onClick={() => addZone(v.nom)} className="text-[10px] px-2 py-0.5 rounded-md bg-bg-hover text-text-secondary hover:bg-gold-500/10 hover:text-gold-500 transition capitalize">{v.nom}</button>
                ))}
              </div>
            )}
            <p className="text-xs text-text-muted mt-2 flex items-center gap-1.5"><MapPin size={12} /> Les colis destinés à ces villes seront automatiquement attribués à ce livreur.</p>
          </div>
          <div><label className="label">Statut</label><select className="input" value={form.statut} onChange={e => setForm(s => ({ ...s, statut: e.target.value as Livreur['statut'] }))}>
            {Object.entries(LIVREUR_STATUT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select></div>
          <div><label className="label">Type de commission</label><select className="input" value={form.type_commission} onChange={e => setForm(s => ({ ...s, type_commission: e.target.value as Livreur['type_commission'] }))}>
            {Object.entries(COMMISSION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select></div>
          <div><label className="label">Commission par colis (montant)</label><input type="number" step="0.01" className="input" value={form.valeur_commission} onChange={e => setForm(s => ({ ...s, valeur_commission: e.target.value }))} disabled={form.type_commission === 'AUCUNE'} /></div>
          <div className="col-span-2"><label className="label">Notes</label><textarea className="input" value={form.notes} onChange={e => setForm(s => ({ ...s, notes: e.target.value }))} /></div>
        </div>
      </Modal>

      <Modal open={showComm} onClose={() => setShowComm(false)} title="Commissions du livreur" size="lg"
        footer={<button onClick={() => setShowComm(false)} className="btn-ghost">Fermer</button>}>
        {commissions.length === 0 ? <div className="text-center py-8 text-text-muted">Aucune commission</div> : (
          <table className="w-full">
            <thead><tr><th className="th">Colis</th><th className="th">Date</th><th className="th">Montant</th><th className="th">Statut</th></tr></thead>
            <tbody>
              {commissions.map(c => (
                <tr key={c.id} className="table-row">
                  <td className="td font-mono text-gold-500">{c.colis?.code}</td>
                  <td className="td">{formatDate(c.date_generation)}</td>
                  <td className="td font-mono">{formatMontant(c.montant)}</td>
                  <td className="td">{c.payee ? <span className="badge bg-success-100/20 text-success-300 border border-success-500/30">Payée</span> : <span className="badge bg-warning-100/20 text-warning-300 border border-warning-500/30">Due</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {commissions.some(c => !c.payee) && isAdmin && (
          <div className="mt-4 flex justify-end">
            <button onClick={() => payerCommissions(rows.find(r => r.id === commissions[0]?.livreur_id)!)} className="btn-primary"><Banknote size={16} /> Payer les commissions dues</button>
          </div>
        )}
      </Modal>
    </div>
  )
}
