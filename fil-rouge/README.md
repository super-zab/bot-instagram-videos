# Fil Rouge — le livre de votre couple (MVP)

Transforme une conversation WhatsApp, Instagram ou Messenger en livre A5 imprimable :
premier message, qui a dit « je t'aime » en premier et combien de fois, évolution mois par mois,
une page par année, heures et jours préférés, mots, emojis et surnoms, « cérémonie des prix », moments clés.

## Lancer
```bash
cd fil-rouge && python3 -m http.server 8000   # puis http://localhost:8000
node test/run.js                               # tests des parsers et de l'analyse
```
Aucune dépendance, aucun build. JSZip est chargé depuis cdnjs pour lire les .zip.

## Architecture
| Fichier | Rôle |
|---|---|
| `js/parsers.js` | WhatsApp .txt (iOS/Android, FR/EN, 12 h/24 h, jj/mm ou mm/jj), Instagram & Messenger JSON (ancien et nouveau format, correction de l'encodage « Ã© »), fusion de message_1..n.json, choix de la conversation dans un export complet |
| `js/analyze.js` | Toutes les statistiques (pur JS, testable sous Node) |
| `js/book.js` | Mise en page du livre (HTML + SVG, unités `cqi` → même rendu écran / A5 imprimé) |
| `js/demo.js` | Conversation fictive Hugo & Léa affichée avant import |
| `js/app.js` | Interface : import, personnalisation, aperçu, commande |

**Confidentialité** : l'analyse se fait entièrement dans le navigateur. Argument de vente majeur, à garder.

## Brancher la vente
1. **Paiement** : créer 3 Stripe Payment Links (19 / 39 / 69 €) et les coller dans `CONFIG.checkout` (`js/app.js`).
   L'e-mail et l'identifiant de commande sont passés en `prefilled_email` / `client_reference_id`.
2. **PDF** : en local, le bouton « Télécharger le PDF » imprime exactement les pages A5 (`@page 148×210 mm`).
   En production : générer le PDF côté serveur avec Playwright (`page.pdf({ width: '148mm', height: '210mm' })`)
   à partir du JSON des stats (pas des messages bruts).
3. **Impression** : envoyer le PDF à un imprimeur à la demande avec API (Gelato, Peecho, Lulu, Cloudprinter).

## Prochaines étapes
- Envoi du livre (stats + citations choisies) vers un backend à la commande, webhook Stripe → génération PDF → imprimeur.
- Choix/édition des citations par le client, ajout de photos, pages « nos lieux » et « nos chansons ».
- Plus de langues (détection automatique), groupe d'amis / famille comme 2e produit.
