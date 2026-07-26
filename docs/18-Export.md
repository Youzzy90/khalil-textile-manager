# 18 — Export

Le module Export permet de produire des fichiers de données hors de l'application, à des fins de
partage, d'audit ou de rapprochement comptable.

## 18.1 Formats supportés

| Format | Usage | Bibliothèque |
|---|---|---|
| PDF | Rapports prêts à imprimer / envoyer | Qt `QPrinter` + `QTextDocument` (ou ReportLab) |
| Excel (.xlsx) | Tableaux exploitables, rapprochement comptable | `openpyxl` |
| CSV | Import dans d'autres outils | stdlib `csv` |
| Images (PNG) | Captures de QR Codes, graphiques | Qt `QPixmap.save()` |
| QR Code (PNG/SVG) | Étiquettes, suivi | `qrcode` |

## 18.2 Périmètre d'export

Chaque liste de l'application propose un bouton « Exporter » qui ouvre un dialogue de paramétrage :

| Option | Valeurs |
|---|---|
| Format | PDF / Excel / CSV |
| Périmètre | Liste filtrée courante / Sélection manuelle / Tout |
| Colonnes | Sélecteur multi-cases (défaut = colonnes affichées) |
| Période | Si pertinent (date de réception, paiement, etc.) |
| Emplacement | Sélecteur de dossier (défaut = `~/Documents/KTM/exports/`) |
| Nom de fichier | Pré-rempli avec date et module (ex. `colis_20260726.xlsx`) |

## 18.3 Exports par module

| Module | Données exportables | Formats |
|---|---|---|
| Colis | Liste des colis (filtrée), fiche colis complète, historique | Excel, CSV, PDF |
| Clients | Annuaire, fiches détaillées | Excel, CSV, PDF |
| Destinataires | Annuaire | Excel, CSV |
| Livreurs | Liste, statistiques, commissions | Excel, CSV, PDF |
| Paiements | Historique (filtré) | Excel, CSV, PDF |
| Comptabilité | Journal, compte de résultat, rapports mensuel/annuel | PDF, Excel |
| Stocks | Liste articles, mouvements, inventaire | Excel, CSV |
| Journal d'activité | Événements (filtrés) | PDF, Excel |
| Historique connexions | Connexions (filtré) | PDF, Excel |

## 18.4 Spécifications PDF
- En-tête : logo entreprise (gauche), titre du rapport (centre), date de génération (droite).
- Pied de page : numéro de page « X/Y » + nom de l'application + version.
- Marges : 15 mm.
- Police : Inter 10 pt corps, 14 pt titres.
- Tableaux : en-têtes sur fond gris clair, lignes alternées, grille fine.
- Format par défaut : A4 portrait ; A4 paysage pour les listes larges.
- Options : ajout d'un filigrane « CONFIDENTIEL » (option).

## 18.5 Spécifications Excel
- Feuille 1 : données avec en-tête figé (ligne 1), filtres automatiques activés.
- Largeurs de colonnes auto-ajustées.
- Formatage des montants (nombre avec 2 décimales, devise en commentaire).
- Dates au format ISO.
- Feuille 2 (optionnelle) : « Filtres appliqués » récapitulant les critères d'export.

## 18.6 Spécifications CSV
- Encodage UTF-8 avec BOM (compatibilité Excel Windows).
- Séparateur : `;` (pratique européenne) configurable en `,`.
- Délimiteur texte : `"` échappé par doublement.
- En-tête sur la première ligne.

## 18.7 Export d'images et QR Codes
- **QR Code** : généré en PNG (défaut 256×256 px, configurable) ou SVG vectoriel. Stocké dans
  `attachments/<code_colis>/qr.png` et disponible à l'impression d'étiquette.
- **Graphique** : depuis le tableau de bord ou la fiche livreur, bouton « Exporter l'image »
  enregistre le graphique en PNG.

## 18.8 Règles
| ID | Règle |
|---|---|
| `REGLE-EXPORT-01` | DOIT : les exports respectent les permissions (employé ne peut exporter la comptabilité des charges) |
| `REGLE-EXPORT-02` | DOIT : chaque export est journalisé (utilisateur, module, format, périmètre) |
| `REGLE-EXPORT-03` | DOIT : les montants sont formatés selon la devise configurée |
| `REGLE-EXPORT-04` | DEVRAIT : proposer un modèle d'export enregistrable (préférences) |
| `REGLE-EXPORT-05` | NE DOIT PAS : inclure des données supprimées (soft delete) sauf option explicite |

---

*Section précédente : [17 — Design](./17-Design.md)*
*Section suivante : [19 — Impression](./19-Impression.md)*
