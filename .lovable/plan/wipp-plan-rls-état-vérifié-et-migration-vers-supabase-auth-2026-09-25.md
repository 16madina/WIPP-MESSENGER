# WIPP — Plan RLS (état vérifié) et migration vers Supabase Auth

Aucun SQL ne sera exécuté avant votre approbation.

## Vérification (lecture seule, 25/09)

- Les 21 tables `wipp_` sont visibles, et la RLS est activée sur les 21.
- Les règles d'accès de la première étape (approuvée plus tôt) sont déjà en place : 32 politiques au total.
- `anon` n'a accès à rien. Aucune règle ne laisse tout passer.
- Dès maintenant, `wipp_profiles.auth_user_id` existe (vide, unique). Aucun profil n'y est encore relié : côté app, les politiques ne renvoient donc rien tant que la connexion Auth n'est pas en place.

## 1) Plan RLS table par table

« Moi » = profil dont `auth_user_id = auth.uid()`. Serveur = Edge Functions (service_role, contourne la RLS).

| Table | Lecture (connecté) | Écriture (connecté) | Serveur seulement | Politiques en place |
|---|---|---|---|---|
| wipp_profiles | Profils publics (id, username, display_name, avatar, bio, clé E2E) ; le mien en entier sauf password_hash | Mon profil : display_name, avatar_url, bio, e2e_public_jwk | Création, username, role, password_hash, firebase_uid, phone_e164, suppression | read, update_own |
| wipp_sessions | — | — | Tout (fin de vie) | aucune |
| wipp_devices | Mes appareils | Supprimer un de mes appareils | Création, last_seen_at | read_own, delete_own |
| wipp_link_codes | — | — | Tout (liaison par QR) | aucune |
| wipp_chats | Discussions dont je suis membre | disappear_after_ms si membre | Création, realtime_key | read_member, update_member |
| wipp_chat_members | Membres de mes discussions | Ma ligne : épinglé, archivé, sourdine, non lu | Ajout / retrait | read, update_own |
| wipp_messages | Messages de mes discussions, non expirés, non masqués | Envoyer (membre, moi, pas de blocage) ; modifier / supprimer les miens ; épingler | Nettoyage des éphémères | read, insert, update (+ déclencheur de garde) |
| wipp_receipts | Accusés de mes discussions | Ma ligne (reçu, lu) | — | read, insert_own, update_own |
| wipp_reactions | Réactions de mes discussions | Mes réactions | — | read, insert/update/delete_own |
| wipp_message_hides | Mes lignes | Ajouter / retirer | — | read/insert/delete_own |
| wipp_attachments | Métadonnées de mes discussions | — | Création, claim, vue unique | read |
| wipp_attachment_chunks | — | — | Tout (vue unique non contournable) | aucune |
| wipp_blocks | Mes blocages | Créer / retirer | — | read/insert/delete_own |
| wipp_call_invites | Où je suis appelant ou appelé | — | Tout (call-signal) | read_party |
| wipp_push_tokens | Mes jetons | — | Enregistrement, envoi | read_own |
| wipp_touch_invites | Où je suis expéditeur ou destinataire | — | Tout (touch-arbiter) | read_party |
| wipp_touch_candidates | — | — | Tout (RSSI privés) | aucune |
| wipp_touch_config | Lecture seule | — | Modification | read |
| wipp_moderation_flags | — | — | Tout | aucune |
| wipp_moderation_access | — | — | Tout (audit) | aucune |
| wipp_moderation_keys | — | — | Clé publique ; clé privée à déplacer en secret | aucune |

Compléments à ajouter (après accord) :
- Un déclencheur sur `wipp_profiles` qui refuse côté client toute modification de username, role, password_hash, firebase_uid, phone_e164, auth_user_id.
- Temps réel limité à messages, receipts, reactions, chat_members, call_invites.

## 2) Migration vers Supabase Auth

### Identité
- Username choisi par l'utilisateur, jamais de numéro.
- E-mail interne invisible, déterministe : `<username_normalisé>@users.wipp.app`, auto-confirmé, jamais affiché.
- `wipp_profiles.auth_user_id` relie profil et compte. `wipp_profiles.id` ne change pas : aucune autre table n'est touchée.

### Inscription (Edge Function `auth-username`)
1. Vérifie le format et que le username est libre.
2. Crée le compte Auth (e-mail interne + mot de passe), puis le profil avec `auth_user_id`. Si le profil échoue, le compte Auth est supprimé.
3. Renvoie la session. L'app n'appelle jamais Auth avec un username seul.

### Connexion et migration sans réinitialisation
1. `auth-username` cherche le profil par username.
2. Profil déjà relié : connexion Auth normale avec l'e-mail interne.
3. Profil pas encore relié : vérification du mot de passe avec `password_hash`. Si c'est bon, création du compte Auth avec **le même mot de passe**, remplissage de `auth_user_id`, puis `password_hash` vidé. L'utilisateur garde son mot de passe.
4. Mauvais mot de passe : même message d'erreur générique dans tous les cas.

### E-mail réel optionnel (récupération)
- Ajouté depuis Profil → Confidentialité, confirmé par lien.
- Récupération : « mot de passe oublié » par username → envoi à l'e-mail réel s'il existe, sinon message expliquant qu'aucune récupération n'est possible.
- Stockage : l'e-mail réel devient l'e-mail du compte Auth. L'e-mail interne est conservé côté serveur pour la connexion par username. **Choix technique à confirmer : cela demande une petite table privée `wipp_recovery_emails` (nouvelle table, accord requis), ou de garder l'e-mail interne comme identifiant et d'envoyer la récupération via une Edge Function.**

### Sort des anciens éléments
- `password_hash` : vidé à chaque migration ; colonne supprimée plus tard, avec votre accord.
- `wipp_sessions` : anciens jetons refusés après la bascule ; table vidée puis supprimable, avec accord. `wipp_devices` reste la liste des appareils connectés, relié à l'id de session Auth.
- `firebase_uid`, `phone_e164` : comptage puis vidage ; suppression des colonnes avec accord.

### Ordre
1. Déclencheur de garde sur `wipp_profiles` (accord).
2. Déployer `auth-username` (inscription, connexion, migration douce).
3. Écrans Connexion / Inscription dans l'app, branchés sur Supabase Auth.
4. Clé privée de modération → secret `MODERATION_PRIVATE_JWK`.
5. Nettoyage après période de transition (≈ 90 jours), chaque étape avec accord.
