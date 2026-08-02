import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Users, Truck, CreditCard, TrendingUp, Clock, AlertTriangle, Plus, UserPlus, Banknote } from 'lucide-react'
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

export function DashboardPage() {
  const { utilisateur } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashStats | null>(null)
  const [serie, setSerie] = useState<JourPoint[]>([])
  const [alertes, setAlertes] = useState<Alerte[]>([])
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Tableau de bord</h1>
          <p className="text-sm text-text-secondary mt-0.5">Vue d'ensemble de l'activité — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Activité — 7 derniers jours</h2>
            <div className="flex items-center gap-3 text-xs text-text-secondary">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-gold-500" /> Colis</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-success-500" /> Revenus</span>
            </div>
          </div>
          <div className="flex items-end justify-between gap-2 h-48 pt-4">
            {serie.map((p, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full flex items-end justify-center gap-1 h-full">
                  <div className="w-3 md:w-4 bg-gold-500/80 group-hover:bg-gold-400 rounded-t transition-all"
                    style={{ height: `${(p.colis / maxColis) * 100}%` }}
                    title={`${p.colis} colis`} />
                  <div className="w-3 md:w-4 bg-success-500/80 group-hover:bg-success-300 rounded-t transition-all"
                    style={{ height: `${(p.revenus / maxRevenus) * 100}%` }}
                    title={formatMontant(p.revenus)} />
                </div>
                <span className="text-[10px] text-text-muted capitalize">{p.jour}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-warning-500" />
            <h2 className="text-sm font-semibold">Alertes</h2>
            {alertes.length > 0 && <span className="badge bg-warning-100/20 text-warning-300 border border-warning-500/30">{alertes.length}</span>}
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {alertes.length === 0 ? (
              <div className="text-sm text-text-muted py-6 text-center">Aucune alerte active</div>
            ) : alertes.map(a => (
              <div key={a.id} className={`rounded-md px-3 py-2 border ${GRAVITE_COLORS[a.gravite]}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider">{GRAVITE_LABELS[a.gravite]}</span>
                  <span className="text-[10px] text-text-muted">{formatDate(a.created_at)}</span>
                </div>
                <div className="text-sm mt-0.5">{a.message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button onClick={() => navigate('/colis/nouveau')} className="card p-4 hover:border-gold-500/50 transition group text-left">
          <Package className="text-gold-500 mb-2" size={22} />
          <div className="text-sm font-semibold">Nouveau colis</div>
          <div className="text-xs text-text-secondary">Enregistrer une expédition</div>
        </button>
        <button onClick={() => navigate('/paiements')} className="card p-4 hover:border-gold-500/50 transition group text-left">
          <Banknote className="text-success-500 mb-2" size={22} />
          <div className="text-sm font-semibold">Encaisser</div>
          <div className="text-xs text-text-secondary">Enregistrer un paiement</div>
        </button>
        <button onClick={() => navigate('/livreurs')} className="card p-4 hover:border-gold-500/50 transition group text-left">
          <Truck className="text-info-500 mb-2" size={22} />
          <div className="text-sm font-semibold">Tournées</div>
          <div className="text-xs text-text-secondary">Affecter un livreur</div>
        </button>
        <button onClick={() => navigate('/colis')} className="card p-4 hover:border-gold-500/50 transition group text-left">
          <Package className="text-text-secondary mb-2" size={22} />
          <div className="text-sm font-semibold">Suivi colis</div>
          <div className="text-xs text-text-secondary">Rechercher un colis</div>
        </button>
      </div>
    </div>
  )
}
