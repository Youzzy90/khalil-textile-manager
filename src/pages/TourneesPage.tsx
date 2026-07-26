import { useEffect, useState } from 'react'
import { Route, Truck, MapPin, Loader2, Send, Package, Users, TrendingUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { logActivite } from '../lib/audit'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { toast } from '../components/Toast'
import { formatMontant } from '../lib/format'
import { STATUT_LABELS, STATUT_COLORS } from '../lib/labels'
import { parseZones, zonesInclude } from '../lib/zones'
import type { Colis, Livreur, LigneColis } from '../types/db'

interface ColisTournee {
  id: number
  code: string
  statut: Colis['statut']
  ville_destination: string
  adresse_livraison: string
  montant: number
  livreur_id: number | null
  retrait_comptoir: boolean
  client?: { nom_complet: string; telephone: string }
  destinataire?: { nom_complet: string; telephone: string }
  lignes?: LigneColis[]
}

interface Groupe {
  livreur: Livreur | null
  colis: ColisTournee[]
  totalMontant: number
  villes: string[]
}

export function TourneesPage() {
  const { utilisateur } = useAuth()
  const [loading, setLoading] = useState(true)
  const [colis, setColis] = useState<ColisTournee[]>([])
  const [livreurs, setLivreurs] = useState<Livreur[]>([])
  const [groupes, setGroupes] = useState<Groupe[]>([])
  const [vue, setVue] = useState<'a_organiser' | 'en_cours'>('a_organiser')

  useEffect(() => { load() }, [vue])

  async function load() {
    setLoading(true)
    const [lc, ll] = await Promise.all([
      supabase.from('colis').select(`
        *,
        client:client(nom_complet, telephone),
        destinataire:destinataire(nom_complet, telephone)
      `).eq('supprime', false).order('date_reception', { ascending: true }),
      supabase.from('livreur').select('id,nom_complet,statut,zones,type_vehicule').eq('supprime', false).order('nom_complet'),
    ])

    let cs = (lc.data as ColisTournee[]) ?? []
    setLivreurs((ll.data as Livreur[]) ?? [])

    if (vue === 'a_organiser') {
      cs = cs.filter(c => !c.retrait_comptoir && (c.statut === 'RECU' || c.statut === 'EXPEDIE'))
    } else {
      cs = cs.filter(c => !c.retrait_comptoir && c.statut === 'EN_LIVRAISON')
    }

    setColis(cs)

    const ids = cs.map(c => c.id)
    let lignesMap: Record<number, LigneColis[]> = {}
    if (ids.length > 0) {
      const { data: ld } = await supabase.from('ligne_colis').select('*').in('colis_id', ids)
      ;(ld as LigneColis[] | null)?.forEach(l => {
        lignesMap[l.colis_id] = [...(lignesMap[l.colis_id] ?? []), l]
      })
    }
    cs = cs.map(c => ({ ...c, lignes: lignesMap[c.id] ?? [] }))
    setColis(cs)

    organiser(cs, (ll.data as Livreur[]) ?? [])
    setLoading(false)
  }

  function organiser(cs: ColisTournee[], ls: Livreur[]) {
    const map = new Map<number | 'none', Groupe>()

    function getGroupe(key: number | 'none', livreur: Livreur | null): Groupe {
      if (!map.has(key)) {
        map.set(key, { livreur, colis: [], totalMontant: 0, villes: [] })
      }
      return map.get(key)!
    }

    cs.forEach(c => {
      const livreurId = c.livreur_id
      const key = livreurId ? livreurId : 'none'
      const livreur = ls.find(l => l.id === livreurId) ?? null
      const g = getGroupe(key, livreur)
      g.colis.push(c)
      g.totalMontant += Number(c.montant)
      if (!g.villes.includes(c.ville_destination)) g.villes.push(c.ville_destination)
    })

    const arr = Array.from(map.values()).sort((a, b) => b.colis.length - a.colis.length)
    setGroupes(arr)
  }

  async function affecter(colisId: number, livreurId: number | null) {
    const { error } = await supabase.from('colis').update({
      livreur_id: livreurId,
      statut: livreurId ? 'EN_LIVRAISON' : 'RECU',
      date_en_livraison: livreurId ? new Date().toISOString() : null,
    }).eq('id', colisId)
    if (error) { toast('error', error.message); return }
    if (livreurId && utilisateur) {
      await supabase.from('historique_colis').insert({
        colis_id: colisId, utilisateur_id: utilisateur.id, action: 'AFFECTATION',
        statut_precedent: 'EXPEDIE', statut_nouveau: 'EN_LIVRAISON',
        details: `Livreur ${livreurId}`,
      })
      await logActivite(utilisateur, 'TOURNEE', 'AFFECTATION', { type: 'colis', id: colisId }, { livreur_id: livreurId })
    }
    toast('success', livreurId ? 'Colis ajouté à la tournée.' : 'Colis retiré de la tournée.')
    load()
  }

  async function dispatcher(livreurId: number) {
    const g = groupes.find(g => g.livreur?.id === livreurId)
    if (!g || g.colis.length === 0) return
    const ids = g.colis.map(c => c.id)
    const { error } = await supabase.from('colis').update({
      statut: 'EN_LIVRAISON', date_en_livraison: new Date().toISOString(),
    }).in('id', ids)
    if (error) { toast('error', error.message); return }
    if (utilisateur) {
      await supabase.from('historique_colis').insert(
        ids.map(id => ({ colis_id: id, utilisateur_id: utilisateur.id, action: 'DISPATCH', statut_nouveau: 'EN_LIVRAISON' }))
      )
      await logActivite(utilisateur, 'TOURNEE', 'DISPATCH', { type: 'livreur', id: livreurId }, { colis: ids.length })
    }
    toast('success', `Tournée de ${g.livreur?.nom_complet} dispatchée (${ids.length} colis).`)
    setVue('en_cours')
  }

  const totalColis = colis.length
  const totalMontant = colis.reduce((s, c) => s + Number(c.montant), 0)
  const nbLivreurs = groupes.filter(g => g.livreur).length

  return (
    <div>
      <PageHeader title="Tournées" subtitle="Organisez et dispatchez les colis par livreur et par zone"
        actions={
          <div className="flex gap-1 rounded-lg bg-bg-soft/50 p-1">
            <button onClick={() => setVue('a_organiser')} className={`px-3 py-1.5 text-sm rounded-md transition ${vue === 'a_organiser' ? 'bg-gold-500 text-black font-medium' : 'text-text-secondary hover:text-text-primary'}`}>À organiser</button>
            <button onClick={() => setVue('en_cours')} className={`px-3 py-1.5 text-sm rounded-md transition ${vue === 'en_cours' ? 'bg-gold-500 text-black font-medium' : 'text-text-secondary hover:text-text-primary'}`}>En cours</button>
          </div>
        } />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <StatCard label={vue === 'a_organiser' ? 'Colis à organiser' : 'Colis en livraison'} value={String(totalColis)} icon={Package} accent />
        <StatCard label="Montant total" value={formatMontant(totalMontant)} icon={TrendingUp} />
        <StatCard label="Livreurs concernés" value={String(nbLivreurs)} icon={Truck} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold-500" /></div>
      ) : groupes.length === 0 ? (
        <div className="card py-16 text-center">
          <Route className="mx-auto text-text-muted mb-3" size={32} />
          <div className="font-semibold">{vue === 'a_organiser' ? 'Aucun colis à organiser' : 'Aucune tournée en cours'}</div>
          <div className="text-sm text-text-muted mt-1">
            {vue === 'a_organiser' ? 'Les colis reçus ou expédiés apparaîtront ici pour être dispatchés.' : 'Les colis mis en livraison apparaîtront ici.'}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {groupes.map((g, i) => (
            <div key={i} className="card overflow-hidden animate-fadeIn" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center justify-between p-4 border-b border-border bg-bg-soft/30">
                <div className="flex items-center gap-3">
                  {g.livreur ? (
                    <>
                      <div className="w-10 h-10 rounded-lg bg-gold-grad text-black flex items-center justify-center font-bold shrink-0">
                        <Truck size={18} />
                      </div>
                      <div>
                        <div className="font-semibold">{g.livreur.nom_complet}</div>
                        <div className="text-xs text-text-muted flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1"><MapPin size={11} /> {g.villes.join(', ')}</span>
                          <span>·</span>
                          <span>{g.colis.length} colis</span>
                          <span>·</span>
                          <span className="font-mono text-gold-500">{formatMontant(g.totalMontant)}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-lg bg-bg-hover text-text-muted flex items-center justify-center shrink-0">
                        <Users size={18} />
                      </div>
                      <div>
                        <div className="font-semibold">Non affectés</div>
                        <div className="text-xs text-text-muted">{g.colis.length} colis en attente d'affectation</div>
                      </div>
                    </>
                  )}
                </div>

                {vue === 'a_organiser' && g.livreur && g.colis.length > 0 && (
                  <button onClick={() => dispatcher(g.livreur!.id)} className="btn-primary">
                    <Send size={14} /> Dispatcher la tournée
                  </button>
                )}
              </div>

              <div className="divide-y divide-border">
                {g.colis.map(c => (
                  <div key={c.id} className="flex items-center gap-3 p-3 hover:bg-bg-soft/30 transition">
                    <div className="w-9 h-9 rounded-md bg-bg-soft text-text-secondary flex items-center justify-center shrink-0 font-mono text-xs">
                      {c.code.slice(-4)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{c.code}</span>
                        <span className={`badge text-[10px] ${STATUT_COLORS[c.statut]}`}>{STATUT_LABELS[c.statut]}</span>
                        <span className="text-xs text-text-muted flex items-center gap-1"><MapPin size={10} /> {c.ville_destination}</span>
                      </div>
                      <div className="text-xs text-text-muted mt-0.5 truncate">
                        {c.destinataire?.nom_complet} · {c.adresse_livraison}
                      </div>
                      {c.lignes && c.lignes.length > 0 && (
                        <div className="text-[11px] text-text-secondary mt-1">
                          {c.lignes.map(l => `${l.designation} ×${l.quantite}`).join(' · ')}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-sm font-semibold text-gold-500">{formatMontant(c.montant)}</div>
                      {vue === 'a_organiser' && (
                        <select
                          className="text-xs bg-transparent border-0 text-text-muted cursor-pointer hover:text-text-primary mt-0.5"
                          value={c.livreur_id ?? ''}
                          onChange={e => affecter(c.id, e.target.value ? Number(e.target.value) : null)}
                        >
                          <option value="">Non affecté</option>
                          {livreurs.filter(l => l.statut === 'ACTIF').map(l => (
                            <option key={l.id} value={l.id}>
                              {l.nom_complet}{zonesInclude(l.zones, c.ville_destination) ? ' ✓' : ''}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
