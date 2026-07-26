import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Edit3, Trash2, Send, Truck, CheckCircle2, RotateCcw, XCircle,
  Banknote, Printer, MessageSquare, Clock, Loader2, MapPin, Sparkles, Package, CheckCircle,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { logActivite, genererNumeroRecu, genererNumeroEcriture } from '../lib/audit'
import { toast } from '../components/Toast'
import { Modal } from '../components/Modal'
import { StatusBadge } from '../components/StatusBadge'
import { formatMontant, formatDateTime, formatDate } from '../lib/format'
import { MOYEN_LABELS, STATUT_LABELS } from '../lib/labels'
import { trouverLivreurPourVille, zonesInclude, parseZones } from '../lib/zones'
import type { Colis, HistoriqueColis, Commentaire, Paiement, MoyenPaiement, Livreur, LigneColis } from '../types/db'

export function ColisDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { utilisateur } = useAuth()
  const isAdmin = utilisateur?.role === 'ADMIN'
  const [colis, setColis] = useState<Colis | null>(null)
  const [historique, setHistorique] = useState<HistoriqueColis[]>([])
  const [commentaires, setCommentaires] = useState<Commentaire[]>([])
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [livreurs, setLivreurs] = useState<Livreur[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'infos' | 'historique' | 'paiements' | 'commentaires'>('infos')
  const [newComment, setNewComment] = useState('')
  const [showPay, setShowPay] = useState(false)
  const [showAffect, setShowAffect] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [affectLivreur, setAffectLivreur] = useState('')
  const [cancelMotif, setCancelMotif] = useState('')
  const [payForm, setPayForm] = useState({ montant: '', moyen: 'ESPECES' as MoyenPaiement, reference: '' })
  const [lignes, setLignes] = useState<LigneColis[]>([])

  useEffect(() => { if (id) load() }, [id])

  async function load() {
    setLoading(true)
    const [c, h, cm, p, l, li] = await Promise.all([
      supabase.from('colis').select(`*, client:client(*), destinataire:destinataire(*), livreur:livreur(*)`)
        .eq('id', id).maybeSingle(),
      supabase.from('historique_colis').select(`*, utilisateur:utilisateur(nom_complet)`)
        .eq('colis_id', id).order('date_heure', { ascending: false }),
      supabase.from('commentaire').select(`*, utilisateur:utilisateur(nom_complet)`)
        .eq('colis_id', id).order('created_at', { ascending: false }),
      supabase.from('paiement').select('*').eq('colis_id', id).order('date_paiement', { ascending: false }),
      supabase.from('livreur').select('id,nom_complet,statut,zones,type_commission,valeur_commission').eq('supprime', false).order('nom_complet'),
      supabase.from('ligne_colis').select('*').eq('colis_id', id).order('id'),
    ])
    setColis(c.data as unknown as Colis)
    setHistorique((h.data as HistoriqueColis[]) ?? [])
    setCommentaires((cm.data as Commentaire[]) ?? [])
    setPaiements((p.data as Paiement[]) ?? [])
    setLivreurs((l.data as Livreur[]) ?? [])
    setLignes((li.data as LigneColis[]) ?? [])
    setLoading(false)
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold-500" /></div>
  if (!colis) return <div className="card p-8 text-center text-text-muted">Colis introuvable.</div>

  const solde = Number(colis.montant) - Number(colis.montant_paye)
  const verrou = colis.statut === 'LIVRE' || colis.statut === 'ANNULE'

  async function changerStatut(nouveau: Colis['statut'], details?: Record<string, unknown>) {
    if (!utilisateur || !colis) return
    const ancien = colis.statut
    const patch: Partial<Colis> = { statut: nouveau }
    const now = new Date().toISOString()
    if (nouveau === 'EXPEDIE') patch.date_expedition = now
    if (nouveau === 'EN_LIVRAISON') patch.date_en_livraison = now
    if (nouveau === 'LIVRE') patch.date_livraison = now
    if (nouveau === 'ANNULE') { patch.date_annulation = now; patch.motif_annulation = cancelMotif || null }

    const { error } = await supabase.from('colis').update(patch).eq('id', colis.id)
    if (error) { toast('error', error.message); return }
    await supabase.from('historique_colis').insert({
      colis_id: colis.id, utilisateur_id: utilisateur.id, action: 'STATUS_CHANGE',
      statut_precedent: ancien, statut_nouveau: nouveau, details: details ? JSON.stringify(details) : null,
    })
    await logActivite(utilisateur, 'COLIS', 'COLIS_STATUS', { type: 'colis', id: colis.id }, { ancien, nouveau })

    // Commission on delivery (FIXE only)
    if (nouveau === 'LIVRE' && colis.livreur_id) {
      const liv = livreurs.find(l => l.id === colis.livreur_id)
      if (liv && liv.type_commission === 'FIXE') {
        const montant = Number(liv.valeur_commission)
        if (montant > 0) {
          await supabase.from('commission_livreur').insert({
            livreur_id: liv.id, colis_id: colis.id, montant,
          })
        }
      }
    }

    toast('success', `Statut → ${STATUT_LABELS[nouveau]}`)
    setCancelMotif(''); setShowCancel(false)
    load()
  }

  async function affecter() {
    if (!affectLivreur) { toast('error', 'Sélectionnez un livreur.'); return }
    const livreurId = Number(affectLivreur)
    const { error } = await supabase.from('colis').update({ livreur_id: livreurId, statut: 'EN_LIVRAISON', date_en_livraison: new Date().toISOString() })
      .eq('id', colis!.id)
    if (error) { toast('error', error.message); return }
    await supabase.from('historique_colis').insert({
      colis_id: colis!.id, utilisateur_id: utilisateur!.id, action: 'AFFECT',
      statut_precedent: colis!.statut, statut_nouveau: 'EN_LIVRAISON',
      details: JSON.stringify({ livreur_id: livreurId }),
    })
    await logActivite(utilisateur!, 'COLIS', 'COLIS_AFFECT', { type: 'colis', id: colis!.id })
    toast('success', 'Colis affecté au livreur.')
    setShowAffect(false); setAffectLivreur('')
    load()
  }

  async function encaisser() {
    if (!utilisateur || !colis) return
    const m = Number(payForm.montant)
    if (!m || m <= 0) { toast('error', 'Montant invalide.'); return }
    if (m > solde + 0.01) { toast('error', 'Le montant dépasse le solde dû.'); return }
    if (['WAVE', 'ORANGE_MONEY', 'CARTE', 'VIREMENT'].includes(payForm.moyen) && !payForm.reference) {
      toast('error', 'Référence obligatoire pour ce moyen.'); return
    }
    const numRecu = await genererNumeroRecu()
    const numEcr = await genererNumeroEcriture()
    const newPaye = Number(colis.montant_paye) + m
    const { error: e1 } = await supabase.from('paiement').insert({
      colis_id: colis.id, numero_recu: numRecu, montant: m, moyen: payForm.moyen,
      reference: payForm.reference || null, utilisateur_id: utilisateur.id,
    })
    if (e1) { toast('error', e1.message); return }
    await supabase.from('colis').update({
      montant_paye: newPaye, paye: newPaye >= Number(colis.montant) - 0.01,
    }).eq('id', colis.id)
    await supabase.from('ecriture_comptable').insert({
      numero: numEcr, sens: 'ENTREE', categorie: 'RECETTE_LIVRAISON',
      libelle: `Paiement colis ${colis.code}`, montant: m, moyen: payForm.moyen,
      colis_id: colis.id, utilisateur_id: utilisateur.id, automatique: true,
    })
    await logActivite(utilisateur, 'PAIEMENT', 'PAYMENT_RECORD', { type: 'colis', id: colis.id }, { montant: m, moyen: payForm.moyen })
    toast('success', `Paiement de ${formatMontant(m)} enregistré. Reçu ${numRecu}.`)
    setShowPay(false); setPayForm({ montant: '', moyen: 'ESPECES', reference: '' })
    load()
  }

  async function ajouterComment() {
    if (!utilisateur || !colis || !newComment.trim()) return
    const { error } = await supabase.from('commentaire').insert({
      colis_id: colis.id, utilisateur_id: utilisateur.id, texte: newComment.trim(),
    })
    if (error) { toast('error', error.message); return }
    setNewComment('')
    load()
  }

  async function supprimer() {
    if (!colis) return
    if (!confirm(`Confirmer la suppression (soft) du colis ${colis.code} ?`)) return
    const { error } = await supabase.from('colis').update({ supprime: true }).eq('id', colis.id)
    if (error) { toast('error', error.message); return }
    await logActivite(utilisateur!, 'COLIS', 'COLIS_DELETE', { type: 'colis', id: colis.id })
    toast('success', 'Colis supprimé.')
    navigate('/colis')
  }

  const actions = []
  if (colis.retrait_comptoir) {
    if (colis.statut === 'RECU') actions.push({ label: 'Marquer récupéré', icon: CheckCircle2, action: () => changerStatut('LIVRE'), cls: 'btn-primary' })
  } else {
    if (colis.statut === 'RECU') actions.push({ label: 'Expédier', icon: Send, action: () => changerStatut('EXPEDIE'), cls: 'btn-secondary' })
    if (colis.statut === 'EXPEDIE') actions.push({ label: 'Affecter / Mettre en livraison', icon: Truck, action: () => { const m = trouverLivreurPourVille(colis.ville_destination, livreurs); setAffectLivreur(m ? String(m.id) : ''); setShowAffect(true) }, cls: 'btn-secondary' })
    if (colis.statut === 'EN_LIVRAISON') {
      actions.push({ label: 'Marquer livré', icon: CheckCircle2, action: () => changerStatut('LIVRE'), cls: 'btn-primary' })
      actions.push({ label: 'Retourné', icon: RotateCcw, action: () => changerStatut('RETOURNE'), cls: 'btn-danger' })
    }
  }
  if (colis.statut === 'RETOURNE' && isAdmin) actions.push({ label: 'Relivrer', icon: Send, action: () => changerStatut('RECU'), cls: 'btn-ghost' })
  if ((colis.statut === 'RECU' || colis.statut === 'EXPEDIE') && !verrou)
    actions.push({ label: 'Annuler', icon: XCircle, action: () => setShowCancel(true), cls: 'btn-danger' })
  if (solde > 0.01 && colis.statut !== 'ANNULE') actions.push({ label: 'Encaisser', icon: Banknote, action: () => setShowPay(true), cls: 'btn-primary' })

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/colis')} className="btn-ghost p-2"><ArrowLeft size={18} /></button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold font-mono text-gold-500">{colis.code}</h1>
              <StatusBadge statut={colis.statut} />
              {colis.priorite === 'EXPRESS' && <span className="badge bg-gold-500/20 text-gold-500 border border-gold-500/40">Express</span>}
              {colis.retrait_comptoir && <span className="badge bg-info-100/20 text-info-300 border border-info-500/30">Retrait comptoir</span>}
            </div>
            <p className="text-sm text-text-secondary mt-0.5">Reçu le {formatDateTime(colis.date_reception)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!verrou && <button onClick={() => navigate(`/colis/${colis.id}/modifier`)} className="btn-secondary"><Edit3 size={16} /> Modifier</button>}
          {isAdmin && <button onClick={supprimer} className="btn-danger"><Trash2 size={16} /> Supprimer</button>}
        </div>
      </div>

      {/* Action bar */}
      {actions.length > 0 && (
        <div className="card p-3 mb-4 flex flex-wrap gap-2">
          {actions.map((a, i) => (
            <button key={i} onClick={a.action} className={a.cls}><a.icon size={16} /> {a.label}</button>
          ))}
          <button onClick={() => window.print()} className="btn-ghost ml-auto"><Printer size={16} /> Imprimer étiquette</button>
        </div>
      )}

      {/* Solde banner */}
      {solde > 0.01 && colis.statut !== 'ANNULE' && (
        <div className="card p-4 mb-4 border-warning-500/30 bg-warning-500/5 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <Clock className="text-warning-500" size={20} />
            <div>
              <div className="text-sm font-semibold">Solde à encaisser : {formatMontant(solde)}</div>
              <div className="text-xs text-text-secondary">Payé {formatMontant(colis.montant_paye)} sur {formatMontant(colis.montant)}</div>
            </div>
          </div>
          <button onClick={() => setShowPay(true)} className="btn-primary"><Banknote size={16} /> Encaisser</button>
        </div>
      )}

      {/* Suivi visuel */}
      <ColisStepper colis={colis} />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-4">
        {[
          { k: 'infos', label: 'Informations' },
          { k: 'historique', label: `Historique (${historique.length})` },
          { k: 'paiements', label: `Paiements (${paiements.length})` },
          { k: 'commentaires', label: `Commentaires (${commentaires.length})` },
        ].map(t => (
          <button key={t.k} onClick={() => setTab(t.k as typeof tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${tab === t.k ? 'border-gold-500 text-gold-500' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'infos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gold-500 mb-3 flex items-center gap-2"><MapPin size={14} /> Destinataire</h3>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-text-muted">Nom</dt><dd className="font-medium">{colis.destinataire?.nom_complet}</dd></div>
              <div><dt className="text-text-muted">Téléphone</dt><dd className="font-mono">{colis.destinataire?.telephone}</dd></div>
              <div><dt className="text-text-muted">Ville</dt><dd className="font-medium text-gold-500">{colis.ville_destination}</dd></div>
              <div><dt className="text-text-muted">Adresse</dt><dd>{colis.adresse_livraison}</dd></div>
            </dl>
          </div>
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gold-500 mb-3">Expéditeur</h3>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-text-muted">Nom</dt><dd className="font-medium">{colis.client?.nom_complet}</dd></div>
              <div><dt className="text-text-muted">Téléphone</dt><dd className="font-mono">{colis.client?.telephone}</dd></div>
              <div><dt className="text-text-muted">Ville</dt><dd>{colis.client?.ville}</dd></div>
            </dl>
          </div>
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gold-500 mb-3">Colis</h3>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-text-muted">Contenu</dt><dd>{colis.contenu}</dd></div>
              <div><dt className="text-text-muted">Priorité</dt><dd>{colis.priorite === 'EXPRESS' ? 'Express' : 'Normale'}</dd></div>
              {lignes.length > 0 && (
                <div className="pt-2 border-t border-border mt-2">
                  <dt className="text-text-muted mb-1.5">Articles ({lignes.length})</dt>
                  <dd>
                    <div className="space-y-1">
                      {lignes.map(l => (
                        <div key={l.id} className="flex justify-between text-xs">
                          <span>{l.designation} <span className="text-text-muted">×{l.quantite}</span></span>
                          <span className="font-mono text-gold-500">{formatMontant(l.montant)}</span>
                        </div>
                      ))}
                    </div>
                  </dd>
                </div>
              )}
            </dl>
          </div>
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-gold-500 mb-3">Paiement & livraison</h3>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-text-muted">Montant</dt><dd className="font-mono font-semibold text-gold-500">{formatMontant(colis.montant)}</dd></div>
              <div><dt className="text-text-muted">Payé</dt><dd className="font-mono">{formatMontant(colis.montant_paye)}</dd></div>
              <div><dt className="text-text-muted">Mode attendu</dt><dd>{MOYEN_LABELS[colis.mode_paiement_attendu]}</dd></div>
              <div><dt className="text-text-muted">Livreur</dt><dd>{colis.retrait_comptoir ? <span className="text-info-300">Retrait au comptoir</span> : (colis.livreur?.nom_complet ?? <span className="text-text-muted">Non affecté</span>)}</dd></div>
              {colis.notes_internes && <div><dt className="text-text-muted">Notes</dt><dd>{colis.notes_internes}</dd></div>}
            </dl>
          </div>
        </div>
      )}

      {tab === 'historique' && (
        <div className="card p-4">
          <div className="space-y-3">
            {historique.map(h => (
              <div key={h.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-gold-500" />
                  <div className="w-px flex-1 bg-border" />
                </div>
                <div className="pb-4 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{h.action}</span>
                    {h.statut_precedent && <span className="text-xs text-text-muted">{STATUT_LABELS[h.statut_precedent]} →</span>}
                    {h.statut_nouveau && <span className="text-xs font-medium text-gold-500">{STATUT_LABELS[h.statut_nouveau]}</span>}
                  </div>
                  <div className="text-xs text-text-secondary mt-0.5">
                    {formatDateTime(h.date_heure)} · {h.utilisateur?.nom_complet ?? 'Système'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'paiements' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead><tr><th className="th">Reçu</th><th className="th">Date</th><th className="th">Montant</th><th className="th">Moyen</th><th className="th">Référence</th></tr></thead>
            <tbody>
              {paiements.length === 0 ? <tr><td colSpan={5} className="td text-center text-text-muted py-8">Aucun paiement</td></tr> :
                paiements.map(p => (
                  <tr key={p.id} className="table-row">
                    <td className="td font-mono text-gold-500">{p.numero_recu}</td>
                    <td className="td">{formatDateTime(p.date_paiement)}</td>
                    <td className="td font-mono">{formatMontant(p.montant)}</td>
                    <td className="td">{MOYEN_LABELS[p.moyen]}</td>
                    <td className="td font-mono text-xs">{p.reference ?? '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'commentaires' && (
        <div className="card p-4">
          <div className="space-y-3 mb-4">
            {commentaires.length === 0 ? <div className="text-sm text-text-muted text-center py-6">Aucun commentaire</div> :
              commentaires.map(c => (
                <div key={c.id} className="bg-bg-soft rounded-lg p-3">
                  <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
                    <span className="font-medium text-text-primary">{c.utilisateur?.nom_complet ?? 'Utilisateur'}</span>
                    <span>{formatDateTime(c.created_at)}</span>
                  </div>
                  <div className="text-sm">{c.texte}</div>
                </div>
              ))}
          </div>
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="Ajouter un commentaire…" value={newComment} onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') ajouterComment() }} />
            <button onClick={ajouterComment} className="btn-secondary"><MessageSquare size={16} /> Ajouter</button>
          </div>
        </div>
      )}

      {/* Modal Paiement */}
      <Modal open={showPay} onClose={() => setShowPay(false)} title="Encaisser un paiement"
        footer={<><button onClick={() => setShowPay(false)} className="btn-ghost">Annuler</button><button onClick={encaisser} className="btn-primary"><Banknote size={16} /> Valider</button></>}>
        <div className="space-y-3">
          <div className="bg-bg-soft rounded-lg p-3 text-sm">
            <div className="flex justify-between"><span className="text-text-secondary">Solde dû</span><span className="font-mono font-semibold text-gold-500">{formatMontant(solde)}</span></div>
          </div>
          <div><label className="label">Montant à encaisser *</label><input type="number" className="input" value={payForm.montant} onChange={e => setPayForm(s => ({ ...s, montant: e.target.value }))} placeholder={String(solde)} /></div>
          <div><label className="label">Moyen de paiement</label>
            <select className="input" value={payForm.moyen} onChange={e => setPayForm(s => ({ ...s, moyen: e.target.value as MoyenPaiement }))}>
              {Object.entries(MOYEN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          {['WAVE', 'ORANGE_MONEY', 'CARTE', 'VIREMENT'].includes(payForm.moyen) && (
            <div><label className="label">Référence transaction *</label><input className="input" value={payForm.reference} onChange={e => setPayForm(s => ({ ...s, reference: e.target.value }))} /></div>
          )}
        </div>
      </Modal>

      {/* Modal Affectation */}
      <Modal open={showAffect} onClose={() => setShowAffect(false)} title="Affecter à un livreur"
        footer={<><button onClick={() => setShowAffect(false)} className="btn-ghost">Annuler</button><button onClick={affecter} className="btn-primary"><Truck size={16} /> Affecter</button></>}>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm bg-bg-soft rounded-lg p-3">
            <MapPin size={15} className="text-gold-500 shrink-0" />
            <span className="text-text-secondary">Zone de livraison :</span>
            <span className="font-semibold text-text-primary">{colis.ville_destination}</span>
          </div>
          {(() => {
            const couvrant = livreurs.filter(l => l.statut === 'ACTIF' && zonesInclude(l.zones, colis.ville_destination))
            if (couvrant.length > 0) {
              return (
                <div className="rounded-lg border border-success-500/30 bg-success-500/5 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-success-500 mb-1.5">
                    <Sparkles size={14} /> Livreur{couvrant.length > 1 ? 's' : ''} recommandé{couvrant.length > 1 ? 's' : ''} pour cette zone
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {couvrant.map(l => (
                      <span key={l.id} className="badge bg-success-500/10 text-success-500 border border-success-500/30">
                        {l.nom_complet} · {parseZones(l.zones).length} zone{parseZones(l.zones).length > 1 ? 's' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )
            }
            return <div className="rounded-lg border border-warning-500/30 bg-warning-500/5 p-3 text-sm text-warning-300 flex items-center gap-2"><MapPin size={14} /> Aucun livreur assigné à cette zone. Choisissez-en un manuellement.</div>
          })()}
          <div><label className="label">Livreur</label>
            <select className="input" value={affectLivreur} onChange={e => setAffectLivreur(e.target.value)}>
              <option value="">— Sélectionner —</option>
              <optgroup label="Couvre la zone">
                {livreurs.filter(l => l.statut === 'ACTIF' && zonesInclude(l.zones, colis.ville_destination)).map(l => <option key={l.id} value={l.id}>{l.nom_complet}</option>)}
              </optgroup>
              {livreurs.filter(l => l.statut === 'ACTIF' && !zonesInclude(l.zones, colis.ville_destination)).length > 0 && (
                <optgroup label="Autres livreurs actifs">
                  {livreurs.filter(l => l.statut === 'ACTIF' && !zonesInclude(l.zones, colis.ville_destination)).map(l => <option key={l.id} value={l.id}>{l.nom_complet}</option>)}
                </optgroup>
              )}
            </select>
          </div>
          <p className="text-xs text-text-muted">Le colis passera au statut « En livraison ».</p>
        </div>
      </Modal>

      {/* Modal Annulation */}
      <Modal open={showCancel} onClose={() => setShowCancel(false)} title="Annuler le colis"
        footer={<><button onClick={() => setShowCancel(false)} className="btn-ghost">Annuler</button><button onClick={() => changerStatut('ANNULE', { motif: cancelMotif })} className="btn-danger"><XCircle size={16} /> Confirmer</button></>}>
        <div><label className="label">Motif d'annulation</label><textarea className="input min-h-[80px]" value={cancelMotif} onChange={e => setCancelMotif(e.target.value)} placeholder="Raison de l'annulation…" /></div>
      </Modal>
    </div>
  )
}

const STEPS: { key: Colis['statut']; label: string; dateKey: keyof Colis }[] = [
  { key: 'RECU', label: 'Reçu', dateKey: 'date_reception' },
  { key: 'EXPEDIE', label: 'Expédié', dateKey: 'date_expedition' },
  { key: 'EN_LIVRAISON', label: 'En livraison', dateKey: 'date_en_livraison' },
  { key: 'LIVRE', label: 'Livré', dateKey: 'date_livraison' },
]

function ColisStepper({ colis }: { colis: Colis }) {
  const annule = colis.statut === 'ANNULE' || colis.statut === 'RETOURNE'
  const currentIdx = STEPS.findIndex(s => s.key === colis.statut)
  const reachedIdx = annule ? -1 : currentIdx

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2"><Package size={14} className="text-gold-500" /> Suivi du colis</h3>
        <span className="font-mono text-xs text-text-muted">{colis.code}</span>
      </div>
      {annule ? (
        <div className="flex items-center gap-3 rounded-lg border border-danger-500/30 bg-danger-500/5 px-4 py-3">
          {colis.statut === 'ANNULE' ? <XCircle size={20} className="text-danger-500" /> : <RotateCcw size={20} className="text-danger-500" />}
          <div>
            <div className="text-sm font-semibold text-danger-500">{STATUT_LABELS[colis.statut]}</div>
            <div className="text-xs text-text-muted">{colis.motif_annulation ?? '—'} · {formatDate(colis.date_annulation)}</div>
          </div>
        </div>
      ) : (
        <div className="flex items-center">
          {STEPS.map((step, i) => {
            const done = i < reachedIdx
            const active = i === reachedIdx
            const date = colis[step.dateKey] as string | null
            return (
              <div key={step.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5 relative">
                  <div className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500
                    ${done ? 'bg-success-500 text-white' : active ? 'bg-gold-grad text-black shadow-glow animate-pulseGold' : 'bg-bg-hover text-text-muted border border-border'}`}>
                    {done ? <CheckCircle size={18} /> : active ? <span className="text-sm font-bold">{i + 1}</span> : <span className="text-sm font-bold">{i + 1}</span>}
                  </div>
                  <div className="text-center">
                    <div className={`text-xs font-medium ${active ? 'text-gold-500' : done ? 'text-success-500' : 'text-text-muted'}`}>{step.label}</div>
                    {date && <div className="text-[10px] text-text-muted font-mono whitespace-nowrap">{formatDate(date)}</div>}
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 rounded-full overflow-hidden bg-border relative">
                    <div className={`absolute inset-0 origin-left transition-transform duration-700 ${done ? 'bg-success-500 scale-x-100' : 'scale-x-0'}`} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
