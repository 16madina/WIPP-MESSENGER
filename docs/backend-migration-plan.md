# BACKEND MIGRATION PLAN — Lot 6 (NON EXÉCUTÉ, en attente d'autorisation)

Principe : deny by default. Aucune valeur de credential n'est lue, copiée ni journalisée.

## 0. SECURITY — état actuel vérifié (lecture seule)
- Table : `wipp_profiles`. Champs sensibles : `password_hash`, `phone_e164`, `firebase_uid`, `auth_user_id`.
- Politique `profiles_read` : SELECT pour `authenticated`, condition `true` → tout utilisateur connecté peut demander **toutes les colonnes de tous les profils**, y compris les champs sensibles, via l'API.
- Le frontend ne les demande pas pour autrui (colonnes publiques uniquement : id, username, display_name, avatar_url, bio, e2e_public_jwk, role). Seul l'écran d'auth lit `phone_e164` de **son propre** profil. Mais la protection repose sur le client : faille réelle.
- `anon` : aucune politique → aucun accès.

## 1. Objets existants conservés
wipp_profiles (données), wipp_blocks (politiques correctes), wipp_touch_invites, wipp_touch_candidates, wipp_touch_config (lecture seule), wipp_chats/members/messages, fonction `wipp_private.wipp_me()`.

## 2. Nouveaux objets proposés
- **Vue `wipp_public_profiles`** (security_invoker=off, propriétaire restreint) : `id, username, display_name, avatar_url, bio, e2e_public_jwk`. Aucun champ privé. Exclut les profils bloquants/bloqués vis-à-vis de l'appelant.
- **`wipp_private_credentials`** — NON : on ne copie pas les credentials. On retire l'accès en colonne à la place (voir §3).
- **`wipp_connections`** : `id, user_a uuid, user_b uuid, created_at, via text (touch|qr|request), status text default 'active'` ; CHECK `user_a < user_b` ; UNIQUE(user_a,user_b) → pas de doublon ni d'ordre inversé.
- **`wipp_connection_requests`** : `id, sender_id, recipient_id, status (pending|accepted|declined|ignored|expired), via, created_at, responded_at, expires_at` ; CHECK sender≠recipient ; index unique partiel `(sender_id, recipient_id) WHERE status='pending'`.
- **`wipp_qr_tokens`** : `token_hash bytea PK, profile_id, expires_at, used_at, created_at`. Le jeton brut (32 octets aléatoires, `gen_random_bytes`) n'est jamais stocké ; seul son SHA-256.
- **`wipp_group_invites`** : `id, chat_id, token_hash, created_by, expires_at null, max_uses null, uses int, revoked_at`.

## 3. Modifications proposées
- `wipp_profiles` : supprimer `profiles_read` ; `REVOKE SELECT ON wipp_profiles FROM authenticated` puis `GRANT SELECT (id, username, display_name, avatar_url, bio, e2e_public_jwk, role, created_at) TO authenticated` ; nouvelle politique `profiles_read_self_or_public` (true sur ces colonnes seulement). `password_hash`, `phone_e164`, `firebase_uid`, `auth_user_id` deviennent illisibles côté navigateur ; seul le serveur (service_role) les lit.
- Adapter l'écran d'auth : lire son propre numéro via fonction serveur au lieu du SELECT direct.
- `wipp_touch_invites` : ajouter politiques d'écriture = aucune (serveur uniquement) ; statut contraint à pending|accepted|declined|expired.

## 4. RLS / accès
| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| wipp_profiles | colonnes publiques, authenticated | serveur | soi (colonnes publiques) | serveur |
| wipp_public_profiles (vue) | authenticated, hors blocages | — | — | — |
| wipp_connections | si l'appelant est user_a ou user_b | serveur | serveur | soi (retirer un contact) |
| wipp_connection_requests | sender ou recipient | serveur | serveur | aucun |
| wipp_qr_tokens | aucun | serveur | serveur | serveur |
| wipp_group_invites | admins du groupe | serveur | serveur | serveur |
| wipp_touch_invites | sender ou receiver (existant) | serveur | serveur | aucun |
| wipp_touch_candidates | aucun | serveur | aucun | serveur |
| wipp_blocks | inchangé (propre) | soi | — | soi |

## 5. Fonctions serveur (TanStack, `requireSupabaseAuth`, identité = session, jamais un id envoyé par le client)
- `resolveUsername(username)` → profil public ou introuvable (respecte blocages).
- `sendConnectionRequest(recipientUsername)` : vérifie blocage dans les deux sens, contact existant, anti-spam (≤20 demandes/24 h, ≤3 refus vers la même personne = pause 30 j).
- `respondConnectionRequest(id, accept|decline|ignore)` : n'agit que si `recipient_id = moi` et `status='pending'` et non expiré ; acceptation crée `wipp_connections` dans la même transaction.
- `issueQrToken()` : invalide l'ancien jeton du profil, en crée un de 75 s, renvoie le jeton brut une fois.
- `redeemQrToken(token)` : **atomique** — `UPDATE wipp_qr_tokens SET used_at=now() WHERE token_hash=sha256($1) AND used_at IS NULL AND expires_at>now() RETURNING profile_id`. Deux scans simultanés : un seul UPDATE touche la ligne (verrou de ligne Postgres), l'autre reçoit 0 ligne → « QR déjà utilisé ».
- `redeemGroupInvite(token)` : groupe existant, invitation non révoquée/non expirée/uses<max, appelant non banni ni bloqué par un admin, groupe acceptant les invitations.
- Touch : `createTouchInvite()` (réutilise wipp_touch_invites, code opaque court, TTL 60 s, jamais numéro/e-mail), `reportTouchCandidate()` (NATIVE : BLE/NFC), `respondTouchInvite(id, accept|decline)` (receiver = moi, pending, non expiré, pas de blocage) → crée la connexion.
- Expiration : filtrage `expires_at>now()` à chaque lecture + nettoyage périodique.

## 6. À déprécier
Registre local des QR temporaires (`qr-payload.ts`, localStorage), simulateur Touch, `profiles_read`, lecture directe de `phone_e164` depuis le navigateur, mode démo 1234567/test.

## 7. Risques
- Casser une lecture existante qui demande `*` sur wipp_profiles → audit fait : aucune côté client pour autrui ; à retester.
- Énumération de usernames → limite de débit sur `resolveUsername`.
- Horloge : expirations calculées côté serveur uniquement.
- `password_hash` hérité : à terme, supprimer la colonne quand Supabase Auth est seul (accord séparé).

## 8. Ordre exact
1. Déployer les fonctions serveur (lisent via service_role) sans changer la base.
2. Adapter l'écran d'auth pour ne plus lire `phone_e164` directement.
3. Migration A : REVOKE/GRANT colonnes + nouvelle politique wipp_profiles + vue publique.
4. Migration B : wipp_connections, wipp_connection_requests (+GRANT, RLS, politiques).
5. Migration C : wipp_qr_tokens, wipp_group_invites.
6. Migration D : contraintes et politiques Touch.
7. Brancher les écrans, retirer les simulations, tester à deux comptes.

## 9. Rollback
- A : `GRANT SELECT ON wipp_profiles TO authenticated` + recréer `profiles_read` (retour à l'état actuel, faille incluse).
- B/C : `DROP TABLE` des nouvelles tables uniquement (aucune donnée existante touchée).
- D : `DROP POLICY`/`DROP CONSTRAINT` ajoutés.
Chaque migration est indépendante et réversible ; aucune table wipp_ existante n'est supprimée ni renommée.

## Exécution (27/09/2026)
- A appliquée (A.1 fonction + vue, A.2 révocation + politique hors blocage). B appliquée. C et D NON exécutées.
- Rollback A = procédure d'urgence documentée uniquement, jamais automatique ; corriger la fonction cassée plutôt que rouvrir les champs.

## Migration C — tables ajoutées hors plan (validées)
### `wipp_groups` (fiche de groupe)
- Colonnes : `chat_id text PK → wipp_chats(id) ON DELETE CASCADE`, `name text` (CHECK 1–80 car.), `owner_id text → wipp_profiles(id)`, `invites_enabled boolean default true`, `created_at timestamptz default now()`.
- Index : PK (chat_id).
- RLS : lecture `groups_read_members` (membre du chat) ; aucune écriture navigateur.
- Propriétaire des données : `owner_id` (créateur du groupe).
- Fonctions serveur : `wipp_create_group`, `wipp_create_group_invite` (propriétaire uniquement), `wipp_revoke_group_invite`, `wipp_group_invite_check` (via `src/lib/qr.functions.ts`).
### `wipp_group_bans` (bannis)
- Colonnes : `chat_id → wipp_chats ON DELETE CASCADE`, `profile_id → wipp_profiles ON DELETE CASCADE`, `created_at`. PK (chat_id, profile_id).
- RLS : activée, aucune règle → fermée au navigateur (serveur uniquement).
- Propriétaire : propriétaire du groupe (écriture future côté serveur).
- Fonction serveur : `wipp_group_invite_check` (refuse un banni).
- État : Group QR backend = réel ; Group UI = encore démo/local.

## Migration D — WIPP Touch (appliquée 27/09/2026)
Réutilise `wipp_touch_invites`, `wipp_touch_candidates`, `wipp_touch_config`. Aucun système parallèle ; aboutit à `wipp_connections` (via = 'touch').
- `wipp_touch_invites` : CHECK statut ∈ active|pending|accepted|declined|expired|cancelled ; `code` = SHA-256 du jeton diffusé (jamais le jeton) ; index partiels receiver pending / sender actif. RLS inchangée (lecture expéditeur ou destinataire).
- `wipp_touch_candidates` : id par défaut généré ; toujours fermée au navigateur.
- `wipp_touch_config` : inchangée, lecture client (CLIENT-SAFE). Production : `calibrationLog = false`.
- Fonctions SQL (service_role uniquement) : `wipp_touch_create` (jeton 60 s, annule l'ancien), `wipp_touch_report` (candidat ; refus générique si inconnu/expiré/soi/bloqué ; ≤10 candidats), `wipp_touch_candidates_for` (profil public minimal, hors blocages), `wipp_touch_request` (candidat obligatoire, demande 60 s), `wipp_touch_respond` (destinataire uniquement, FOR UPDATE, une seule connexion), `wipp_touch_cancel`.
- Serveur TanStack : `src/lib/touch.functions.ts` (identité = session). Client : `src/lib/touch-remote.ts`.
- Rollback D : DROP des 6 fonctions, DROP CONSTRAINT `wipp_touch_invites_status_check`, DROP des 2 index, DROP DEFAULT sur `wipp_touch_candidates.id`.
