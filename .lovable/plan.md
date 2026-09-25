# WIPP — Plan RLS et passage à Supabase Auth (plan seulement, aucun SQL exécuté)

## Principes communs

- Toutes les tables `wipp_` ont la RLS activée, y compris les 5 tables aujourd'hui ouvertes.
- Pas de politique permissive (`USING (true)`). Ce qui n'est pas explicitement permis reste fermé.
- Les Edge Functions (service_role) contournent la RLS : on leur réserve tout ce qui est sensible (appels, Touch, pièces jointes, modération, suppression de compte).
- `anon` n'a accès à rien. Seul `authenticated` reçoit des droits, uniquement là où une politique existe.
- Les id restent en `text`. Le lien avec Supabase Auth passe par une nouvelle colonne `wipp_profiles.auth_user_id uuid UNIQUE` (voir partie 2). **Cet ajout de colonne demandera votre accord explicite.**

### Fonctions d'aide (security definer, lecture seule)

- `wipp_me()` : renvoie le `wipp_profiles.id` de l'utilisateur connecté (via `auth.uid()`).
- `wipp_is_member(chat_id)` : l'utilisateur est-il membre de cette discussion ?
- `wipp_is_blocked_between(a, b)` : blocage dans un sens ou dans l'autre.
- `wipp_is_admin()` : `role = 'admin'` sur le profil (lecture seule ; le rôle n'est jamais modifiable par le client, voir ci-dessous).

Elles évitent la récursion entre politiques et gardent les règles lisibles.

## 1) Plan RLS table par table

| Table | Lecture (client) | Écriture (client) | Réservé aux Edge Functions |
|---|---|---|---|
| wipp_profiles | Tout utilisateur connecté, **uniquement via une vue publique** (id, username, display_name, avatar_url, bio, e2e_public_jwk). Son propre profil complet sauf password_hash. | Mise à jour de son propre profil : display_name, avatar_url, bio, e2e_public_jwk seulement | Création (inscription), username, role, password_hash, firebase_uid, phone_e164, suppression |
| wipp_sessions | Aucune | Aucune | Tout (table en fin de vie, voir partie 2) |
| wipp_devices | Ses propres appareils | Supprimer un de ses appareils (déconnexion à distance) | Création, last_seen_at |
| wipp_link_codes | Aucune | Aucune | Tout (liaison d'un nouvel appareil par QR) |
| wipp_chats | Discussions dont on est membre | Modifier disappear_after_ms si membre | Création (pour vérifier blocages et doublons), realtime_key |
| wipp_chat_members | Les membres des discussions dont on est membre | Sa propre ligne : pinned_at, archived_at, muted_until, manually_unread_at | Ajout / retrait de membres |
| wipp_messages | Messages des discussions dont on est membre, non expirés, non masqués pour soi | Envoyer si membre, sender_id = soi, et pas de blocage. Modifier / supprimer (edited_at, deleted_at) ses propres messages. Épingler si membre | Nettoyage des éphémères |
| wipp_receipts | Accusés des messages de ses discussions | Sa propre ligne (delivered_at, read_at) | — |
| wipp_reactions | Réactions des messages de ses discussions | Ajouter / changer / retirer sa propre réaction | — |
| wipp_message_hides | Ses propres lignes | Ajouter / retirer ses propres lignes | — |
| wipp_attachments | Métadonnées des pièces jointes de ses discussions | Aucune | Création, claim, consommation de la vue unique |
| wipp_attachment_chunks | Aucune | Aucune | Tout (servi par attachments-sign ; indispensable pour que la vue unique ne soit pas contournable) |
| wipp_blocks | Ses propres blocages (où on est blocker) | Créer / supprimer ses propres blocages | — |
| wipp_call_invites *(ouverte aujourd'hui)* | Invitations où on est appelant ou appelé | Aucune | Création, sonnerie, réponse, expiration (call-signal) |
| wipp_push_tokens *(ouverte aujourd'hui)* | Ses propres jetons | Aucune | Enregistrement et envoi (push-register / push-send) |
| wipp_touch_invites *(ouverte aujourd'hui)* | Invitations où on est expéditeur ou destinataire | Aucune | Tout (touch-arbiter) |
| wipp_touch_candidates *(ouverte aujourd'hui)* | Aucune | Aucune | Tout (les RSSI des autres ne doivent pas fuiter) |
| wipp_touch_config *(ouverte aujourd'hui)* | Aucune (ou lecture seule si l'app en a besoin — à confirmer) | Aucune | Tout |
| wipp_moderation_flags | Aucune | Aucune | Tout (moderation-report), lecture par les admins via Edge Function |
| wipp_moderation_access | Aucune | Aucune | Tout (journal d'audit, jamais modifiable) |
| wipp_moderation_keys | Aucune, droits retirés à anon et authenticated | Aucune | Clé publique seulement |

Points de sécurité supplémentaires :
- Un déclencheur empêche le client de modifier `role`, `username`, `sender_id`, `body` d'un message supprimé, etc. (les politiques filtrent les lignes, pas les colonnes).
- Temps réel : seules `wipp_messages`, `wipp_receipts`, `wipp_reactions`, `wipp_chat_members` et `wipp_call_invites` sont publiées, et la RLS s'applique aux abonnements.

### Clé privée de modération

Oui, il vaut mieux la déplacer dans les secrets des Edge Functions (`MODERATION_PRIVATE_JWK`) :
- Aujourd'hui, la RLS sans politique la protège déjà du client, mais toute fuite de la base (export, sauvegarde, erreur de politique future) exposerait tous les signalements scellés.
- En secret, seule la fonction de modération peut déchiffrer.
- Étapes : copier la clé dans le secret, vérifier que la modération fonctionne, puis vider `private_jwk` (**avec votre accord**). `public_jwk` reste en base.
- Si plusieurs clés ont existé (rotation), elles sont toutes copiées dans le secret, indexées par id.

## 2) Passage à Supabase Auth

### Lien profils ↔ comptes Auth

- Chaque compte Auth a un e-mail interne invisible `<username>@users.wipp.app`, auto-confirmé ; aucun numéro.
- `wipp_profiles.auth_user_id` (uuid, unique, lié à `auth.users` avec suppression en cascade) relie les deux. `wipp_profiles.id` reste le même : aucune clé étrangère des autres tables ne change.
- Nouveaux comptes : l'Edge Function `auth-username` crée le compte Auth puis le profil, dans cet ordre, avec annulation si l'un échoue.
- E-mail réel optionnel : ajouté plus tard pour la seule récupération du mot de passe.

### Sort de password_hash (migration douce)

1. À la connexion, `auth-username` cherche le profil par username.
2. S'il n'a pas encore de compte Auth : vérification de `password_hash`, création du compte Auth avec **le même mot de passe**, remplissage de `auth_user_id`, puis `password_hash` vidé.
3. Ensuite, connexion Auth normale.
4. Après une période (ex. 90 jours), les comptes non migrés devront réinitialiser leur mot de passe (par e-mail s'ils en ont un). La suppression de la colonne se fera plus tard, **avec votre accord**.

### Sort de wipp_sessions

- Les jetons maison ne sont plus acceptés après la bascule : chacun se reconnecte une fois (et se migre au passage).
- `wipp_devices` reste la liste des « appareils connectés » ; `session_token` est remplacé par l'identifiant de session Auth (présent dans le jeton), ce qui permet la déconnexion à distance.
- `wipp_sessions` est vidée puis supprimable plus tard, **avec votre accord**.

### Sort de firebase_uid (et phone_e164)

- `firebase_uid` : n'est plus utilisé ; on vérifie combien de lignes en ont un, puis on le vide. Suppression de colonne **avec votre accord**.
- `phone_e164` : contraire au principe « sans numéro ». Proposition : vider les numéros, puis supprimer la colonne, **avec votre accord**.

### Ordre de bascule

1. Ajouter `auth_user_id` et les fonctions d'aide (accord requis).
2. Déployer `auth-username` avec la migration douce.
3. Activer la RLS et les politiques ci-dessus (les Edge Functions continuent de fonctionner).
4. Basculer l'app sur Supabase Auth.
5. Déplacer la clé privée de modération.
6. Nettoyage (password_hash, sessions, firebase_uid, phone_e164) après période de transition, chaque étape avec votre accord.
