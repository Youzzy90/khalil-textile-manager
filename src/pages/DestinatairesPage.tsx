import { useEffect, useState } from 'react'
import { Plus, Edit3, Trash2, MapPin } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { logActivite } from '../lib/audit'
import { PageHeader } from '../components/PageHeader'
import { DataTable, Column } from '../components/DataTable'
import { Modal } from '../components/Modal'
import { toast } from '../components/Toast'
import { valideTelephone, formatDate } from '../lib/format'
import type { Destinataire, Client } from '../types/db'

interface Row extends Destinataire { nb_colis: number }

const empty = { nom_complet: '', telephone: '', ville: 'Dakar', adresse: '', client_id: '', notes: '' }

export function DestinatairesPage() {
  const { utilisateur } = useAuth()
  const isAdmin = utilisateur?.role === 'ADMIN'
  const [rows, setRows] = useState<Row[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(empty)

  useEffect(() => { load(); supabase.from('client').select('id,nom_complet,telephone').eq('supprime', false).order('nom_complet').then(({ data }) => setClients((data as Client[]) ?? [])) }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('destinataire').select('*').eq('supprime', false).order('nom_complet')
    const dests = (data as Destinataire[]) ?? []
    if (dests.length === 0) { setRows([]); setLoading(false); return }
    const ids = dests.map(d => d.id)
    const { data: agg } = await supabase.from('colis').select('destinataire_id').in('destinataire_id', ids).eq('supprime', false)
    const map = new Map<number, number>()
    ;(agg ?? []).forEach((r: any) => map.set(r.destinataire_id, (map.get(r.destinataire_id) ?? 0) + 1))
    setRows(dests.map(d => ({ ...d, nb_colis: map.get(d.id) ?? 0 })))
    setLoading(false)
  }

  function openNew() { setEditId(null); setForm(empty); setOpen(true) }
  function openEdit(d: Destinataire) {
    setEditId(d.id)
    setForm({ nom_complet: d.nom_complet, telephone: d.telephone, ville: d.ville, adresse: d.adresse, client_id: d.client_id ? String(d.client_id) : '', notes: d.notes ?? '' })
    setOpen(true)
  }

  async function save() {
    if (!form.nom_complet.trim()) { toast('error', 'Nom requis.'); return }
    if (!valideTelephone(form.telephone)) { toast('error', 'Téléphone invalide.'); return }
    if (!form.adresse.trim()) { toast('error', 'Adresse requise (livraison physique).'); return }
    const payload = { nom_complet: form.nom_complet, telephone: form.telephone, ville: form.ville, adresse: form.adresse, client_id: form.client_id ? Number(form.client_id) : null, notes: form.notes || null }
    if (editId) {
      const { error } = await supabase.from('destinataire').update(payload).eq('id', editId)
      if (error) { toast('error', error.message); return }
      await logActivite(utilisateur, 'DEST', 'DEST_EDIT', { type: 'destinataire', id: editId })
      toast('success', 'Destinataire modifié.')
    } else {
      const { data, error } = await supabase.from('destinataire').insert(payload).select().single()
      if (error) { toast('error', error.message); return }
      await logActivite(utilisateur, 'DEST', 'DEST_CREATE', { type: 'destinataire', id: (data as Destinataire).id })
      toast('success', 'Destinataire créé.')
    }
    setOpen(false); load()
  }

  async function remove(d: Destinataire) {
    if (!confirm(`Supprimer le destinataire ${d.nom_complet} ?`)) return
    const { error } = await supabase.from('destinataire').update({ supprime: true }).eq('id', d.id)
    if (error) { toast('error', error.message); return }
    await logActivite(utilisateur, 'DEST', 'DEST_DELETE', { type: 'destinataire', id: d.id })
    toast('success', 'Destinataire supprimé.')
    load()
  }

  const filtered = rows.filter(r => !search || r.nom_complet.toLowerCase().includes(search.toLowerCase()) || r.telephone.includes(search) || r.ville.toLowerCase().includes(search.toLowerCase()))

  const columns: Column<Row>[] = [
    { key: 'nom', header: 'Nom', sortValue: r => r.nom_complet, render: r => <span className="font-medium">{r.nom_complet}</span> },
    { key: 'tel', header: 'Téléphone', sortValue: r => r.telephone, render: r => <span className="font-mono">{r.telephone}</span> },
    { key: 'ville', header: 'Ville', sortValue: r => r.ville, render: r => r.ville },
    { key: 'adresse', header: 'Adresse', render: r => <span className="text-text-secondary text-xs">{r.adresse}</span> },
    { key: 'nb', header: 'Colis', sortValue: r => r.nb_colis, render: r => <span className="font-mono">{r.nb_colis}</span> },
    { key: 'date', header: 'Créé le', sortValue: r => r.created_at, render: r => formatDate(r.created_at) },
    { key: 'actions', header: '', render: r => (
      <div className="flex gap-1 justify-end">
        <button onClick={(e) => { e.stopPropagation(); openEdit(r) }} className="btn-ghost p-1.5"><Edit3 size={14} /></button>
        {isAdmin && <button onClick={(e) => { e.stopPropagation(); remove(r) }} className="btn-ghost p-1.5 text-danger-500"><Trash2 size={14} /></button>}
      </div>
    ) },
  ]

  return (
    <div>
      <PageHeader title="Destinataires" subtitle={`${rows.length} destinataires`} search={{ value: search, onChange: setSearch }} onAdd={openNew} addLabel="Nouveau destinataire" />
      {loading ? <div className="card py-20 text-center text-text-muted">Chargement…</div> :
        rows.length === 0 ? (
          <div className="card"><div className="py-16 text-center"><MapPin className="mx-auto text-text-muted mb-3" size={28} /><div className="font-semibold">Aucun destinataire</div></div></div>
        ) : <div className="card overflow-hidden"><DataTable columns={columns} rows={filtered} rowKey={r => r.id} /></div>
      }

      <Modal open={open} onClose={() => setOpen(false)} title={editId ? 'Modifier le destinataire' : 'Nouveau destinataire'}
        footer={<><button onClick={() => setOpen(false)} className="btn-ghost">Annuler</button><button onClick={save} className="btn-primary">Enregistrer</button></>}>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="label">Nom complet *</label><input className="input" value={form.nom_complet} onChange={e => setForm(s => ({ ...s, nom_complet: e.target.value }))} /></div>
          <div><label className="label">Téléphone *</label><input className="input" value={form.telephone} onChange={e => setForm(s => ({ ...s, telephone: e.target.value }))} /></div>
          <div><label className="label">Ville</label><input className="input" value={form.ville} onChange={e => setForm(s => ({ ...s, ville: e.target.value }))} /></div>
          <div className="col-span-2"><label className="label">Adresse *</label><input className="input" value={form.adresse} onChange={e => setForm(s => ({ ...s, adresse: e.target.value }))} /></div>
          <div className="col-span-2"><label className="label">Client lié (optionnel)</label>
            <select className="input" value={form.client_id} onChange={e => setForm(s => ({ ...s, client_id: e.target.value }))}>
              <option value="">Aucun</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.nom_complet} — {c.telephone}</option>)}
            </select>
          </div>
          <div className="col-span-2"><label className="label">Notes</label><textarea className="input" value={form.notes} onChange={e => setForm(s => ({ ...s, notes: e.target.value }))} /></div>
        </div>
      </Modal>
    </div>
  )
}
