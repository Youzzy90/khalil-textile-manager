// Formatting & validation helpers.

export function formatMontant(montant: number, symbole = 'FCFA', position: 'avant' | 'apres' = 'apres'): string {
  const n = Number(montant || 0)
  const str = n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  return position === 'avant' ? `${symbole} ${str}` : `${str} ${symbole}`
}

export function formatDate(iso: string | null, avecHeure = false): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  const date = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  if (!avecHeure) return date
  const heure = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return `${date} ${heure}`
}

export function formatDateTime(iso: string | null): string {
  return formatDate(iso, true)
}

export function shortenId(s: string, n = 8): string {
  return s && s.length > n ? `${s.slice(0, n)}…` : s
}

export function valideTelephone(t: string): boolean {
  const cleaned = t.replace(/[\s.-]/g, '')
  return /^(\+?\d{8,15})$/.test(cleaned)
}

export function valideEmail(e: string): boolean {
  if (!e) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
}

export function valideMontant(m: number): boolean {
  return !isNaN(m) && m > 0
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function debutPeriode(jours: number): string {
  const d = new Date()
  d.setDate(d.getDate() - jours)
  return d.toISOString().slice(0, 10)
}

export function genCodeFacture(): string {
  const d = new Date()
  const y = String(d.getFullYear()).slice(2)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const rand = Math.floor(Math.random() * 90000 + 10000)
  return `FAC-${y}${m}${day}-${rand}`
}
