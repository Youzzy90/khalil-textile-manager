# 27 — Évolutions futures

Cette section liste les évolutions envisagées après la version 1. Elles ne sont pas engagées mais
montrent la direction et garantissent que l'architecture v1 les permet.

## 27.1 Application mobile Android (v2)
- Cible : livreurs sur le terrain.
- Fonctions :
  - Réception de la tournée du jour (synchro depuis le poste).
  - Scan du QR Code du colis pour marquer « Livré » / « Retourné ».
  - Géolocalisation de la livraison (option).
  - Encaissement à la livraison (Wave / Orange Money / espèces) avec capture de la référence.
  - Prise de photo en cas de retour (destinataire absent, refus).
  - Mode hors-ligne avec synchro différée au retour au dépôt.
- Architecture : API REST (Edge Function Supabase ou serveur dédié) consommée par une app
  native Android (Kotlin) ou multi-plateforme (Flutter).

## 27.2 Application mobile iPhone (v2)
- Mêmes fonctions que la version Android.
- Implémentation native (Swift) ou partagée avec Android via Flutter.

## 27.3 Synchronisation Cloud (v3)
- Objectif : multi-postes en temps réel, sauvegarde distante, accès distant.
- Backend : Supabase (Postgres + auth + storage + realtime) ou serveur dédié.
- Modèle : la base SQLite locale reste la source de vérité hors-ligne ; un moteur de synchro
  pousse les modifications vers le cloud quand le réseau est disponible (sync
  eventually-consistent).
- Conflits : résolution par dernier-a-gagne + journal des conflits pour revue manuelle.
- Avant la v3, l'architecture v1 (base unique, EventBus, modèles isolés) facilite l'ajout d'une
  couche de synchro.

## 27.4 Site Web (v3)
- Tableau de bord en lecture seule pour le gérant à distance.
- Suivi de colis public par code (page simple : statut + historique anonymisé).
- Mentions légales et contact entreprise.
- Implémentation : Next.js ou simple site statique connecté à Supabase.

## 27.5 Suivi GPS des livreurs (v2)
- Sur app mobile : capture périodique de la position (avec consentement).
- Affichage en temps réel sur le poste du chef de livraison (carte).
- Historique des tournées (trajet effectué).
- Calcul d'écarts entre itinéraire prévu et réalisé.
- Confidentialité : désactivable par le livreur hors des heures de travail.

## 27.6 Notifications SMS (v2)
- Envoi automatique d'un SMS au destinataire à l'expédition (« Votre colis KTM-... est en route »).
- SMS de livraison (« Colis livré par [livreur] »).
- Intégration : passerelle SMS locale (Orange, MTN, Moov) ou Twilio.
- Coût par SMS configurable, opt-in client.

## 27.7 Notifications WhatsApp (v2)
- Idem SMS mais via WhatsApp Business API.
- Avantage : gratuit, plus riche (images, liens).
- Inconvénient : nécessite un compte WhatsApp Business et l'opt-in du destinataire.

## 27.8 Intelligence artificielle (v4)
| Cas d'usage | Description |
|---|---|
| Reconnaissance de facture | OCR d'une photo de facture d'achat → pré-remplissage d'une charge |
| Statistiques prédictives | Prévision du volume de colis par ville / par jour |
| Détection d'anomalies | Alertes sur paiements inhabituels, colis en retard anormaux |
| Suggestion de tournée | Optimisation des tournées livreurs (TSP) selon destinations |
| Chat d'assistance | Assistant intégré pour répondre aux questions métier (FAQ) |

## 27.9 Reconnaissance de facture
- L'utilisateur photographie une facture papier (achat carburant, fournitures).
- L'IA extrait : date, fournisseur, montant, catégorie suggérée.
- Vérification utilisateur puis enregistrement en charge.
- Modèle : API externe (Google Vision, AWS Textract) ou modèle local (Tesseract + LLM léger).

## 27.10 Statistiques prédictives
- Analyse des 12 derniers mois pour prédire :
  - Volume de colis par jour de la semaine (anticiper les effectifs).
  - Volume par ville (anticiper les tournées).
  - Risque d'impayés (clients en retard récurrent).
- Affichage dans un onglet « Prévisions » du tableau de bord (admin).
- Modèle : série temporelle simple (Prophet, SARIMA) ou régression.

## 27.11 Autres évolutions envisagées
- Multi-entreprise / multi-dépôt (un même logiciel gère plusieurs succursales).
- Rôles additionnels : Comptable, Chef de livraison (avec permissions fines).
- Catalogue de tarifs par ville / par poids (au lieu d'un montant saisi libre).
- Gestion des réclamations client.
- Intégration comptable externe (export Sage, QuickBooks).
- Signature électronique du destinataire sur bon de livraison (tablette).
- Mode kiosque (écran tactile au comptoir, saisie par le client lui-même).

## 27.12 Compatibilité ascendante
Toute évolution doit préserver la compatibilité avec les données v1 (migrations progressives,
aucune destruction de données). L'architecture v1 (MVC, EventBus, base relationnelle) est
conçue pour absorber ces évolutions sans refonte.

---

*Section précédente : [26 — Maintenance](./26-Maintenance.md)*
*Section suivante : [28 — Annexes](./28-Annexes.md)*
