import type { Livreur } from '../types/db'

// Zones are stored as a comma-separated string on livreur.zones (e.g. "Dakar,Thiès").
// Helpers parse, normalize, and match a destination city against a driver's zones.

export function parseZones(zones: string | null | undefined): string[] {
  if (!zones) return []
  return zones
    .split(',')
    .map(z => z.trim())
    .filter(Boolean)
    .map(z => z.toLowerCase())
}

export function zonesInclude(zones: string | null | undefined, ville: string): boolean {
  const v = ville.trim().toLowerCase()
  if (!v) return false
  return parseZones(zones).includes(v)
}

// Find the best active livreur covering the given ville.
// Prefers drivers with fewer colis "en livraison" to balance load (caller may pass counts).
export function trouverLivreurPourVille(
  ville: string,
  livreurs: Livreur[],
  enCours: Record<number, number> = {},
): Livreur | null {
  const couvrant = livreurs
    .filter(l => l.statut === 'ACTIF' && zonesInclude(l.zones, ville))
    .sort((a, b) => (enCours[a.id] ?? 0) - (enCours[b.id] ?? 0))
  return couvrant[0] ?? null
}
