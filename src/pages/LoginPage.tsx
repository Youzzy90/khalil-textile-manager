import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Loader2, LogIn, UserPlus, Sparkles, Shield, ArrowRight } from 'lucide-react'
import { useAuth } from '../lib/auth'

export function LoginPage() {
  const { signIn, signUp, session, loading } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [identifiant, setIdentifiant] = useState('')
  const [nomComplet, setNomComplet] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (session) navigate('/', { replace: true }) }, [session, navigate])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setBusy(true)
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) setError(error)
      } else {
        if (!identifiant.trim() || !nomComplet.trim()) {
          setError("Identifiant et nom complet requis.")
          setBusy(false); return
        }
        const { error } = await signUp(email, password, identifiant.trim(), nomComplet.trim())
        if (error) setError(error)
        else { setError(null); setMode('login'); setEmail(''); setPassword(''); setIdentifiant(''); setNomComplet('') }
      }
    } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-bg-base">
      {/* Left — brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden border-r border-border">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 80% at 30% 20%, rgba(212,175,55,0.18), transparent 60%), radial-gradient(ellipse 50% 60% at 90% 90%, rgba(212,175,55,0.1), transparent 60%)' }} />
        <div className="absolute inset-0 bg-panel-grad pointer-events-none" />

        <div className="relative flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-xl bg-gold-grad flex items-center justify-center text-black font-bold shadow-glow">
            K
            <Sparkles size={11} className="absolute -top-1 -right-1 text-gold-300" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-tight">Khalil Textile</div>
            <div className="text-[10px] text-gold-500/80 uppercase tracking-[0.2em]">Manager</div>
          </div>
        </div>

        <div className="relative">
          <h1 className="text-4xl font-bold tracking-tight leading-tight">
            Gérez vos <span className="text-gold-500">expéditions</span><br />en toute fluidité.
          </h1>
          <p className="text-text-secondary mt-4 max-w-sm leading-relaxed">
            Suivi des colis, clients, livreurs, paiements et comptabilité — réunis dans une interface élégante et performante.
          </p>
          <div className="flex items-center gap-6 mt-8">
            <div>
              <div className="text-2xl font-bold text-gold-500 font-mono">100%</div>
              <div className="text-xs text-text-muted">Traçabilité colis</div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div>
              <div className="text-2xl font-bold text-gold-500 font-mono">Temps réel</div>
              <div className="text-xs text-text-muted">Tableau de bord</div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div>
              <div className="text-2xl font-bold text-gold-500 font-mono">Sécurisé</div>
              <div className="text-xs text-text-muted">Données protégées</div>
            </div>
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-text-muted">
          <Shield size={14} className="text-gold-500/60" />
          Plateforme de gestion logistique — v1.0
        </div>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md animate-scaleIn">
          <div className="flex flex-col items-center mb-7 lg:hidden">
            <div className="w-14 h-14 rounded-2xl bg-gold-grad flex items-center justify-center text-black mb-3 shadow-glow">
              <Package size={26} />
            </div>
            <h1 className="text-lg font-bold tracking-tight">Khalil Textile Manager</h1>
            <p className="text-sm text-text-secondary mt-0.5">Gestion de colis — livraison</p>
          </div>

          <div className="card p-6 md:p-7 shadow-float">
            <div className="flex gap-1 p-1 bg-bg-soft rounded-xl mb-6">
              <button onClick={() => setMode('login')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'login' ? 'bg-gold-grad text-black shadow-[0_2px_8px_-2px_rgba(212,175,55,0.5)]' : 'text-text-secondary hover:text-text-primary'}`}>
                <LogIn size={15} className="inline mr-1.5" /> Connexion
              </button>
              <button onClick={() => setMode('signup')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'signup' ? 'bg-gold-grad text-black shadow-[0_2px_8px_-2px_rgba(212,175,55,0.5)]' : 'text-text-secondary hover:text-text-primary'}`}>
                <UserPlus size={15} className="inline mr-1.5" /> Créer un compte
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="label">Nom complet</label>
                    <input className="input" value={nomComplet} onChange={e => setNomComplet(e.target.value)} required placeholder="Ex: Youssoupha Ndiaye" />
                  </div>
                  <div>
                    <label className="label">Identifiant</label>
                    <input className="input" value={identifiant} onChange={e => setIdentifiant(e.target.value)} required placeholder="Ex: Youzzy00" />
                  </div>
                </>
              )}
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required placeholder="vous@exemple.com" />
              </div>
              <div>
                <label className="label">Mot de passe</label>
                <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" />
              </div>

              {error && (
                <div className="text-sm text-danger-500 bg-danger-500/10 border border-danger-500/30 rounded-lg px-3.5 py-2.5 animate-fadeIn">
                  {error}
                </div>
              )}

              <button type="submit" disabled={busy || loading} className="btn-primary w-full py-2.5">
                {busy ? <Loader2 size={16} className="animate-spin" /> : (mode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />)}
                {mode === 'login' ? 'Se connecter' : 'Créer le compte administrateur'}
                {!busy && <ArrowRight size={15} className="opacity-70" />}
              </button>
            </form>

            <p className="text-xs text-text-muted mt-5 text-center">
              {mode === 'login' ? "Premier lancement ? Créez le compte administrateur." : "Ce compte sera l'administrateur initial."}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
