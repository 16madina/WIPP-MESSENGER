# WIPP — Clôture phase Lovable (27/09/2026)

Référence de départ Cursor : commit qui suit `1b7073f` (« Fixed touch QR fallback bug ») + ce document.

## 1. Entrées « Moi »
| Entrée | Avant | Maintenant | Réel ? |
|---|---|---|---|
| Ma carte de visite | Mon QR | écran `business-card` | UI/aperçu, indiqué à l'écran (aucune donnée backend) |
| Appareils | Sécurité | écran `devices` | appareil courant seulement ; pas de révocation (non annoncée) |
| Langue | Apparence | écran `language` | sélection FR/EN ; EN marqué « partielle » |

## 2. Protection contre les mots de passe divulgués
- Origine : linter Supabase Auth « Leaked Password Protection Disabled » (réglage du projet Auth, pas une table).
- Auth actuelle : Supabase Auth (e-mail technique dérivé du profil + mot de passe), numéro vérifié par SMS Firebase, lien `wipp_profiles.auth_user_id`. Ancien hash `password_hash` vérifié une seule fois à la migration (`legacy-hash.server.ts`).
- Signification : à l'inscription / changement de mot de passe, Supabase refuse les mots de passe présents dans HaveIBeenPwned.
- Activable sans casser : oui pour les nouveaux mots de passe ; les sessions existantes restent valides. Risque : la migration d'un ancien compte avec un mot de passe divulgué échouerait → prévoir un message « choisis un nouveau mot de passe ». Nécessite un plan Supabase qui propose l'option.
- Avant production : activer, ajouter ce message d'erreur en français, retester inscription + migration. Aucun changement fait dans ce tour.

## 3. Tables sans règle d'accès (RLS activé, aucune policy = fermées au navigateur)
| Table | Fonction / données | Navigateur ? | Accès actuel | Recommandé | Action prod |
|---|---|---|---|---|---|
| _migrations | journal des migrations | non | fermé | fermé | non |
| wipp_attachment_chunks | morceaux chiffrés des pièces jointes | non (via fonctions serveur) | fermé | fermé | non |
| wipp_group_bans | bannis de groupe | non (RPC) | fermé | fermé | non |
| wipp_link_codes | codes de liaison d'appareil | non | fermé | fermé | vérifier si encore utilisée |
| wipp_moderation_access | journal d'accès modération | non | fermé | fermé | non |
| wipp_moderation_flags | signalements (charge scellée) | non | fermé | fermé | non |
| wipp_moderation_keys | clés de modération | non | fermé | fermé ; déplacer la clé privée en secret | oui (voir mémoire backend) |
| wipp_sessions | anciennes sessions maison | non | fermé | fermé | déprécier après bascule Auth |
| wipp_qr_tokens | SHA-256 des QR temporaires | non (RPC) | fermé | fermé | non |
| wipp_touch_candidates | mesures RSSI Touch | non (RPC) | fermé | fermé | purge périodique |
Aucune policy créée pour faire taire l'avertissement.

## 4. Alerte profils
Scanner warning / accès sensible testé et refusé (tests réels A/B : colonnes privées refusées). Permissions inchangées, alerte non ignorée.

## 5. Touch config
Dev : inchangé. Checklist prod : `calibrationLog = false`. RSSI/choc à calibrer sur vrais appareils (Cursor).

## 6. Outils de test
- Boutons « DEV · wipp_test_a/b » : rendus seulement si `import.meta.env.DEV` → absents du build production.
- `devSigninTest` : refusé sans `WIPP_DEV_LOGIN` et sur les domaines publiés ; mot de passe généré côté serveur, jamais dans le bundle.
- Démo 1234567/test (`auth-flow.ts`) : ne crée aucune vraie session ; reste dans le bundle → REMOVE BEFORE PRODUCTION.
- Comptes wipp_test_a/b conservés.

## 7. Contrat WIPP Touch pour Cursor
```text
BLE/NFC natif -> ProximityProvider.start(token, onFound)
  -> reportTouch(token, channel, rssi[], platform, foreground)   (touch-remote.ts)
  -> touchCandidates(id) -> 1 = detected | >1 = multiple_devices
  -> requestTouch / respondTouch / touchStatus  (backend wipp_touch_* inchangé)
  -> mêmes écrans (touch.tsx, touch-incoming.tsx, touch-machine.ts)
```
Remplacer uniquement : `providers.proximity` (+ supprimer DevTouchBridge / bouton « Capter »). Ne pas reconstruire l'UI. Le jeton diffusé = jeton opaque 60 s, jamais d'identité.

## 8. Fournisseurs natifs
| Fournisseur | Web aujourd'hui | Cursor |
|---|---|---|
| ProximityProvider | simulé (renvoie vide ; « Capter » DEV) | BLE/NFC |
| QRScannerProvider | réel (BarcodeDetector, sinon jsQR) | caméra native |
| WippQRResolver (`qr-resolver.ts`) | réel, testé | garder tel quel |
| ScreenProtectionProvider | partiel (masquage arrière-plan) | FLAG_SECURE / détection capture iOS |
| BiometricProvider | indisponible (false) | Face ID / empreinte |
| ShareProvider | réel (Web Share / copie) | feuille de partage native |
| NotificationProvider | formatage seulement ; FCM web préparé | push natif APNs/FCM |

## 9. Audit final Lots 1→6
**PASS** : connexion Supabase Auth ; profils (colonnes privées refusées) ; demandes/connexions réelles A↔B (accepter, refuser, ignorer, bloquer, croisées, double accept) ; QR temporaire (usage unique, expiration, « déjà utilisé ») ; Touch backend (invite, accept, decline, expiration, double accept, blocage, mauvais destinataire) ; QR fallback Touch ; écrans Moi (3 entrées).
**FIXED** : QR permanent affichait @deena (démo) → affiche le vrai @pseudo, rescanné.
**BACKEND** : invitations de groupe serveur (testées côté serveur, UI groupes locale) ; messages 1-à-1 synchronisés + réactions + livré/lu (Lot 1, construits sur Supabase ; test à deux vrais comptes non refait dans cet audit) ; pièces jointes chiffrées.
**SIMULATED** : appels (fournisseur simulé, LiveKit non branché) ; groupes (démo locale) ; stories ; Explorer (boutiques, pharmacies) ; carte de visite ; Touch côté proximité (« Capter »).
**NATIVE** : BLE/NFC Touch ; protection captures ; biométrie ; notifications natives ; appels natifs (CallKit/ConnectionService).
**SECURITY** : scanner warning profils (testé, refusé) ; Leaked Password Protection désactivée ; 12 avertissements linter préexistants ; clé privée de modération en base.
**NOT TESTED** : push FCM de bout en bout (bloqué : config Firebase) ; SMS Firebase réels ; médias/localisation/liens/éphémères entre deux comptes ; écran Appareils/Langue sur téléphone réel.
**REMOVE BEFORE PRODUCTION** : 1234567/test ; boutons DEV ; menu Debug ; badges « Démo » ; bouton « Capter » / DevTouchBridge ; comptes wipp_test_a/b ; `WIPP_DEV_LOGIN` ; calibrationLog ; données démo (seed.ts, groupes démo, mock Explorer).

## 11. Checklist
**Avant build native** : figer ce commit ; exporter la liste des secrets (noms seulement) ; config Firebase web (4 valeurs).
**Dans Cursor/native** : ProximityProvider BLE/NFC ; scanner, protection, biométrie, partage, push natifs ; LiveKit réel ; calibration RSSI/choc ; groupes serveur + E2EE de groupe.
**Avant TestFlight / Play interne** : tests à deux vrais téléphones (messages, médias, appels, Touch, QR) ; push de bout en bout ; SMS réels.
**Avant production** :
- [ ] supprimer 1234567 / test
- [ ] supprimer/isoler Debug
- [ ] supprimer badges Démo
- [ ] supprimer bouton Capter
- [ ] supprimer wipp_test_a/b quand inutiles (+ secret WIPP_DEV_LOGIN)
- [ ] calibrationLog = false
- [ ] vérifier qu'aucun credential de test n'est embarqué
- [ ] résoudre ou documenter chaque alerte Security (dont mots de passe divulgués)
- [ ] vérifier/retirer les données démo

## 12. LOVABLE FREEZE — READY
Base de référence : le commit contenant ce document (juste après `1b7073f`).
