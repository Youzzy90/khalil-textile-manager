# 05 — Gestion des utilisateurs

## 5.1 Vue d'ensemble

La gestion des utilisateurs couvre l'authentification, les profils, les rôles, les permissions,
l'historique de connexion et le journal d'activité. Elle conditionne l'accès à toutes les autres
fonctionnalités : aucune action n'est possible sans connexion préalable.

## 5.2 Connexion

### 5.2.1 Premier lancement (assistant d'installation)
Au tout premier démarrage, aucune base n'existe. L'assistant d'installation :
1. Crée la base et applique les migrations.
2. Insère les données initiales (rôles, paramètres par défaut).
3. Demande la création du **compte administrateur initial** :
   - Nom complet
   - Identifiant (unique)
   - Mot de passe (confirmation, complexité vérifiée)
   - Question/réponse secrète (récupération, optionnel)
4. Enregistre les informations entreprise (nom, devise) — peut être complété plus tard.
5. Termine et affiche l'écran de connexion.

### 5.2.2 Écran de connexion (`ECRAN-LOGIN-01`)
| Élément | Description |
|---|---|
| Logo entreprise | Affiché en haut (si configuré, sinon logo KTM par défaut) |
| Champ identifiant | Texte, autocomplétion désactivée |
| Champ mot de passe | Texte masqué, case « Afficher » |
| Bouton « Se connecter » | Valide, déclenche l'authentification |
| Lien « Mot de passe oublié » | Ouvre la récupération par question secrète |
| Case « Se souvenir de l'identifiant » | Conserve l'identifiant dans `config/settings.json` |
| Message d'erreur | Bannière rouge si échec |

### 5.2.3 Règles de connexion
| ID | Règle |
|---|---|
| `REGLE-AUTH-01` | DOIT : après 5 échecs consécutifs sur un compte, celui-ci est verrouillé 15 minutes |
| `REGLE-AUTH-02` | DOIT : le mot de passe n'est jamais stocké en clair (hachage bcrypt, coût 12) |
| `REGLE-AUTH-03` | DOIT : la date et l'heure de connexion sont journalisées |
| `REGLE-AUTH-04` | DOIT : l'identifiant est unique dans la base |
| `REGLE-AUTH-05` | DEVRAIT : option « session expire après N minutes d'inactivité » (défaut 30 min, configurable) |
| `REGLE-AUTH-06` | NE DOIT PAS : conserver le mot de passe en mémoire après hachage |

### 5.2.4 Récupération de mot de passe
- L'utilisateur clique sur « Mot de passe oublié ».
- Saisit son identifiant.
- Répond à la question secrète configurée.
- Si correct : saisie d'un nouveau mot de passe (complexité vérifiée).
- L'événement est journalisé comme sensible.

## 5.3 Déconnexion
- Menu Fichier → Déconnexion, ou raccourci `Ctrl+Shift+L`.
- Ferme proprement les fenêtres de module, conserve l'état des filtres (réouverture possible).
- Retour à l'écran de connexion.
- Journalisation de l'heure de déconnexion.

## 5.4 Profils

Chaque utilisateur possède un profil modifiable (`ECRAN-USER-PROFIL`) :
- Nom complet
- Identifiant (non modifiable après création, sauf administrateur)
- Téléphone
- Email
- Question/réponse secrète
- Mot de passe (modification via ancien + nouveau)
- Photo de profil (optionnelle, stockée en base en binaire)

L'employé ne modifie que son propre profil. L'administrateur peut modifier tous les profils.

## 5.5 Rôles et permissions

### 5.5.1 Rôles
L'application gère deux rôles en version 1 :

| Rôle | Description |
|---|---|
| **Administrateur** | Accès complet : tous les modules, paramètres, sauvegardes, gestion des utilisateurs, comptabilité, suppression de données |
| **Employé** | Accès opérationnel : colis, clients, destinataires, livreurs (lecture), paiements, impression, export. Pas d'accès aux paramètres, sauvegardes, comptabilité des charges, suppression de colis, gestion des utilisateurs |

### 5.5.2 Matrice de permissions
| Action | Administrateur | Employé |
|---|:---:|:---:|
| Tableau de bord (lecture) | ✔ | ✔ |
| Créer / modifier un colis | ✔ | ✔ |
| Supprimer un colis | ✔ | ✘ |
| Gérer les clients | ✔ | ✔ |
| Gérer les destinataires | ✔ | ✔ |
| Créer / modifier un livreur | ✔ | ✘ (lecture seule) |
| Affecter une tournée | ✔ | ✔ |
| Encaisser un paiement | ✔ | ✔ |
| Rembourser | ✔ | ✘ |
| Saisir une charge | ✔ | ✘ |
| Consulter la comptabilité | ✔ | ✔ (recettes seulement) |
| Gérer les stocks | ✔ | ✔ |
| Exporter | ✔ | ✔ |
| Imprimer | ✔ | ✔ |
| Gérer les utilisateurs | ✔ | ✘ |
| Paramètres entreprise | ✔ | ✘ |
| Sauvegardes / restauration | ✔ | ✘ |
| Consulter le journal d'activité | ✔ | ✘ |
| Changer le thème / langue | ✔ | ✔ (pour soi) |

### 5.5.3 Application des permissions
- Côté interface : les actions non autorisées sont masquées ou désactivées (grisées).
- Côté contrôleur : toute action vérifie le rôle avant d'exécuter (`security.can(user, action)`).
- Côté base de données : aucune RLS en SQLite (mono-poste), donc la vérification applicative est
  la barrière unique — d'où son caractère obligatoire et journalisé.

### 5.5.4 Règles
| ID | Règle |
|---|---|
| `REGLE-PERM-01` | DOIT : au moins un compte administrateur doit exister en permanence |
| `REGLE-PERM-02` | DOIT : impossible de supprimer ou désactiver le dernier administrateur |
| `REGLE-PERM-03` | DOIT : impossible de se retirer soi-même les droits administrateur si l'on est le dernier |
| `REGLE-PERM-04` | DOIT : chaque action sensible est journalisée avec l'utilisateur, l'action, la cible, la date |
| `REGLE-PERM-05` | DOIT : un compte désactivé ne peut plus se connecter (message dédié) |

## 5.6 Historique

### 5.6.1 Historique de connexion
Table `historique_connexion` (voir section 14) :
- `user_id`, `date_heure`, `type` (connexion / déconnexion), `succes` (booléen), `adresse_ip`
  (locale, pour trace), `user_agent` (version app).

### 5.6.2 Consultation
- `ECRAN-USER-HISTORIQUE` : liste filtrable par utilisateur, date, type.
- Export possible (PDF, Excel) pour audit.
- Réservé à l'administrateur.

## 5.7 Journal d'activité

### 5.7.1 Événements journalisés
| Catégorie | Exemples d'événements |
|---|---|
| Authentification | Connexion réussie, échec, déconnexion, verrouillage, récupération mot de passe |
| Colis | Création, modification, suppression, changement de statut, affectation |
| Paiements | Encaissement, remboursement, modification |
| Comptabilité | Saisie de charge, modification d'écriture |
| Stocks | Entrée, sortie, seuil franchi |
| Utilisateurs | Création, modification, désactivation, changement de rôle |
| Paramètres | Modification entreprise, thème, devise |
| Sauvegardes | Sauvegarde automatique, manuelle, restauration |
| Données | Export, impression de document sensible (facture) |

### 5.7.2 Structure d'une entrée
| Champ | Description |
|---|---|
| `id` | Identifiant unique |
| `date_heure` | Horodatage (UTC stocké, affiché en heure locale) |
| `user_id` | Utilisateur à l'origine (peut être null pour les événements système) |
| `categorie` | Voir tableau ci-dessus |
| `action` | Code court (ex. `COLIS_CREATE`, `PAYMENT_RECORD`) |
| `cible_type` | Type d'objet (ex. `colis`, `client`) |
| `cible_id` | Identifiant de l'objet |
| `details` | JSON résumant les données pertinentes (avant/après pour les modifications) |
| `ip` | Adresse locale (mono-poste) |

### 5.7.3 Consultation et purge
- `ECRAN-JOURNAL` : filtres par catégorie, utilisateur, plage de dates, recherche texte.
- Export PDF/Excel pour audit externe.
- Purge : conservé 1 an par défaut (configurable). L'administrateur peut archiver avant purge
  (export puis suppression).

## 5.8 Écrans liés (renvoi section 16)
- `ECRAN-LOGIN-01` : Écran de connexion
- `ECRAN-USER-LIST` : Liste des utilisateurs (admin)
- `ECRAN-USER-FORM` : Création/édition d'un utilisateur
- `ECRAN-USER-PROFIL` : Mon profil
- `ECRAN-USER-HISTORIQUE` : Historique des connexions
- `ECRAN-JOURNAL` : Journal d'activité

---

*Section précédente : [04 — Architecture logicielle](./04-Architecture-logicielle.md)*
*Section suivante : [06 — Tableau de bord](./06-Tableau-de-bord.md)*
