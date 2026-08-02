// Centralized domain types for Khalil Textile Manager.

export type Role = 'ADMIN' | 'EMPLOYE'

export type ColisStatut =
  | 'RECU' | 'EXPEDIE' | 'EN_LIVRAISON' | 'LIVRE' | 'RETOURNE' | 'ANNULE'

export type MoyenPaiement =
  | 'ESPECES' | 'WAVE' | 'ORANGE_MONEY' | 'CARTE' | 'VIREMENT' | 'PORT_PAYE' | 'A_LIVRAISON'

export type SensEcriture = 'ENTREE' | 'SORTIE'

export interface Utilisateur {
  id: number
  auth_user_id: string | null
  identifiant: string
  nom_complet: string
  role: Role
  telephone: string | null
  email: string | null
  actif: boolean
  supprime: boolean
  derniere_connexion: string | null
  created_at: string
  updated_at: string
}

export interface Ville {
  id: number
  nom: string
  region: string | null
  tarif_port: number
  actif: boolean
}

export interface Client {
  id: number
  nom_complet: string
  telephone: string
  telephone2: string | null
  email: string | null
  ville: string
  adresse: string | null
  type: 'PARTICULIER' | 'ENTREPRISE'
  notes: string | null
  supprime: boolean
  created_at: string
  updated_at: string
}

export interface Destinataire {
  id: number
  nom_complet: string
  telephone: string
  ville: string
  adresse: string
  client_id: number | null
  notes: string | null
  supprime: boolean
  created_at: string
  updated_at: string
}

export interface Livreur {
  id: number
  nom_complet: string
  telephone: string
  type_vehicule: 'MOTO' | 'VOITURE' | 'CAMION' | 'VELO' | 'A_PIED'
  plaque: string | null
  zones: string | null
  statut: 'ACTIF' | 'INACTIF' | 'EN_CONGE'
  date_embauche: string | null
  type_commission: 'FIXE' | 'POURCENTAGE' | 'AUCUNE'
  valeur_commission: number
  notes: string | null
  supprime: boolean
  created_at: string
  updated_at: string
}

export interface Colis {
  id: number
  code: string
  client_id: number
  destinataire_id: number
  livreur_id: number | null
  contenu: string
  poids: number
  valeur_declaree: number
  ville_destination: string
  adresse_livraison: string
  montant: number
  montant_paye: number
  mode_paiement_attendu: MoyenPaiement
  priorite: 'NORMALE' | 'EXPRESS'
  fragile: boolean
  statut: ColisStatut
  paye: boolean
  date_reception: string
  date_expedition: string | null
  date_en_livraison: string | null
  date_livraison: string | null
  date_annulation: string | null
  motif_annulation: string | null
  notes_internes: string | null
  supprime: boolean
  created_at: string
  updated_at: string
  // Joined fields (optional)
  client?: Pick<Client, 'id' | 'nom_complet' | 'telephone' | 'ville'>
  destinataire?: Pick<Destinataire, 'id' | 'nom_complet' | 'telephone' | 'ville'>
  livreur?: Pick<Livreur, 'id' | 'nom_complet'>
}

export interface HistoriqueColis {
  id: number
  colis_id: number
  utilisateur_id: number | null
  date_heure: string
  action: string
  statut_precedent: ColisStatut | null
  statut_nouveau: ColisStatut | null
  details: string | null
  utilisateur?: Pick<Utilisateur, 'nom_complet'> | null
}

export interface Commentaire {
  id: number
  colis_id: number
  utilisateur_id: number | null
  texte: string
  created_at: string
  utilisateur?: Pick<Utilisateur, 'nom_complet'> | null
}

export interface Paiement {
  id: number
  colis_id: number
  numero_recu: string
  montant: number
  moyen: MoyenPaiement
  reference: string | null
  date_paiement: string
  utilisateur_id: number | null
  rembourse: boolean
  date_remboursement: string | null
  motif_remboursement: string | null
  notes: string | null
  colis?: Pick<Colis, 'code' | 'client_id'>
}

export interface Charge {
  id: number
  date: string
  categorie: string
  libelle: string
  montant: number
  moyen: string
  beneficiaire: string | null
  notes: string | null
  utilisateur_id: number | null
  supprime: boolean
  created_at: string
}

export interface EcritureComptable {
  id: number
  numero: string
  date_ecriture: string
  sens: SensEcriture
  categorie: string
  libelle: string
  montant: number
  moyen: string | null
  colis_id: number | null
  paiement_id: number | null
  charge_id: number | null
  utilisateur_id: number | null
  automatique: boolean
  supprime: boolean
}

export interface ArticleStock {
  id: number
  reference: string
  designation: string
  categorie: string | null
  unite: 'PIECE' | 'KG' | 'LITRE' | 'ROULEAU' | 'BOITE'
  quantite_actuelle: number
  seuil_alerte: number
  prix_unitaire: number
  fournisseur: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface MouvementStock {
  id: number
  article_id: number
  type: 'ENTREE' | 'SORTIE' | 'AJUSTEMENT'
  quantite: number
  date: string
  motif: string
  reference_bon: string | null
  utilisateur_id: number | null
  article?: Pick<ArticleStock, 'reference' | 'designation'>
}

export interface Alerte {
  id: number
  type: string
  cible_type: string | null
  cible_id: number | null
  message: string
  gravite: 'BASSE' | 'MOYENNE' | 'HAUTE'
  created_at: string
  acquittee: boolean
  date_acquittement: string | null
}

export interface JournalActivite {
  id: number
  date_heure: string
  utilisateur_id: number | null
  categorie: string
  action: string
  cible_type: string | null
  cible_id: number | null
  details: string | null
  utilisateur?: Pick<Utilisateur, 'nom_complet'> | null
}

export interface Parametre {
  id: number
  cle: string
  valeur: string | null
  type: 'TEXT' | 'INT' | 'REAL' | 'BOOL' | 'JSON'
  updated_at: string
}

export interface CommissionLivreur {
  id: number
  livreur_id: number
  colis_id: number
  montant: number
  date_generation: string
  payee: boolean
  date_paiement: string | null
  livreur?: Pick<Livreur, 'nom_complet'>
  colis?: Pick<Colis, 'code'>
}
