import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Users, Truck, CreditCard, TrendingUp, Clock, AlertTriangle, Plus, UserPlus, Banknote, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { StatCard } from '../components/StatCard'
import { useAuth } from '../lib/auth'
import { formatMontant, formatDate } from '../lib/format'
import { GRAVITE_LABELS, GRAVITE_COLORS } from '../lib/labels'
import type { Alerte } from '../types/db'

interface DashStats {
  colisJour: number
  colisHier: number
  clientsTotal: number
  clientsNouv: number
  livreursActifs: number
  paiementsJour: number
  beneficeJour: number
  chargesJour: number
  enCours: number
}

interface JourPoint { jour: string; colis: number; revenus: number }
interface TopClient { id: number; nom: string; nb: number; ca: number }
interface PerfLivreur { id: number; nom: string; livres: number; en_cours: number; commission: number }

export function DashboardPage() {
  const { utilisateur } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashStats | null>(null)
  const [serie, setSerie] = useState<JourPoint[]>([])
  const [alertes, setAlertes] = useState<Alerte[]>([])
  const [topClients, setTopClients] = useState<TopClient[]>([])
  const [perfLivreurs, setPerfLivreurs] = useState<PerfLivreur[]>([])
  const [loading, setLoading] = useState(true)
  const isAdmin = utilisateur?.role === 'ADMIN'

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const hier = new Date(today); hier.setDate(hier.getDate() - 1)
    const tISO = today.toISOString(), hISO = hier.toISOString()

    const [
      colisJour, colisHier, clients, clientsNouv, livreurs, paiements, charges, enCours, alt,
    ] = await Promise.all([
      supabase.from('colis').select('id', { count: 'exact', head: true })
        .eq('supprime', false).gte('date_reception', tISO),
      supabase.from('colis').select('id', { count: 'exact', head: true })
        .eq('supprime', false).gte('date_reception', hISO).lt('date_reception', tISO),
      supabase.from('client').select('id', { count: 'exact', head: true }).eq('supprime', false),
      supabase.from('client').select('id', { count: 'exact', head: true })
        .eq('supprime', false).gte('created_at', tISO),
      supabase.from('livreur').select('id', { count: 'exact', head: true })
        .eq('supprime', false).eq('statut', 'ACTIF'),
      supabase.from('paiement').select('montant').eq('rembourse', false).gte('date_paiement', tISO),
      supabase.from('charge').select('montant').eq('supprime', false).gte('date', tISO.slice(0, 10)),
      supabase.from('colis').select('id', { count: 'exact', head: true })
        .in('statut', ['RECU', 'EXPEDIE', 'EN_LIVRAISON']).eq('supprime', false),
      supabase.from('alerte').select('*').eq('acquittee', false).order('created_at', { ascending: false }).limit(10),
    ])

    const sum = (rows: { montant: number }[] | null) => (rows ?? []).reduce((s, r) => s + Number(r.montant), 0)
    const payeJour = sum(paiements.data as { montant: number }[] | null)
    const chargesJour = sum(charges.data as { montant: number }[] | null)

    setStats({
      colisJour: colisJour.count ?? 0,
      colisHier: colisHier.count ?? 0,
      clientsTotal: clients.count ?? 0,
      clientsNouv: clientsNouv.count ?? 0,
      livreursActifs: livreurs.count ?? 0,
      paiementsJour: payeJour,
      chargesJour,
      beneficeJour: payeJour - chargesJour,
      enCours: enCours.count ?? 0,
    })
    setAlertes((alt.data as Alerte[]) ?? [])

    // Top clients (30 jours) — par CA encaissé
    const debut30 = new Date(today); debut30.setDate(debut30.getDate() - 30)
    const { data: p30 } = await supabase.from('paiement').select('montant, colis:colis(client_id, client:client(id, nom_complet))')
      .eq('rembourse', false).gte('date_paiement', debut30.toISOString())
    const caMap = new Map<number, { nom: string; nb: number; ca: number }>()
    ;(p30 as any[] | null)?.forEach(p => {
      const c = p.colis?.client
      if (!c) return
      const cur = caMap.get(c.id) ?? { nom: c.nom_complet, nb: 0, ca: 0 }
      cur.nb += 1; cur.ca += Number(p.montant); caMap.set(c.id, cur)
    })
    setTopClients(Array.from(caMap.entries()).map(([id, v]) => ({ id, ...v })).sort((a, b) => b.ca - a.ca).slice(0, 5))

    // Performance livreurs (30 jours) — livraisons + commissions dues
    const { data: liv30 } = await supabase.from('colis').select('id, livreur_id, statut').gte('date_reception', debut30.toISOString()).not('livreur_id', 'is', null)
    const livMap = new Map<number, { livres: number; en_cours: number }>()
    ;(liv30 as any[] | null)?.forEach(c => {
      if (!c.livreur_id) return
      const cur = livMap.get(c.livreur_id) ?? { livres: 0, en_cours: 0 }
      if (c.statut === 'LIVRE') cur.livres += 1
      else if (['EXPEDIE', 'EN_LIVRAISON'].includes(c.statut)) cur.en_cours += 1
      livMap.set(c.livreur_id, cur)
    })
    const { data: commDue } = await supabase.from('commission_livreur').select('montant, livreur_id').eq('payee', false)
    const commMap = new Map<number, number>()
    ;(commDue as any[] | null)?.forEach(c => commMap.set(c.livreur_id, (commMap.get(c.livreur_id) ?? 0) + Number(c.montant)))
    const { data: livNoms } = await supabase.from('livreur').select('id, nom_complet').eq('supprime', false).in('id', Array.from(livMap.keys()))
    setPerfLivreurs((livNoms as any[] | null ?? []).map((l: any) => ({ id: l.id, nom: l.nom_complet, livres: livMap.get(l.id)?.livres ?? 0, en_cours: livMap.get(l.id)?.en_cours ?? 0, commission: commMap.get(l.id) ?? 0 })).sort((a, b) => b.livres - a.livres).slice(0, 5))

    // 7-day series
    const jours: JourPoint[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i)
      const ds = d.toISOString().slice(0, 10)
      const next = new Date(d); next.setDate(next.getDate() + 1)
      const nextISO = next.toISOString()
      const [c, p] = await Promise.all([
        supabase.from('colis').select('id', { count: 'exact', head: true })
          .eq('supprime', false).gte('date_reception', d.toISOString()).lt('date_reception', nextISO),
        supabase.from('paiement').select('montant').eq('rembourse', false)
          .gte('date_paiement', d.toISOString()).lt('date_paiement', nextISO),
      ])
      jours.push({
        jour: d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit' }),
        colis: c.count ?? 0,
        revenus: sum(p.data as { montant: number }[] | null),
      })
    }
    setSerie(jours)
    setLoading(false)
  }

  if (loading || !stats) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin text-gold-500"><Clock size={28} /></div></div>
  }

  const variation = stats.colisHier === 0 ? null : Math.round(((stats.colisJour - stats.colisHier) / stats.colisHier) * 100)
  const maxColis = Math.max(...serie.map(s => s.colis), 1)
  const maxRevenus = Math.max(...serie.map(s => s.revenus), 1)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight">Tableau de bord</h1>
            <span className="badge bg-gold-500/10 text-gold-500 border border-gold-500/30">En direct</span>
          </div>
          <p className="text-sm text-text-secondary mt-1 capitalize">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/colis/nouveau')} className="btn-primary"><Plus size={16} /> Nouveau colis</button>
          <button onClick={() => navigate('/clients')} className="btn-secondary"><UserPlus size={16} /> Client</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Colis du jour" value={stats.colisJour} icon={Package} variation={variation} onClick={() => navigate('/colis')} />
        <StatCard label="Clients" value={stats.clientsTotal} icon={Users} onClick={() => navigate('/clients')} />
        <StatCard label="Livreurs actifs" value={stats.livreursActifs} icon={Truck} onClick={() => navigate('/livreurs')} />
        <StatCard label="Encaissé (jour)" value={formatMontant(stats.paiementsJour)} icon={CreditCard} accent onClick={() => navigate('/paiements')} />
        {isAdmin && (
          <StatCard label="Bénéfice (jour)" value={formatMontant(stats.beneficeJour)} icon={TrendingUp} accent onClick={() => navigate('/comptabilite')} />
        )}
        <StatCard label="Colis en cours" value={stats.enCours} icon={Clock} onClick={() => navigate('/colis')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold">Activité</h2>
              <p className="text-xs text-text-muted mt-0.5">7 derniers jours</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-text-secondary">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-gold-grad" /> Colis</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-success-500" /> Revenus</span>
            </div>
          </div>
          <div className="flex items-end justify-between gap-3 h-52 pt-4">
            {serie.map((p, i) => {
              const isToday = i === serie.length - 1
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2.5 group">
                  <div className="relative w-full flex items-end justify-center gap-1.5 h-full">
                    <div className="relative w-full max-w-[18px] bg-gold-500/20 rounded-t-md overflow-hidden flex items-end">
                      <div className="w-full bg-gold-grad rounded-t-md transition-all duration-500 group-hover:brightness-125"
                        style={{ height: `${Math.max((p.colis / maxColis) * 100, 4)}%` }}
                        title={`${p.colis} colis`} />
                    </div>
                    <div className="relative w-full max-w-[18px] bg-success-500/20 rounded-t-md overflow-hidden flex items-end">
                      <div className="w-full bg-success-500 rounded-t-md transition-all duration-500 group-hover:brightness-125"
                        style={{ height: `${Math.max((p.revenus / maxRevenus) * 100, 4)}%` }}
                        title={formatMontant(p.revenus)} />
                    </div>
                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-bg-elevated border border-border rounded-md px-2 py-1 text-[10px] font-mono whitespace-nowrap z-10 shadow-float">
                      {p.colis} · {formatMontant(p.revenus)}
                    </div>
                  </div>
                  <span className={`text-[10px] capitalize ${isToday ? 'text-gold-500 font-semibold' : 'text-text-muted'}`}>{p.jour}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-warning-500/15 text-warning-500"><AlertTriangle size={15} /></div>
            <h2 className="text-sm font-semibold">Alertes</h2>
            {alertes.length > 0 && <span className="badge bg-warning-100/20 text-warning-300 border border-warning-500/30 animate-pulseGold">{alertes.length}</span>}
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {alertes.length === 0 ? (
              <div className="text-sm text-text-muted py-8 text-center">
                <CheckCircle2 size={24} className="mx-auto mb-2 text-success-500/60" />
                Aucune alerte active
              </div>
            ) : alertes.map(a => (
              <div key={a.id} className={`rounded-lg px-3 py-2.5 border ${GRAVITE_COLORS[a.gravite]} transition hover:scale-[1.02]`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider">{GRAVITE_LABELS[a.gravite]}</span>
                  <span className="text-[10px] text-text-muted">{formatDate(a.created_at)}</span>
                </div>
                <div className="text-sm mt-1">{a.message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button onClick={() => navigate('/colis/nouveau')} className="card card-hover p-5 text-left group">
          <div className="p-2.5 rounded-xl bg-gold-500/15 text-gold-500 mb-3 w-fit group-hover:scale-110 transition-transform"><Package size={20} /></div>
          <div className="text-sm font-semibold">Nouveau colis</div>
          <div className="text-xs text-text-secondary mt-0.5">Enregistrer une expédition</div>
        </button>
        <button onClick={() => navigate('/paiements')} className="card card-hover p-5 text-left group">
          <div className="p-2.5 rounded-xl bg-success-500/15 text-success-500 mb-3 w-fit group-hover:scale-110 transition-transform"><Banknote size={20} /></div>
          <div className="text-sm font-semibold">Encaisser</div>
          <div className="text-xs text-text-secondary mt-0.5">Enregistrer un paiement</div>
        </button>
        <button onClick={() => navigate('/livreurs')} className="card card-hover p-5 text-left group">
          <div className="p-2.5 rounded-xl bg-info-500/15 text-info-500 mb-3 w-fit group-hover:scale-110 transition-transform"><Truck size={20} /></div>
          <div className="text-sm font-semibold">Tournées</div>
          <div className="text-xs text-text-secondary mt-0.5">Affecter un livreur</div>
        </button>
        <button onClick={() => navigate('/colis')} className="card card-hover p-5 text-left group">
          <div className="p-2.5 rounded-xl bg-bg-hover text-text-secondary mb-3 w-fit group-hover:scale-110 transition-transform"><Package size={20} /></div>
          <div className="text-sm font-semibold">Suivi colis</div>
          <div className="text-xs text-text-secondary mt-0.5">Rechercher un colis</div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gold-500/15 text-gold-500"><Users size={15} /></div>
              <h2 className="text-sm font-semibold">Top clients</h2>
            </div>
            <span className="text-[10px] text-text-muted">30 derniers jours</span>
          </div>
          {topClients.length === 0 ? (
            <div className="text-sm text-text-muted py-8 text-center">Aucune donnée</div>
          ) : (
            <div className="space-y-3">
              {(() => {
                const maxCa = Math.max(...topClients.map(c => c.ca), 1)
                return topClients.map((c, i) => (
                  <div key={c.id} className="group">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${i === 0 ? 'bg-gold-grad text-black' : 'bg-bg-hover text-text-secondary'}`}>{i + 1}</span>
                        <span className="truncate font-medium">{c.nom}</span>
                      </div>
                      <span className="font-mono text-xs text-gold-500 shrink-0 ml-2">{formatMontant(c.ca)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-bg-hover overflow-hidden">
                      <div className="h-full bg-gold-grad rounded-full transition-all duration-700 group-hover:brightness-125" style={{ width: `${(c.ca / maxCa) * 100}%` }} />
                    </div>
                    <div className="text-[10px] text-text-muted mt-0.5">{c.nb} colis</div>
                  </div>
                ))
              })()}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-info-500/15 text-info-500"><Truck size={15} /></div>
              <h2 className="text-sm font-semibold">Performance livreurs</h2>
            </div>
            <button onClick={() => navigate('/livreurs')} className="text-[10px] text-gold-500 hover:underline">Voir tout</button>
          </div>
          {perfLivreurs.length === 0 ? (
            <div className="text-sm text-text-muted py-8 text-center">Aucune donnée</div>
          ) : (
            <div className="space-y-2.5">
              {(() => {
                const maxLiv = Math.max(...perfLivreurs.map(l => l.livres), 1)
                return perfLivreurs.map((l, i) => (
                  <div key={l.id} className="flex items-center gap-3 group">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-gold-grad text-black' : 'bg-bg-hover text-text-secondary'}`}>{l.nom[0]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate font-medium">{l.nom}</span>
                        <span className="text-xs text-text-muted font-mono shrink-0 ml-2">{l.livres} livrés</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-bg-hover overflow-hidden mt-1">
                        <div className="h-full bg-info-500 rounded-full transition-all duration-700 group-hover:brightness-125" style={{ width: `${(l.livres / maxLiv) * 100}%` }} />
                      </div>
                    </div>
                    {l.en_cours > 0 && <span className="badge bg-warning-100/20 text-warning-300 border border-warning-500/30 text-[10px] shrink-0">{l.en_cours} en cours</span>}
                  </div>
                ))
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
