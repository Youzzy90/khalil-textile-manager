import { useEffect, useState } from 'react'
import { Save, Building2, Palette, Database, Trash2, Loader2, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { logActivite } from '../lib/audit'
import { PageHeader } from '../components/PageHeader'
import { Card } from '../components/StatCard'
import { Modal } from '../components/Modal'
import { toast } from '../components/Toast'
import type { Parametre, Ville } from '../types/db'

export function ParametresPage() {
  const { utilisateur } = useAuth()
  const [tab, setTab] = useState<'entreprise' | 'apparence' | 'villes' | 'donnees'>('entreprise')
  const [params, setParams] = useState<Record<string, string>>({})
  const [villes, setVilles] = useState<Ville[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [resetConfirm, setResetConfirm] = useState('')
  const [newVille, setNewVille] = useState({ nom: '', region: '', tarif_port: '0' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [p, v] = await Promise.all([
      supabase.from('parametre').select('*'),
      supabase.from('ville').select('*').order('nom'),
    ])
    const map: Record<string, string> = {}
    ;((p.data as Parametre[]) ?? []).forEach(x => { map[x.cle] = x.valeur ?? '' })
    setParams(map)
    setVilles((v.data as Ville[]) ?? [])
    setLoading(false)
  }

  function set(k: string, v: string) { setParams(s => ({ ...s, [k]: v })) }

  async function save() {
    if (!utilisateur) return
    setSaving(true)
    try {
      const updates = Object.entries(params).map(([cle, valeur]) =>
        supabase.from('parametre').update({ valeur }).eq('cle', cle),
      )
      await Promise.all(updates)
      await logActivite(utilisateur, 'SETTINGS', 'SETTINGS_CHANGE', undefined, { keys: Object.keys(params) })
      toast('success', 'Paramètres enregistrés.')
    } catch (e: any) { toast('error', e.message) }
    finally { setSaving(false) }
  }

  async function addVille() {
    if (!newVille.nom.trim()) { toast('error', 'Nom requis.'); return }
    const { error } = await supabase.from('ville').insert({ nom: newVille.nom, region: newVille.region || null, tarif_port: Number(newVille.tarif_port) || 0 })
    if (error) { toast('error', error.message); return }
    toast('success', 'Ville ajoutée.')
    setNewVille({ nom: '', region: '', tarif_port: '0' })
    load()
  }

  async function toggleVille(v: Ville) {
    const { error } = await supabase.from('ville').update({ actif: !v.actif }).eq('id', v.id)
    if (error) { toast('error', error.message); return }
    load()
  }

  async function resetData() {
    if (resetConfirm !== 'EFFACER') { toast('error', 'Tapez EFFACER pour confirmer.'); return }
    setShowReset(false); setResetConfirm('')
    toast('info', "Réinitialisation désactivée par sécurité. Contactez le support pour cette opération.")
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold-500" /></div>

  return (
    <div>
      <PageHeader title="Paramètres" subtitle="Configuration de l'application"
        actions={<button onClick={save} disabled={saving} className="btn-primary">{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Enregistrer</button>} />

      <div className="flex gap-1 border-b border-border mb-4">
        {[
          { k: 'entreprise', l: 'Entreprise', icon: Building2 },
          { k: 'apparence', l: 'Apparence', icon: Palette },
          { k: 'villes', l: 'Villes', icon: Building2 },
          { k: 'donnees', l: 'Données', icon: Database },
        ].map(t => (
          <button key={t.k} onClick={() => setTab(t.k as typeof tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition flex items-center gap-2 ${tab === t.k ? 'border-gold-500 text-gold-500' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>
            <t.icon size={15} /> {t.l}
          </button>
        ))}
      </div>

      {tab === 'entreprise' && (
        <Card>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="label">Nom de l'entreprise</label><input className="input" value={params.entreprise_nom ?? ''} onChange={e => set('entreprise_nom', e.target.value)} /></div>
            <div className="col-span-2"><label className="label">Adresse</label><input className="input" value={params.entreprise_adresse ?? ''} onChange={e => set('entreprise_adresse', e.target.value)} /></div>
            <div><label className="label">Téléphone</label><input className="input" value={params.entreprise_telephone ?? ''} onChange={e => set('entreprise_telephone', e.target.value)} /></div>
            <div><label className="label">Email</label><input className="input" value={params.entreprise_email ?? ''} onChange={e => set('entreprise_email', e.target.value)} /></div>
            <div><label className="label">Devise</label><select className="input" value={params.devise ?? 'XOF'} onChange={e => set('devise', e.target.value)}>
              <option value="XOF">Franc CFA (XOF)</option><option value="XAF">Franc CFA (XAF)</option><option value="EUR">Euro</option><option value="USD">Dollar US</option>
            </select></div>
            <div><label className="label">Symbole devise</label><input className="input" value={params.devise_symbole ?? ''} onChange={e => set('devise_symbole', e.target.value)} /></div>
            <div><label className="label">Position symbole</label><select className="input" value={params.devise_position ?? 'apres'} onChange={e => set('devise_position', e.target.value)}>
              <option value="apres">Après le montant</option><option value="avant">Avant le montant</option>
            </select></div>
            <div><label className="label">Décimales</label><select className="input" value={params.devise_decimales ?? '0'} onChange={e => set('devise_decimales', e.target.value)}>
              <option value="0">0</option><option value="2">2</option>
            </select></div>
            <div><label className="label">Surcoût Express (FCFA)</label><input type="number" className="input" value={params.surcout_express ?? '0'} onChange={e => set('surcout_express', e.target.value)} /></div>
            <div><label className="label">Délai alerte colis en retard (heures)</label><input type="number" className="input" value={params.delai_alerte_retard_h ?? '48'} onChange={e => set('delai_alerte_retard_h', e.target.value)} /></div>
          </div>
        </Card>
      )}

      {tab === 'apparence' && (
        <Card>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Thème</label><select className="input" value={params.theme ?? 'sombre'} onChange={e => set('theme', e.target.value)}>
              <option value="sombre">Sombre (noir/or)</option><option value="clair">Clair</option>
            </select></div>
            <div><label className="label">Langue</label><select className="input" value={params.langue ?? 'fr'} onChange={e => set('langue', e.target.value)}>
              <option value="fr">Français</option><option value="en">English</option>
            </select></div>
          </div>
          <p className="text-xs text-text-muted mt-3">Le thème clair sera appliqué dans une prochaine version. La langue est réservée à l'affichage de l'interface.</p>
        </Card>
      )}

      {tab === 'villes' && (
        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold mb-3">Ajouter une ville</h3>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="label">Nom *</label><input className="input" value={newVille.nom} onChange={e => setNewVille(s => ({ ...s, nom: e.target.value }))} /></div>
              <div><label className="label">Région</label><input className="input" value={newVille.region} onChange={e => setNewVille(s => ({ ...s, region: e.target.value }))} /></div>
              <div><label className="label">Tarif port</label><input type="number" className="input" value={newVille.tarif_port} onChange={e => setNewVille(s => ({ ...s, tarif_port: e.target.value }))} /></div>
            </div>
            <button onClick={addVille} className="btn-secondary mt-3"><Save size={16} /> Ajouter</button>
          </Card>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead><tr><th className="th">Ville</th><th className="th">Région</th><th className="th">Tarif port</th><th className="th">Statut</th><th className="th"></th></tr></thead>
              <tbody>
                {villes.map(v => (
                  <tr key={v.id} className="table-row">
                    <td className="td font-medium">{v.nom}</td>
                    <td className="td">{v.region ?? '—'}</td>
                    <td className="td font-mono">{v.tarif_port}</td>
                    <td className="td">{v.actif ? <span className="badge bg-success-100/20 text-success-300 border border-success-500/30">Actif</span> : <span className="badge bg-bg-hover text-text-secondary border border-border">Inactif</span>}</td>
                    <td className="td text-right"><button onClick={() => toggleVille(v)} className="btn-ghost text-xs">{v.actif ? 'Désactiver' : 'Activer'}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'donnees' && (
        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold mb-2">Maintenance de la base</h3>
            <p className="text-sm text-text-secondary mb-3">Opérations de maintenance avancées sur la base de données.</p>
            <div className="flex gap-2">
              <button onClick={() => toast('info', 'Compaction à venir.')} className="btn-secondary"><Database size={16} /> Compacter (VACUUM)</button>
              <button onClick={() => toast('info', 'Réindexation à venir.')} className="btn-secondary"><Database size={16} /> Réindexer</button>
            </div>
          </Card>
          <Card className="border-danger-500/30">
            <h3 className="text-sm font-semibold text-danger-500 mb-2">Zone dangereuse</h3>
            <p className="text-sm text-text-secondary mb-3">Réinitialiser efface toutes les données métier (colis, clients, paiements…). Cette action est irréversible.</p>
            <button onClick={() => setShowReset(true)} className="btn-danger"><Trash2 size={16} /> Réinitialiser les données</button>
          </Card>
        </div>
      )}

      <Modal open={showReset} onClose={() => setShowReset(false)} title="Réinitialisation — CONFIRMATION"
        footer={<><button onClick={() => setShowReset(false)} className="btn-ghost">Annuler</button><button onClick={resetData} className="btn-danger">Confirmer</button></>}>
        <p className="text-sm text-text-secondary mb-3">Tapez <span className="font-mono font-bold text-danger-500">EFFACER</span> pour confirmer la réinitialisation de toutes les données.</p>
        <input className="input" value={resetConfirm} onChange={e => setResetConfirm(e.target.value)} placeholder="EFFACER" />
      </Modal>
    </div>
  )
}
