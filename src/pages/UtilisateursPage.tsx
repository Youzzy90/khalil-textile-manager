import { useEffect, useState } from 'react'
import { Plus, Edit3, UserCog, Shield, Activity, Lock, Unlock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { logActivite } from '../lib/audit'
import { PageHeader } from '../components/PageHeader'
import { DataTable, Column } from '../components/DataTable'
import { Modal } from '../components/Modal'
import { toast } from '../components/Toast'
import { formatDate, formatDateTime } from '../lib/format'
import type { Utilisateur, JournalActivite } from '../types/db'

export function UtilisateursPage() {
  const { utilisateur: me, refreshUtilisateur } = useAuth()
  const [users, setUsers] = useState<Utilisateur[]>([])
  const [journal, setJournal] = useState<JournalActivite[]>([])
  const [tab, setTab] = useState<'users' | 'journal'>('users')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ identifiant: '', nom_complet: '', role: 'EMPLOYE' as 'ADMIN' | 'EMPLOYE', telephone: '', email: '', actif: true })
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [u, j] = await Promise.all([
      supabase.from('utilisateur').select('*').eq('supprime', false).order('nom_complet'),
      supabase.from('journal_activite').select(`*,utilisateur:utilisateur(nom_complet)`).order('date_heure', { ascending: false }).limit(200),
    ])
    setUsers((u.data as Utilisateur[]) ?? [])
    setJournal((j.data as JournalActivite[]) ?? [])
    setLoading(false)
  }

  function openNew() { setEditId(null); setForm({ identifiant: '', nom_complet: '', role: 'EMPLOYE', telephone: '', email: '', actif: true }); setNewPassword(''); setOpen(true) }
  function openEdit(u: Utilisateur) {
    setEditId(u.id)
    setForm({ identifiant: u.identifiant, nom_complet: u.nom_complet, role: u.role, telephone: u.telephone ?? '', email: u.email ?? '', actif: u.actif })
    setNewPassword(''); setOpen(true)
  }

  async function save() {
    if (!me) return
    if (!form.identifiant.trim() || !form.nom_complet.trim()) { toast('error', 'Identifiant et nom requis.'); return }
    if (editId) {
      const { error } = await supabase.from('utilisateur').update({
        identifiant: form.identifiant, nom_complet: form.nom_complet, role: form.role,
        telephone: form.telephone || null, email: form.email || null, actif: form.actif,
      }).eq('id', editId)
      if (error) { toast('error', error.message); return }
      if (newPassword) {
        const target = users.find(u => u.id === editId)
        if (target?.auth_user_id) {
          const { error: e2 } = await supabase.auth.admin.updateUserById(target.auth_user_id, { password: newPassword })
          if (e2) { toast('error', `Mot de passe: ${e2.message}`); }
        }
      }
      await logActivite(me, 'USER', 'USER_EDIT', { type: 'utilisateur', id: editId })
      if (me.id === editId) await refreshUtilisateur()
      toast('success', 'Utilisateur modifié.')
    } else {
      // Create new auth user via admin API is not available with anon key. We surface a clear message.
      toast('info', "Pour créer un nouvel utilisateur, l'admin doit utiliser l'écran d'inscription depuis la page de connexion, puis modifier le rôle ici.")
    }
    setOpen(false); load()
  }

  async function toggleActif(u: Utilisateur) {
    if (me?.id === u.id) { toast('error', 'Vous ne pouvez pas vous désactiver vous-même.'); return }
    const admins = users.filter(x => x.role === 'ADMIN' && x.actif)
    if (u.role === 'ADMIN' && u.actif && admins.length <= 1) { toast('error', 'Au moins un administrateur actif est requis.'); return }
    const { error } = await supabase.from('utilisateur').update({ actif: !u.actif }).eq('id', u.id)
    if (error) { toast('error', error.message); return }
    await logActivite(me, 'USER', u.actif ? 'USER_DISABLE' : 'USER_ENABLE', { type: 'utilisateur', id: u.id })
    toast('success', u.actif ? 'Utilisateur désactivé.' : 'Utilisateur activé.')
    load()
  }

  const filtered = users.filter(u => !search || u.nom_complet.toLowerCase().includes(search.toLowerCase()) || u.identifiant.toLowerCase().includes(search.toLowerCase()))

  const userCols: Column<Utilisateur>[] = [
    { key: 'nom', header: 'Nom', sortValue: r => r.nom_complet, render: r => <div><div className="font-medium">{r.nom_complet}</div><div className="text-xs text-text-muted">@{r.identifiant}</div></div> },
    { key: 'role', header: 'Rôle', sortValue: r => r.role, render: r => r.role === 'ADMIN'
      ? <span className="badge bg-gold-500/20 text-gold-500 border border-gold-500/40"><Shield size={12} /> Admin</span>
      : <span className="badge bg-bg-soft text-text-secondary border border-border">Employé</span> },
    { key: 'tel', header: 'Téléphone', render: r => r.telephone ?? '—' },
    { key: 'email', header: 'Email', render: r => r.email ?? '—' },
    { key: 'actif', header: 'Statut', sortValue: r => r.actif ? 1 : 0, render: r => r.actif
      ? <span className="badge bg-success-100/20 text-success-300 border border-success-500/30">Actif</span>
      : <span className="badge bg-danger-100/20 text-danger-300 border border-danger-500/30">Désactivé</span> },
    { key: 'derniere', header: 'Dernière connexion', sortValue: r => r.derniere_connexion ?? '', render: r => formatDateTime(r.derniere_connexion) },
    { key: 'actions', header: '', render: r => (
      <div className="flex gap-1 justify-end">
        <button onClick={(e) => { e.stopPropagation(); openEdit(r) }} className="btn-ghost p-1.5"><Edit3 size={14} /></button>
        <button onClick={(e) => { e.stopPropagation(); toggleActif(r) }} className="btn-ghost p-1.5" title={r.actif ? 'Désactiver' : 'Activer'}>
          {r.actif ? <Lock size={14} className="text-danger-500" /> : <Unlock size={14} className="text-success-500" />}
        </button>
      </div>
    ) },
  ]

  const journalCols: Column<JournalActivite>[] = [
    { key: 'date', header: 'Date', sortValue: r => r.date_heure, render: r => formatDateTime(r.date_heure) },
    { key: 'cat', header: 'Catégorie', sortValue: r => r.categorie, render: r => <span className="badge bg-bg-soft text-text-secondary border border-border">{r.categorie}</span> },
    { key: 'action', header: 'Action', sortValue: r => r.action, render: r => <span className="font-mono text-xs text-gold-500">{r.action}</span> },
    { key: 'user', header: 'Utilisateur', sortValue: r => r.utilisateur?.nom_complet ?? '', render: r => r.utilisateur?.nom_complet ?? <span className="text-text-muted">Système</span> },
    { key: 'cible', header: 'Cible', render: r => r.cible_type ? `${r.cible_type} #${r.cible_id}` : '—' },
  ]

  return (
    <div>
      <PageHeader title="Utilisateurs & Journal" subtitle="Gestion des comptes et audit des actions" search={{ value: search, onChange: setSearch }}
        actions={<button onClick={openNew} className="btn-primary"><Plus size={16} /> Nouvel utilisateur</button>} />

      <div className="flex gap-1 border-b border-border mb-4">
        {[{ k: 'users', l: `Comptes (${users.length})`, icon: UserCog }, { k: 'journal', l: `Journal d'activité (${journal.length})`, icon: Activity }].map(t => (
          <button key={t.k} onClick={() => setTab(t.k as 'users' | 'journal')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition flex items-center gap-2 ${tab === t.k ? 'border-gold-500 text-gold-500' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>
            <t.icon size={15} /> {t.l}
          </button>
        ))}
      </div>

      {loading ? <div className="card py-20 text-center text-text-muted">Chargement…</div> :
        tab === 'users' ? (
          <div className="card overflow-hidden"><DataTable columns={userCols} rows={filtered} rowKey={r => r.id} /></div>
        ) : (
          <div className="card overflow-hidden"><DataTable columns={journalCols} rows={journal} rowKey={r => r.id} pageSize={25} /></div>
        )
      }

      <Modal open={open} onClose={() => setOpen(false)} title={editId ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
        footer={<><button onClick={() => setOpen(false)} className="btn-ghost">Annuler</button><button onClick={save} className="btn-primary">Enregistrer</button></>}>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Identifiant *</label><input className="input" value={form.identifiant} onChange={e => setForm(s => ({ ...s, identifiant: e.target.value }))} /></div>
          <div><label className="label">Nom complet *</label><input className="input" value={form.nom_complet} onChange={e => setForm(s => ({ ...s, nom_complet: e.target.value }))} /></div>
          <div><label className="label">Rôle</label><select className="input" value={form.role} onChange={e => setForm(s => ({ ...s, role: e.target.value as 'ADMIN' | 'EMPLOYE' }))}>
            <option value="ADMIN">Administrateur</option><option value="EMPLOYE">Employé</option>
          </select></div>
          <div><label className="label">Téléphone</label><input className="input" value={form.telephone} onChange={e => setForm(s => ({ ...s, telephone: e.target.value }))} /></div>
          <div className="col-span-2"><label className="label">Email</label><input className="input" value={form.email} onChange={e => setForm(s => ({ ...s, email: e.target.value }))} /></div>
          {editId && (
            <div className="col-span-2"><label className="label">Nouveau mot de passe (laisser vide pour conserver)</label><input type="password" className="input" value={newPassword} onChange={e => setNewPassword(e.target.value)} /></div>
          )}
          <div className="col-span-2"><label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.actif} onChange={e => setForm(s => ({ ...s, actif: e.target.checked }))} className="w-4 h-4 accent-gold-500" /> Compte actif</label></div>
        </div>
      </Modal>
    </div>
  )
}
