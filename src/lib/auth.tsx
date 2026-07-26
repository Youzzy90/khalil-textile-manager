import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Utilisateur } from '../types/db'

interface AuthCtx {
  session: Session | null
  authUser: User | null
  utilisateur: Utilisateur | null
  loading: boolean
  signUp: (email: string, password: string, identifiant: string, nomComplet: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshUtilisateur: () => Promise<void>
}

const Ctx = createContext<AuthCtx | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadUtilisateur(userId: string | undefined) {
    if (!userId) { setUtilisateur(null); return }
    const { data, error } = await supabase
      .from('utilisateur').select('*')
      .eq('auth_user_id', userId).maybeSingle()
    if (error) { setUtilisateur(null); return }
    setUtilisateur(data as Utilisateur | null)
  }

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setAuthUser(data.session?.user ?? null)
      loadUtilisateur(data.session?.user?.id).finally(() => setLoading(false))
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      (async () => {
        setSession(sess)
        setAuthUser(sess?.user ?? null)
        await loadUtilisateur(sess?.user?.id)
        setLoading(false)
      })()
    })
    return () => { mounted = false; sub.subscription.unsubscribe() }
  }, [])

  async function signUp(email: string, password: string, identifiant: string, nomComplet: string) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: traduitErreurAuth(error.message) }
    const userId = data.user?.id
    if (!userId) return { error: "Compte créé mais identifiant introuvable. Réessayez." }
    // Create the business profile row
    const { error: e2 } = await supabase.from('utilisateur').insert({
      auth_user_id: userId,
      identifiant,
      nom_complet: nomComplet,
      role: 'ADMIN',
      actif: true,
    })
    if (e2) return { error: `Profil utilisateur: ${e2.message}` }
    return { error: null }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: traduitErreurAuth(error.message) }
    return { error: null }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUtilisateur(null)
  }

  async function refreshUtilisateur() {
    await loadUtilisateur(authUser?.id)
  }

  return (
    <Ctx.Provider value={{ session, authUser, utilisateur, loading, signUp, signIn, signOut, refreshUtilisateur }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth must be used within AuthProvider')
  return c
}

function traduitErreurAuth(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'Email ou mot de passe incorrect.'
  if (m.includes('user already registered')) return 'Un compte existe déjà avec cet email.'
  if (m.includes('password')) return 'Le mot de passe doit contenir au moins 6 caractères.'
  if (m.includes('email')) return 'Email invalide.'
  return msg
}
