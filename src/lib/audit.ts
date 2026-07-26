import { supabase } from './supabase'
import type { Utilisateur } from '../types/db'

// Centralized audit logging + helpers used by every module.

export async function logActivite(
  utilisateur: Utilisateur | null,
  categorie: string,
  action: string,
  cible?: { type: string; id: number | string },
  details?: Record<string, unknown>,
) {
  if (!utilisateur) return
  await supabase.from('journal_activite').insert({
    utilisateur_id: utilisateur.id,
    categorie,
    action,
    cible_type: cible?.type ?? null,
    cible_id: cible && typeof cible.id === 'number' ? cible.id : null,
    details: details ? JSON.stringify(details) : null,
  })
}

export async function nextSequence(nom: string): Promise<string> {
  const { data, error } = await supabase.rpc('next_sequence', { p_nom: nom, p_pad: 5 })
  if (error) throw new Error(`Séquence ${nom}: ${error.message}`)
  return data as string
}

export async function genererCodeColis(): Promise<string> {
  const d = new Date()
  const y = String(d.getFullYear()).slice(2)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const seq = await nextSequence('COLIS_JOURNALIER')
  return `KTM-${y}${m}${day}-${seq}`
}

export async function genererNumeroRecu(): Promise<string> {
  const d = new Date()
  const y = String(d.getFullYear()).slice(2)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const seq = await nextSequence('RECU')
  return `REC-${y}${m}${day}-${seq}`
}

export async function genererNumeroEcriture(): Promise<string> {
  const y = String(new Date().getFullYear()).slice(2)
  const seq = await nextSequence('ECRITURE')
  return `ECR-${y}-${seq}`
}
