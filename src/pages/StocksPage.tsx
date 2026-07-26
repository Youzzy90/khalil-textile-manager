import { useEffect, useState } from 'react'
import { Plus, Edit3, Boxes, ArrowUpCircle, ArrowDownCircle, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { logActivite } from '../lib/audit'
import { PageHeader } from '../components/PageHeader'
import { DataTable, Column } from '../components/DataTable'
import { Modal } from '../components/Modal'
import { toast } from '../components/Toast'
import { formatMontant, formatDate } from '../lib/format'
import { UNITE_LABELS } from '../lib/labels'
import type { ArticleStock, MouvementStock } from '../types/db'

type ArticleForm = { reference: string; designation: string; categorie: string; unite: ArticleStock['unite']; quantite_actuelle: string; seuil_alerte: string; prix_unitaire: string; fournisseur: string; notes: string }
const emptyArt: ArticleForm = { reference: '', designation: '', categorie: '', unite: 'PIECE', quantite_actuelle: '0', seuil_alerte: '0', prix_unitaire: '0', fournisseur: '', notes: '' }

export function StocksPage() {
  const { utilisateur } = useAuth()
  const [arts, setArts] = useState<ArticleStock[]>([])
  const [mvts, setMvts] = useState<MouvementStock[]>([])
  const [tab, setTab] = useState<'articles' | 'mouvements'>('articles')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [openArt, setOpenArt] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [formArt, setFormArt] = useState<ArticleForm>(emptyArt)
  const [openMvt, setOpenMvt] = useState(false)
  const [mvtForm, setMvtForm] = useState({ article_id: '', type: 'ENTREE' as 'ENTREE' | 'SORTIE', quantite: '', motif: '', reference_bon: '' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [a, m] = await Promise.all([
      supabase.from('article_stock').select('*').order('designation'),
      supabase.from('article_stock').select(`id,reference,designation`).order('designation'),
    ])
    setArts((a.data as ArticleStock[]) ?? [])
    const ids = ((a.data as ArticleStock[]) ?? []).map(x => x.id)
    if (ids.length > 0) {
      const { data: mv } = await supabase.from('mouvement_stock').select(`*,article:article_stock(reference,designation)`).in('article_id', ids).order('date', { ascending: false }).limit(200)
      setMvts((mv as MouvementStock[]) ?? [])
    } else setMvts([])
    setLoading(false)
  }

  function openNewArt() { setEditId(null); setFormArt(emptyArt); setOpenArt(true) }
  function openEditArt(a: ArticleStock) {
    setEditId(a.id)
    setFormArt({ reference: a.reference, designation: a.designation, categorie: a.categorie ?? '', unite: a.unite, quantite_actuelle: String(a.quantite_actuelle), seuil_alerte: String(a.seuil_alerte), prix_unitaire: String(a.prix_unitaire), fournisseur: a.fournisseur ?? '', notes: a.notes ?? '' })
    setOpenArt(true)
  }

  async function saveArt() {
    if (!formArt.reference.trim() || !formArt.designation.trim()) { toast('error', 'Référence et désignation requises.'); return }
    const payload = {
      reference: formArt.reference, designation: formArt.designation, categorie: formArt.categorie || null,
      unite: formArt.unite, quantite_actuelle: Number(formArt.quantite_actuelle) || 0, seuil_alerte: Number(formArt.seuil_alerte) || 0,
      prix_unitaire: Number(formArt.prix_unitaire) || 0, fournisseur: formArt.fournisseur || null, notes: formArt.notes || null,
    }
    if (editId) {
      const { error } = await supabase.from('article_stock').update(payload).eq('id', editId)
      if (error) { toast('error', error.message); return }
      await logActivite(utilisateur, 'STOCK', 'ARTICLE_EDIT', { type: 'article', id: editId })
      toast('success', 'Article modifié.')
    } else {
      const { data, error } = await supabase.from('article_stock').insert(payload).select().single()
      if (error) { toast('error', error.message); return }
      await logActivite(utilisateur, 'STOCK', 'ARTICLE_CREATE', { type: 'article', id: (data as ArticleStock).id })
      toast('success', 'Article créé.')
    }
    setOpenArt(false); load()
  }

  async function saveMvt() {
    if (!utilisateur) return
    if (!mvtForm.article_id || !mvtForm.quantite || Number(mvtForm.quantite) <= 0) { toast('error', 'Article et quantité requis.'); return }
    if (!mvtForm.motif.trim()) { toast('error', 'Motif requis.'); return }
    const art = arts.find(a => a.id === Number(mvtForm.article_id))
    if (!art) return
    if (mvtForm.type === 'SORTIE' && Number(mvtForm.quantite) > Number(art.quantite_actuelle)) {
      toast('error', 'Stock insuffisant pour cette sortie.'); return
    }
    const delta = mvtForm.type === 'ENTREE' ? Number(mvtForm.quantite) : -Number(mvtForm.quantite)
    const newQ = Number(art.quantite_actuelle) + delta
    const { error: e1 } = await supabase.from('mouvement_stock').insert({
      article_id: Number(mvtForm.article_id), type: mvtForm.type, quantite: Number(mvtForm.quantite),
      motif: mvtForm.motif, reference_bon: mvtForm.reference_bon || null, utilisateur_id: utilisateur.id,
    })
    if (e1) { toast('error', e1.message); return }
    await supabase.from('article_stock').update({ quantite_actuelle: newQ }).eq('id', art.id)
    // Alert if below threshold
    if (newQ <= Number(art.seuil_alerte) && art.seuil_alerte > 0) {
      await supabase.from('alerte').insert({
        type: 'STOCK_LOW', cible_type: 'article', cible_id: art.id,
        message: `Stock bas : ${art.designation} (${newQ} ${UNITE_LABELS[art.unite]})`, gravite: 'MOYENNE',
      })
    }
    await logActivite(utilisateur, 'STOCK', 'MVT_CREATE', { type: 'article', id: art.id }, { type: mvtForm.type, qte: mvtForm.quantite })
    toast('success', 'Mouvement enregistré.')
    setOpenMvt(false); setMvtForm({ article_id: '', type: 'ENTREE', quantite: '', motif: '', reference_bon: '' })
    load()
  }

  const filtered = arts.filter(a => !search || a.designation.toLowerCase().includes(search.toLowerCase()) || a.reference.toLowerCase().includes(search.toLowerCase()))
  const valeurTotale = arts.reduce((s, a) => s + Number(a.quantite_actuelle) * Number(a.prix_unitaire), 0)
  const alertes = arts.filter(a => Number(a.seuil_alerte) > 0 && Number(a.quantite_actuelle) <= Number(a.seuil_alerte))

  const artCols: Column<ArticleStock>[] = [
    { key: 'ref', header: 'Référence', sortValue: r => r.reference, render: r => <span className="font-mono text-gold-500">{r.reference}</span> },
    { key: 'des', header: 'Désignation', sortValue: r => r.designation, render: r => <div><div className="font-medium">{r.designation}</div>{r.categorie && <div className="text-xs text-text-muted">{r.categorie}</div>}</div> },
    { key: 'qte', header: 'Quantité', sortValue: r => r.quantite_actuelle, render: r => {
      const low = Number(r.seuil_alerte) > 0 && Number(r.quantite_actuelle) <= Number(r.seuil_alerte)
      return <span className={`font-mono ${low ? 'text-danger-500 font-semibold' : ''}`}>{r.quantite_actuelle} {UNITE_LABELS[r.unite]}</span>
    } },
    { key: 'seuil', header: 'Seuil', sortValue: r => r.seuil_alerte, render: r => <span className="font-mono text-text-secondary">{r.seuil_alerte}</span> },
    { key: 'prix', header: 'Prix unit.', sortValue: r => r.prix_unitaire, render: r => <span className="font-mono">{formatMontant(r.prix_unitaire)}</span> },
    { key: 'val', header: 'Valeur', sortValue: r => Number(r.quantite_actuelle) * Number(r.prix_unitaire), render: r => <span className="font-mono text-gold-500">{formatMontant(Number(r.quantite_actuelle) * Number(r.prix_unitaire))}</span> },
    { key: 'actions', header: '', render: r => (
      <div className="flex gap-1 justify-end">
        <button onClick={(e) => { e.stopPropagation(); setMvtForm({ article_id: String(r.id), type: 'ENTREE', quantite: '', motif: '', reference_bon: '' }); setOpenMvt(true) }} className="btn-ghost p-1.5 text-success-500" title="Entrée"><ArrowUpCircle size={14} /></button>
        <button onClick={(e) => { e.stopPropagation(); setMvtForm({ article_id: String(r.id), type: 'SORTIE', quantite: '', motif: '', reference_bon: '' }); setOpenMvt(true) }} className="btn-ghost p-1.5 text-danger-500" title="Sortie"><ArrowDownCircle size={14} /></button>
        <button onClick={(e) => { e.stopPropagation(); openEditArt(r) }} className="btn-ghost p-1.5"><Edit3 size={14} /></button>
      </div>
    ) },
  ]

  const mvtCols: Column<MouvementStock>[] = [
    { key: 'date', header: 'Date', sortValue: r => r.date, render: r => formatDate(r.date, true) },
    { key: 'art', header: 'Article', sortValue: r => r.article?.designation ?? '', render: r => <div><div className="font-medium">{r.article?.designation}</div><div className="text-xs font-mono text-text-muted">{r.article?.reference}</div></div> },
    { key: 'type', header: 'Type', sortValue: r => r.type, render: r => r.type === 'ENTREE'
      ? <span className="badge bg-success-100/20 text-success-300 border border-success-500/30">Entrée</span>
      : r.type === 'SORTIE' ? <span className="badge bg-danger-100/20 text-danger-300 border border-danger-500/30">Sortie</span>
      : <span className="badge bg-info-100/20 text-info-300 border border-info-500/30">Ajustement</span> },
    { key: 'qte', header: 'Quantité', sortValue: r => r.quantite, render: r => <span className="font-mono">{r.quantite}</span> },
    { key: 'motif', header: 'Motif', render: r => r.motif },
  ]

  return (
    <div>
      <PageHeader title="Stocks" subtitle={`${arts.length} articles — Valeur ${formatMontant(valeurTotale)}`} search={{ value: search, onChange: setSearch }}
        actions={<button onClick={() => { setMvtForm({ article_id: '', type: 'ENTREE', quantite: '', motif: '', reference_bon: '' }); setOpenMvt(true) }} className="btn-secondary"><ArrowUpCircle size={16} /> Mouvement</button>}
        onAdd={openNewArt} addLabel="Nouvel article" />

      {alertes.length > 0 && (
        <div className="card p-3 mb-4 border-warning-500/40 bg-warning-500/5 flex items-center gap-3 animate-fadeIn">
          <AlertTriangle className="text-warning-500" size={20} />
          <div className="text-sm">{alertes.length} article(s) en alerte de stock bas : {alertes.slice(0, 3).map(a => a.designation).join(', ')}{alertes.length > 3 ? '…' : ''}</div>
        </div>
      )}

      <div className="flex gap-1 border-b border-border mb-4">
        {[{ k: 'articles', l: `Articles (${arts.length})` }, { k: 'mouvements', l: `Mouvements (${mvts.length})` }].map(t => (
          <button key={t.k} onClick={() => setTab(t.k as 'articles' | 'mouvements')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${tab === t.k ? 'border-gold-500 text-gold-500' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>{t.l}</button>
        ))}
      </div>

      {loading ? <div className="card py-20 text-center text-text-muted">Chargement…</div> :
        tab === 'articles' ? (
          filtered.length === 0 ? (
            <div className="card"><div className="py-16 text-center"><Boxes className="mx-auto text-text-muted mb-3" size={28} /><div className="font-semibold">Aucun article</div></div></div>
          ) : <div className="card overflow-hidden"><DataTable columns={artCols} rows={filtered} rowKey={r => r.id} /></div>
        ) : (
          <div className="card overflow-hidden"><DataTable columns={mvtCols} rows={mvts} rowKey={r => r.id} pageSize={25} /></div>
        )
      }

      <Modal open={openArt} onClose={() => setOpenArt(false)} title={editId ? 'Modifier l\'article' : 'Nouvel article'}
        footer={<><button onClick={() => setOpenArt(false)} className="btn-ghost">Annuler</button><button onClick={saveArt} className="btn-primary">Enregistrer</button></>}>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Référence *</label><input className="input" value={formArt.reference} onChange={e => setFormArt(s => ({ ...s, reference: e.target.value }))} /></div>
          <div><label className="label">Désignation *</label><input className="input" value={formArt.designation} onChange={e => setFormArt(s => ({ ...s, designation: e.target.value }))} /></div>
          <div><label className="label">Catégorie</label><input className="input" value={formArt.categorie} onChange={e => setFormArt(s => ({ ...s, categorie: e.target.value }))} /></div>
          <div><label className="label">Unité</label><select className="input" value={formArt.unite} onChange={e => setFormArt(s => ({ ...s, unite: e.target.value as ArticleStock['unite'] }))}>{Object.entries(UNITE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div><label className="label">Quantité actuelle</label><input type="number" className="input" value={formArt.quantite_actuelle} onChange={e => setFormArt(s => ({ ...s, quantite_actuelle: e.target.value }))} /></div>
          <div><label className="label">Seuil d'alerte</label><input type="number" className="input" value={formArt.seuil_alerte} onChange={e => setFormArt(s => ({ ...s, seuil_alerte: e.target.value }))} /></div>
          <div><label className="label">Prix unitaire</label><input type="number" className="input" value={formArt.prix_unitaire} onChange={e => setFormArt(s => ({ ...s, prix_unitaire: e.target.value }))} /></div>
          <div><label className="label">Fournisseur</label><input className="input" value={formArt.fournisseur} onChange={e => setFormArt(s => ({ ...s, fournisseur: e.target.value }))} /></div>
        </div>
      </Modal>

      <Modal open={openMvt} onClose={() => setOpenMvt(false)} title="Mouvement de stock"
        footer={<><button onClick={() => setOpenMvt(false)} className="btn-ghost">Annuler</button><button onClick={saveMvt} className="btn-primary">Enregistrer</button></>}>
        <div className="space-y-3">
          <div><label className="label">Article *</label>
            <select className="input" value={mvtForm.article_id} onChange={e => setMvtForm(s => ({ ...s, article_id: e.target.value }))}>
              <option value="">— Sélectionner —</option>
              {arts.map(a => <option key={a.id} value={a.id}>{a.designation} ({a.quantite_actuelle} {UNITE_LABELS[a.unite]})</option>)}
            </select>
          </div>
          <div><label className="label">Type *</label><select className="input" value={mvtForm.type} onChange={e => setMvtForm(s => ({ ...s, type: e.target.value as 'ENTREE' | 'SORTIE' }))}>
            <option value="ENTREE">Entrée</option><option value="SORTIE">Sortie</option>
          </select></div>
          <div><label className="label">Quantité *</label><input type="number" className="input" value={mvtForm.quantite} onChange={e => setMvtForm(s => ({ ...s, quantite: e.target.value }))} /></div>
          <div><label className="label">Motif *</label><input className="input" value={mvtForm.motif} onChange={e => setMvtForm(s => ({ ...s, motif: e.target.value }))} placeholder="Ex: Réappro, consommation…" /></div>
          <div><label className="label">Référence bon</label><input className="input" value={mvtForm.reference_bon} onChange={e => setMvtForm(s => ({ ...s, reference_bon: e.target.value }))} /></div>
        </div>
      </Modal>
    </div>
  )
}
