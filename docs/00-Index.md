# Cahier des Charges — Khalil Textile Manager

**Document de référence technique et fonctionnel**

| Information | Valeur |
|---|---|
| Projet | Khalil Textile Manager |
| Type | Application de gestion de colis textile (livraison) |
| Plateforme | Bureau (Windows / macOS / Linux) |
| Technologies | PySide6 (Qt6), SQLite, Python 3.11+ |
| Version du document | 1.0 |
| Statut | Référence de développement |

---

## Sommaire général

Le cahier des charges est découpé en fichiers par section afin de rester lisible et imprimable.
Chaque section est un fichier Markdown indépendant situé dans le dossier `docs/`.

### Partie I — Vision et besoins
- [01 — Présentation du projet](./01-Presentation.md)
- [02 — Analyse des besoins](./02-Analyse-besoins.md)

### Partie II — Architecture
- [03 — Architecture générale](./03-Architecture-generale.md)
- [04 — Architecture logicielle](./04-Architecture-logicielle.md)

### Partie III — Utilisateurs et pilotage
- [05 — Gestion des utilisateurs](./05-Utilisateurs.md)
- [06 — Tableau de bord](./06-Tableau-de-bord.md)

### Partie IV — Modules métier
- [07 — Module Colis](./07-Module-colis.md)
- [08 — Module Clients](./08-Module-clients.md)
- [09 — Module Destinataires](./09-Module-destinataires.md)
- [10 — Module Livreurs](./10-Module-livreurs.md)
- [11 — Module Paiements](./11-Module-paiements.md)
- [12 — Comptabilité](./12-Comptabilite.md)
- [13 — Gestion des stocks](./13-Stocks.md)

### Partie V — Données
- [14 — Base de données](./14-Base-de-donnees.md)
- [15 — Diagramme relationnel](./15-Diagramme-relationnel.md)

### Partie VI — Interface et restitution
- [16 — Structure de chaque fenêtre](./16-Structure-fenetres.md)
- [17 — Design](./17-Design.md)
- [18 — Export](./18-Export.md)
- [19 — Impression](./19-Impression.md)
- [20 — Sauvegarde](./20-Sauvegarde.md)

### Partie VII — Exploitation
- [21 — Paramètres](./21-Parametres.md)
- [22 — Sécurité](./22-Securite.md)
- [23 — Performances](./23-Performances.md)
- [24 — Tests](./24-Tests.md)
- [25 — Déploiement](./25-Deploiement.md)
- [26 — Maintenance](./26-Maintenance.md)

### Partie VIII — Avenir et annexes
- [27 — Évolutions futures](./27-Evolutions-futures.md)
- [28 — Annexes](./28-Annexes.md)

---

## Comment lire ce document

1. **Un investisseur ou un décideur** lira la Partie I (vision, besoins, public), puis la
   Partie III (tableau de bord) et la Partie IV (modules métier) pour comprendre la valeur produit.
2. **Un développeur** commence par la Partie II (architecture), la Partie V (base de données) et la
   Partie VI (structure des fenêtres) pour reconstruire l'application.
3. **Un testeur / QA** s'appuie sur la Partie VII (tests, sécurité, performances) et les maquettes
   de l'annexe 28.

Chaque section est conçue pour être compréhensible seule, mais les renvois croisés indiquent
quand une décision dépend d'une autre section.

## Conventions de rédaction

- Les mots-clés **DOIT**, **DEVRAIT**, **PEUT** suivent le sens RFC 2119.
- Les tableaux de base de données (section 14) sont la source de vérité ; tout autre document qui
  décrit une table y fait référence.
- Les identifiants de règle métier (ex. `REGLE-COLIS-01`) sont uniques et référencés depuis les
  modules concernés.
- Les codes d'écran (ex. `ECRAN-COLIS-01`) identifient chaque fenêtre de la section 16.
