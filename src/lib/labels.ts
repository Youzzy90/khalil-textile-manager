import type { ColisStatut, MoyenPaiement, EcheancePaiement } from '../types/db'

export const STATUT_LABELS: Record<ColisStatut, string> = {
  RECU: 'Reçu',
  EXPEDIE: 'Expédié',
  EN_LIVRAISON: 'En livraison',
  LIVRE: 'Livré',
  RETOURNE: 'Retourné',
  ANNULE: 'Annulé',
}

export const STATUT_COLORS: Record<ColisStatut, string> = {
  RECU: 'bg-info-100/20 text-info-300 border border-info-500/30',
  EXPEDIE: 'bg-warning-100/20 text-warning-300 border border-warning-500/30',
  EN_LIVRAISON: 'bg-gold-100/20 text-gold-300 border border-gold-500/30',
  LIVRE: 'bg-success-100/20 text-success-300 border border-success-500/30',
  RETOURNE: 'bg-danger-100/20 text-danger-300 border border-danger-500/30',
  ANNULE: 'bg-bg-hover text-text-secondary border border-border',
}

export const MOYEN_LABELS: Record<MoyenPaiement, string> = {
  ESPECES: 'Espèces',
  WAVE: 'Wave',
  ORANGE_MONEY: 'Orange Money',
  CARTE: 'Carte bancaire',
  VIREMENT: 'Virement',
}

export const ECHEANCE_LABELS: Record<EcheancePaiement, string> = {
  AVANCE: 'Payé en avance',
  LIVRAISON: 'Payé à la livraison',
}

export const CATEGORIES_CHARGE: { value: string; label: string }[] = [
  { value: 'CHARGE_CARBURANT', label: 'Carburant' },
  { value: 'CHARGE_SALAIRE', label: 'Salaires' },
  { value: 'CHARGE_LOYER', label: 'Loyer' },
  { value: 'CHARGE_COMMISSION', label: 'Commissions livreurs' },
  { value: 'CHARGE_ELECTRICITE', label: 'Électricité / Eau' },
  { value: 'CHARGE_TELEPHONE', label: 'Téléphone / Data' },
  { value: 'CHARGE_FOURNITURE', label: 'Fournitures' },
  { value: 'CHARGE_MAINTENANCE', label: 'Maintenance' },
  { value: 'CHARGE_MARKETING', label: 'Marketing' },
  { value: 'CHARGE_AUTRE', label: 'Autre' },
]

export const VEHICULE_LABELS: Record<string, string> = {
  MOTO: 'Moto',
  VOITURE: 'Voiture',
  CAMION: 'Camion',
  VELO: 'Vélo',
  A_PIED: 'À pied',
}

export const COMMISSION_LABELS: Record<string, string> = {
  FIXE: 'Montant fixe par colis',
  AUCUNE: 'Aucune',
}

export const LIVREUR_STATUT_LABELS: Record<string, string> = {
  ACTIF: 'Actif',
  INACTIF: 'Inactif',
  EN_CONGE: 'En congé',
}

export const UNITE_LABELS: Record<string, string> = {
  PIECE: 'Pièce',
  KG: 'Kg',
  LITRE: 'Litre',
  ROULEAU: 'Rouleau',
  BOITE: 'Boîte',
}

export const GRAVITE_LABELS: Record<string, string> = {
  BASSE: 'Basse',
  MOYENNE: 'Moyenne',
  HAUTE: 'Haute',
}

export const GRAVITE_COLORS: Record<string, string> = {
  BASSE: 'bg-info-100/20 text-info-300 border border-info-500/30',
  MOYENNE: 'bg-warning-100/20 text-warning-300 border border-warning-500/30',
  HAUTE: 'bg-danger-100/20 text-danger-300 border border-danger-500/30',
}
