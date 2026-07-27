import { useEffect, useState } from 'react'
import { Plus, Edit3, Trash2, Users, Eye } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { logActivite } from '../lib/audit'
import { PageHeader } from '../components/PageHeader'
import { DataTable, Column } from '../components/DataTable'
import { Modal } from '../components/Modal'
import { toast } from '../components/Toast'
import { valideTelephone, valideEmail, formatDate, formatMontant } from '../lib/format'
import type { Client } from '../types/db'

interface Row extends Client { nb_commandes: number; total_depense: number }

type ClientForm = { nom_complet: string; telephone: string; telephone2: string; email: string; ville: string; adresse: string; type: 'PARTICULIER' | 'ENTREPRISE'; notes: string }
const empty: ClientForm = { nom_complet: '', telephone: '', telephone2: '', email: '', ville: '', adresse: '', type: 'PARTICULIER', notes: '' }

export function ClientsPage() {
  const { utilisateur } = useAuth()
  const isAdmin = utilisateur?.role === 'ADMIN'
  const [rows, setRows] = useState<Row[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<ClientForm>(empty)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('client').select('*').eq('supprime', false).order('nom_complet')
    const clients = (data as Client[]) ?? []
    if (clients.length === 0) { setRows([]); setLoading(false); return }
    const ids = clients.map(c => c.id)
    const { data: agg } = await supabase.from('colis').select('client_id,montant').in('client_id', ids).eq('supprime', false)
    const map = new Map<number, { n: number; t: number }>()
    ;(agg ?? []).forEach((r: any) => {
      const e = map.get(r.client_id) ?? { n: 0, t: 0 }
      e.n += 1; e.t += Number(r.montant)
      map.set(r.client_id, e)
    })
    setRows(clients.map(c => ({ ...c, nb_commandes: map.get(c.id)?.n ?? 0, total_depense: map.get(c.id)?.t ?? 0 })))
    setLoading(false)
  }

  function openNew() { setEditId(null); setForm(empty); setOpen(true) }
  function openEdit(c: Client) {
    setEditId(c.id)
    setForm({ nom_complet: c.nom_complet, telephone: c.telephone, telephone2: c.telephone2 ?? '', email: c.email ?? '', ville: c.ville, adresse: c.adresse ?? '', type: c.type, notes: c.notes ?? '' })
    setOpen(true)
  }

  async function save() {
    if (!form.nom_complet.trim()) { toast('error', 'Nom requis.'); return }
    if (!valideTelephone(form.telephone)) { toast('error', 'Téléphone invalide.'); return }
    if (!valideEmail(form.email)) { toast('error', 'Email invalide.'); return }
    const payload = { ...form, telephone2: form.telephone2 || null, email: form.email || null, adresse: form.adresse || null, notes: form.notes || null }
    if (editId) {
      const { error } = await supabase.from('client').update(payload).eq('id', editId)
      if (error) { toast('error', error.message); return }
      await logActivite(utilisateur, 'CLIENT', 'CLIENT_EDIT', { type: 'client', id: editId })
      toast('success', 'Client modifié.')
    } else {
      const { data, error } = await supabase.from('client').insert(payload).select().single()
      if (error) { toast('error', error.message); return }
      await logActivite(utilisateur, 'CLIENT', 'CLIENT_CREATE', { type: 'client', id: (data as Client).id })
      toast('success', 'Client créé.')
    }
    setOpen(false); load()
  }

  async function remove(c: Client) {
    if (!confirm(`Supprimer le client ${c.nom_complet} ?`)) return
    const { error } = await supabase.from('client').update({ supprime: true }).eq('id', c.id)
    if (error) { toast('error', error.message); return }
    await logActivite(utilisateur, 'CLIENT', 'CLIENT_DELETE', { type: 'client', id: c.id })
    toast('success', 'Client supprimé.')
    load()
  }

  const filtered = rows.filter(r =>
    !search || r.nom_complet.toLowerCase().includes(search.toLowerCase()) ||
    r.telephone.includes(search) || r.ville.toLowerCase().includes(search.toLowerCase()))

  const columns: Column<Row>[] = [
    { key: 'nom', header: 'Nom', sortValue: r => r.nom_complet, render: r => <div><div className="font-medium text-text-primary">{r.nom_complet}</div><div className="text-xs text-text-muted">{r.type === 'PARTICULIER' ? 'Particulier' : 'Entreprise'}</div></div> },
    { key: 'tel', header: 'Téléphone', sortValue: r => r.telephone, render: r => <span className="font-mono text-sm">{r.telephone}</span> },
    { key: 'ville', header: 'Ville', sortValue: r => r.ville, render: r => r.ville || <span className="text-text-muted">—</span> },
    { key: 'cmd', header: 'Commandes', sortValue: r => r.nb_commandes, render: r => <span className="font-mono">{r.nb_commandes}</span> },
    { key: 'total', header: 'Total dépensé', sortValue: r => r.total_depense, render: r => <span className="font-mono text-gold-500">{formatMontant(r.total_depense)}</span> },
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
      <PageHeader title="Clients" subtitle={`${rows.length} clients`} search={{ value: search, onChange: setSearch, placeholder: 'Nom, téléphone, ville…' }} onAdd={openNew} addLabel="Nouveau client" />
      {loading ? <div className="card py-20 text-center text-text-muted">Chargement…</div> :
        rows.length === 0 ? (
          <div className="card"><div className="py-16 text-center"><Users className="mx-auto text-text-muted mb-3" size={28} /><div className="font-semibold">Aucun client</div><div className="text-sm text-text-secondary mt-1">Ajoutez votre premier client.</div></div></div>
        ) : (
          <div className="card overflow-hidden"><DataTable columns={columns} rows={filtered} rowKey={r => r.id} /></div>
        )
      }

      <Modal open={open} onClose={() => setOpen(false)} title={editId ? 'Modifier le client' : 'Nouveau client'}
        footer={<><button onClick={() => setOpen(false)} className="btn-ghost">Annuler</button><button onClick={save} className="btn-primary">Enregistrer</button></>}>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="label">Nom complet *</label><input className="input" value={form.nom_complet} onChange={e => setForm(s => ({ ...s, nom_complet: e.target.value }))} /></div>
          <div><label className="label">Téléphone *</label><input className="input" value={form.telephone} onChange={e => setForm(s => ({ ...s, telephone: e.target.value }))} /></div>
          <div><label className="label">Téléphone 2</label><input className="input" value={form.telephone2} onChange={e => setForm(s => ({ ...s, telephone2: e.target.value }))} /></div>
          <div><label className="label">Email</label><input className="input" value={form.email} onChange={e => setForm(s => ({ ...s, email: e.target.value }))} /></div>
          <div><label className="label">Ville <span className="text-text-muted font-normal">(optionnel)</span></label><input className="input" placeholder="Pas encore connue" value={form.ville} onChange={e => setForm(s => ({ ...s, ville: e.target.value }))} /></div>
          <div className="col-span-2"><label className="label">Adresse <span className="text-text-muted font-normal">(optionnel)</span></label><input className="input" placeholder="Pas encore connue" value={form.adresse} onChange={e => setForm(s => ({ ...s, adresse: e.target.value }))} /></div>
          <div><label className="label">Type</label><select className="input" value={form.type} onChange={e => setForm(s => ({ ...s, type: e.target.value as 'PARTICULIER' | 'ENTREPRISE' }))}><option value="PARTICULIER">Particulier</option><option value="ENTREPRISE">Entreprise</option></select></div>
          <div className="col-span-2"><label className="label">Notes</label><textarea className="input" value={form.notes} onChange={e => setForm(s => ({ ...s, notes: e.target.value }))} /></div>
        </div>
      </Modal>
    </div>
  )
}
