import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Loader2, LogIn, UserPlus } from 'lucide-react'
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg-base relative overflow-hidden">
      <div className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 30% 20%, rgba(212,175,55,0.15), transparent 50%), radial-gradient(circle at 70% 80%, rgba(212,175,55,0.08), transparent 50%)' }} />
      <div className="relative w-full max-w-md animate-scaleIn">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-gold-500/15 flex items-center justify-center text-gold-500 mb-3 shadow-glow">
            <Package size={28} />
          </div>
          <h1 className="text-xl font-bold text-text-primary">Khalil Textile Manager</h1>
          <p className="text-sm text-text-secondary mt-1">Gestion de colis textile — livraison</p>
        </div>

        <div className="card p-6">
          <div className="flex gap-1 p-1 bg-bg-soft rounded-lg mb-5">
            <button onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition ${mode === 'login' ? 'bg-gold-500 text-black' : 'text-text-secondary hover:text-text-primary'}`}>
              <LogIn size={15} className="inline mr-1.5" /> Connexion
            </button>
            <button onClick={() => setMode('signup')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition ${mode === 'signup' ? 'bg-gold-500 text-black' : 'text-text-secondary hover:text-text-primary'}`}>
              <UserPlus size={15} className="inline mr-1.5" /> Créer un compte
            </button>
          </div>

          <form onSubmit={submit} className="space-y-3.5">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="label">Nom complet</label>
                  <input className="input" value={nomComplet} onChange={e => setNomComplet(e.target.value)} required />
                </div>
                <div>
                  <label className="label">Identifiant</label>
                  <input className="input" value={identifiant} onChange={e => setIdentifiant(e.target.value)} required />
                </div>
              </>
            )}
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>

            {error && (
              <div className="text-sm text-danger-500 bg-danger-500/10 border border-danger-500/30 rounded-md px-3 py-2 animate-fadeIn">
                {error}
              </div>
            )}

            <button type="submit" disabled={busy || loading} className="btn-primary w-full">
              {busy ? <Loader2 size={16} className="animate-spin" /> : (mode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />)}
              {mode === 'login' ? 'Se connecter' : 'Créer le compte administrateur'}
            </button>
          </form>

          <p className="text-xs text-text-muted mt-4 text-center">
            {mode === 'login' ? "Premier lancement ? Créez le compte administrateur." : "Ce compte sera l'administrateur initial."}
          </p>
        </div>
      </div>
    </div>
  )
}
