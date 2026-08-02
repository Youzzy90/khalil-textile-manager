import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Loader2, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { logActivite, genererCodeColis } from '../lib/audit'
import { toast } from '../components/Toast'
import { valideTelephone } from '../lib/format'
import type { Client, Destinataire, Livreur, Ville, MoyenPaiement } from '../types/db'

interface FormState {
  client_id: string; destinataire_id: string; livreur_id: string
  contenu: string; poids: string; valeur_declaree: string
  ville_destination: string; adresse_livraison: string
  montant: string; mode_paiement_attendu: MoyenPaiement
  priorite: 'NORMALE' | 'EXPRESS'; fragile: boolean; notes_internes: string
}

const MOYENS: { value: MoyenPaiement; label: string }[] = [
  { value: 'ESPECES', label: 'Espèces' },
  { value: 'WAVE', label: 'Wave' },
  { value: 'ORANGE_MONEY', label: 'Orange Money' },
  { value: 'CARTE', label: 'Carte bancaire' },
  { value: 'VIREMENT', label: 'Virement' },
  { value: 'PORT_PAYE', label: 'Port payé (avance)' },
  { value: 'A_LIVRAISON', label: 'À la livraison' },
]

export function ColisFormPage() {
  const { id } = useParams()
  const editMode = Boolean(id)
  const navigate = useNavigate()
  const { utilisateur } = useAuth()
  const [loading, setLoading] = useState(editMode)
  const [saving, setSaving] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [destinataires, setDestinataires] = useState<Destinataire[]>([])
  const [livreurs, setLivreurs] = useState<Livreur[]>([])
  const [villes, setVilles] = useState<Ville[]>([])

  const [form, setForm] = useState<FormState>({
    client_id: '', destinataire_id: '', livreur_id: '',
    contenu: '', poids: '1', valeur_declaree: '0',
    ville_destination: '', adresse_livraison: '',
    montant: '0', mode_paiement_attendu: 'ESPECES',
    priorite: 'NORMALE', fragile: false, notes_internes: '',
  })

  // Quick-create dialogs
  const [showClient, setShowClient] = useState(false)
  const [showDest, setShowDest] = useState(false)
  const [qClient, setQClient] = useState({ nom: '', tel: '', ville: '' })
  const [qDest, setQDest] = useState({ nom: '', tel: '', ville: '', adresse: '' })

  useEffect(() => {
    supabase.from('client').select('*').eq('supprime', false).order('nom_complet').then(({ data }) => setClients((data as Client[]) ?? []))
    supabase.from('destinataire').select('*').eq('supprime', false).order('nom_complet').then(({ data }) => setDestinataires((data as Destinataire[]) ?? []))
    supabase.from('livreur').select('id,nom_complet,statut').eq('supprime', false).eq('statut', 'ACTIF').order('nom_complet')
      .then(({ data }) => setLivreurs((data as Livreur[]) ?? []))
    supabase.from('ville').select('*').eq('actif', true).order('nom').then(({ data }) => setVilles((data as Ville[]) ?? []))

    if (editMode && id) {
      supabase.from('colis').select('*').eq('id', id).maybeSingle().then(({ data }) => {
        if (data) {
          const c = data as any
          setForm({
            client_id: String(c.client_id), destinataire_id: String(c.destinataire_id),
            livreur_id: c.livreur_id ? String(c.livreur_id) : '',
            contenu: c.contenu, poids: String(c.poids), valeur_declaree: String(c.valeur_declaree),
            ville_destination: c.ville_destination, adresse_livraison: c.adresse_livraison,
            montant: String(c.montant), mode_paiement_attendu: c.mode_paiement_attendu,
            priorite: c.priorite, fragile: c.fragile, notes_internes: c.notes_internes ?? '',
          })
        }
        setLoading(false)
      })
    }
  }, [id, editMode])

  function set<K extends keyof FormState>(k: K, v: FormState[K]) { setForm(f => ({ ...f, [k]: v })) }

  async function quickClient() {
    if (!qClient.nom || !valideTelephone(qClient.tel)) { toast('error', "Nom et téléphone valides requis."); return }
    const { data, error } = await supabase.from('client').insert({
      nom_complet: qClient.nom, telephone: qClient.tel, ville: qClient.ville || 'Dakar',
      type: 'PARTICULIER',
    }).select().single()
    if (error) { toast('error', error.message); return }
    setClients(c => [...c, data as Client].sort((a, b) => a.nom_complet.localeCompare(b.nom_complet)))
    set('client_id', String((data as Client).id))
    setShowClient(false); setQClient({ nom: '', tel: '', ville: '' })
    toast('success', 'Client créé.')
  }

  async function quickDest() {
    if (!qDest.nom || !valideTelephone(qDest.tel) || !qDest.adresse) { toast('error', "Nom, téléphone et adresse requis."); return }
    const { data, error } = await supabase.from('destinataire').insert({
      nom_complet: qDest.nom, telephone: qDest.tel, ville: qDest.ville || 'Dakar', adresse: qDest.adresse,
    }).select().single()
    if (error) { toast('error', error.message); return }
    setDestinataires(d => [...d, data as Destinataire].sort((a, b) => a.nom_complet.localeCompare(b.nom_complet)))
    set('destinataire_id', String((data as Destinataire).id))
    set('ville_destination', (data as Destinataire).ville)
    set('adresse_livraison', (data as Destinataire).adresse)
    setShowDest(false); setQDest({ nom: '', tel: '', ville: '', adresse: '' })
    toast('success', 'Destinataire créé.')
  }

  async function save() {
    if (!utilisateur) return
    if (!form.client_id || !form.destinataire_id) { toast('error', "Sélectionnez un expéditeur et un destinataire."); return }
    if (!form.contenu.trim()) { toast('error', "Le contenu est obligatoire."); return }
    if (!form.ville_destination) { toast('error', "Ville de destination requise."); return }
    if (Number(form.poids) <= 0) { toast('error', "Le poids doit être positif."); return }

    setSaving(true)
    try {
      const payload = {
        client_id: Number(form.client_id),
        destinataire_id: Number(form.destinataire_id),
        livreur_id: form.livreur_id ? Number(form.livreur_id) : null,
        contenu: form.contenu.trim(),
        poids: Number(form.poids),
        valeur_declaree: Number(form.valeur_declaree) || 0,
        ville_destination: form.ville_destination,
        adresse_livraison: form.adresse_livraison,
        montant: Number(form.montant) || 0,
        mode_paiement_attendu: form.mode_paiement_attendu,
        priorite: form.priorite,
        fragile: form.fragile,
        notes_internes: form.notes_internes || null,
      }

      if (editMode && id) {
        const { error } = await supabase.from('colis').update(payload).eq('id', id)
        if (error) throw error
        await supabase.from('historique_colis').insert({
          colis_id: Number(id), utilisateur_id: utilisateur.id, action: 'EDIT',
          details: JSON.stringify(payload),
        })
        await logActivite(utilisateur, 'COLIS', 'COLIS_EDIT', { type: 'colis', id: Number(id) })
        toast('success', 'Colis modifié.')
        navigate(`/colis/${id}`)
      } else {
        const code = await genererCodeColis()
        const { data, error } = await supabase.from('colis').insert({ ...payload, code, statut: 'RECU' }).select().single()
        if (error) throw error
        const colis = data as any
        await supabase.from('historique_colis').insert({
          colis_id: colis.id, utilisateur_id: utilisateur.id, action: 'CREATE',
          statut_precedent: null, statut_nouveau: 'RECU',
        })
        await logActivite(utilisateur, 'COLIS', 'COLIS_CREATE', { type: 'colis', id: colis.id })
        toast('success', `Colis ${colis.code} créé.`)
        navigate(`/colis/${colis.id}`)
      }
    } catch (e: any) {
      toast('error', e.message ?? String(e))
    } finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold-500" /></div>

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="text-xl font-bold">{editMode ? 'Modifier le colis' : 'Nouveau colis'}</h1>
          <p className="text-sm text-text-secondary">{editMode ? 'Édition d\'un colis existant' : 'Création d\'une expédition'}</p>
        </div>
      </div>

      <div className="card p-5 space-y-5">
        {/* Expéditeur */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gold-500">Expéditeur</h3>
            <button onClick={() => setShowClient(true)} className="btn-ghost text-xs"><Plus size={14} /> Nouveau client</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">Client *</label>
              <select className="input" value={form.client_id} onChange={e => set('client_id', e.target.value)}>
                <option value="">— Sélectionner —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nom_complet} — {c.telephone}</option>)}
              </select>
            </div>
            {form.client_id && (
              <div className="text-sm text-text-secondary self-end pb-2">
                {clients.find(c => String(c.id) === form.client_id)?.ville} · {clients.find(c => String(c.id) === form.client_id)?.telephone}
              </div>
            )}
          </div>
        </section>

        {/* Destinataire */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gold-500">Destinataire</h3>
            <button onClick={() => setShowDest(true)} className="btn-ghost text-xs"><Plus size={14} /> Nouveau destinataire</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">Destinataire *</label>
              <select className="input" value={form.destinataire_id} onChange={e => {
                const id = e.target.value
                set('destinataire_id', id)
                const d = destinataires.find(x => String(x.id) === id)
                if (d) { set('ville_destination', d.ville); set('adresse_livraison', d.adresse) }
              }}>
                <option value="">— Sélectionner —</option>
                {destinataires.map(d => <option key={d.id} value={d.id}>{d.nom_complet} — {d.telephone}</option>)}
              </select>
            </div>
            {form.destinataire_id && (
              <div className="text-sm text-text-secondary self-end pb-2">
                {destinataires.find(d => String(d.id) === form.destinataire_id)?.telephone}
              </div>
            )}
          </div>
        </section>

        {/* Colis */}
        <section>
          <h3 className="text-sm font-semibold text-gold-500 mb-2">Colis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="label">Contenu / description *</label>
              <input className="input" value={form.contenu} onChange={e => set('contenu', e.target.value)} placeholder="Ex: Tissus wax (3 pièces)" />
            </div>
            <div>
              <label className="label">Poids (kg) *</label>
              <input type="number" step="0.01" className="input" value={form.poids} onChange={e => set('poids', e.target.value)} />
            </div>
            <div>
              <label className="label">Valeur déclarée</label>
              <input type="number" className="input" value={form.valeur_declaree} onChange={e => set('valeur_declaree', e.target.value)} />
            </div>
            <div>
              <label className="label">Priorité</label>
              <select className="input" value={form.priorite} onChange={e => set('priorite', e.target.value as 'NORMALE' | 'EXPRESS')}>
                <option value="NORMALE">Normale</option>
                <option value="EXPRESS">Express</option>
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.fragile} onChange={e => set('fragile', e.target.checked)} className="w-4 h-4 accent-gold-500" />
                Fragile
              </label>
            </div>
          </div>
        </section>

        {/* Livraison */}
        <section>
          <h3 className="text-sm font-semibold text-gold-500 mb-2">Livraison</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="label">Ville destination *</label>
              <select className="input" value={form.ville_destination} onChange={e => set('ville_destination', e.target.value)}>
                <option value="">— Sélectionner —</option>
                {villes.map(v => <option key={v.id} value={v.nom}>{v.nom}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Adresse de livraison *</label>
              <input className="input" value={form.adresse_livraison} onChange={e => set('adresse_livraison', e.target.value)} />
            </div>
            <div>
              <label className="label">Livreur (optionnel)</label>
              <select className="input" value={form.livreur_id} onChange={e => set('livreur_id', e.target.value)}>
                <option value="">Non affecté</option>
                {livreurs.map(l => <option key={l.id} value={l.id}>{l.nom_complet}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* Paiement */}
        <section>
          <h3 className="text-sm font-semibold text-gold-500 mb-2">Paiement attendu</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">Montant à encaisser *</label>
              <input type="number" className="input" value={form.montant} onChange={e => set('montant', e.target.value)} />
            </div>
            <div>
              <label className="label">Mode de paiement</label>
              <select className="input" value={form.mode_paiement_attendu} onChange={e => set('mode_paiement_attendu', e.target.value as MoyenPaiement)}>
                {MOYENS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>
        </section>

        <div>
          <label className="label">Notes internes</label>
          <textarea className="input min-h-[80px]" value={form.notes_internes} onChange={e => set('notes_internes', e.target.value)} />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <button onClick={() => navigate(-1)} className="btn-ghost">Annuler</button>
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {editMode ? 'Enregistrer' : 'Créer le colis'}
          </button>
        </div>
      </div>

      {/* Quick client */}
      {showClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowClient(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="card p-5 w-full max-w-md relative animate-scaleIn" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold mb-4">Nouveau client</h3>
            <div className="space-y-3">
              <div><label className="label">Nom complet *</label><input className="input" value={qClient.nom} onChange={e => setQClient(s => ({ ...s, nom: e.target.value }))} /></div>
              <div><label className="label">Téléphone *</label><input className="input" value={qClient.tel} onChange={e => setQClient(s => ({ ...s, tel: e.target.value }))} /></div>
              <div><label className="label">Ville</label><input className="input" value={qClient.ville} onChange={e => setQClient(s => ({ ...s, ville: e.target.value }))} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowClient(false)} className="btn-ghost">Annuler</button>
              <button onClick={quickClient} className="btn-primary">Créer</button>
            </div>
          </div>
        </div>
      )}

      {/* Quick destinataire */}
      {showDest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowDest(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="card p-5 w-full max-w-md relative animate-scaleIn" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold mb-4">Nouveau destinataire</h3>
            <div className="space-y-3">
              <div><label className="label">Nom complet *</label><input className="input" value={qDest.nom} onChange={e => setQDest(s => ({ ...s, nom: e.target.value }))} /></div>
              <div><label className="label">Téléphone *</label><input className="input" value={qDest.tel} onChange={e => setQDest(s => ({ ...s, tel: e.target.value }))} /></div>
              <div><label className="label">Ville</label><input className="input" value={qDest.ville} onChange={e => setQDest(s => ({ ...s, ville: e.target.value }))} /></div>
              <div><label className="label">Adresse *</label><input className="input" value={qDest.adresse} onChange={e => setQDest(s => ({ ...s, adresse: e.target.value }))} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowDest(false)} className="btn-ghost">Annuler</button>
              <button onClick={quickDest} className="btn-primary">Créer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
