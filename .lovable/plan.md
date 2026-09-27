# Lot 1 — Messagerie réelle et synchronisée

## Constat (schéma actuel inspecté)
La base WiPP contient déjà presque tout ce que le lot demande — aucune nouvelle table n'est nécessaire :
- `wipp_messages` : `reply_to`, `edited_at`, `deleted_at`, `pinned_at`/`pinned_by`, `client_id` (anti-doublon), `expires_at`. Le garde-fou serveur interdit déjà de modifier/supprimer le message d'un autre.
- `wipp_reactions` (message, utilisateur, emoji, date) — 4 règles d'accès.
- `wipp_receipts` (`delivered_at`, `read_at` par destinataire).
- `wipp_message_hides` = « Supprimer pour moi ».
- `wipp_push_tokens` = jetons de notification.
- `wipp_chats.realtime_key` = canal temps réel par conversation.

Côté app : la messagerie reprise du dépôt tourne en local (store + minuteurs factices pour livré/lu/écrit). La file d'attente hors ligne (`outbox`) existe déjà avec `clientId`.

## Migration minimale proposée (à approuver)
1. Ajouter `wipp_messages`, `wipp_reactions`, `wipp_receipts`, `wipp_message_hides` à la publication temps réel (les règles d'accès existantes filtrent ce que chacun reçoit).
2. Contrainte unique `(sender_id, client_id)` sur `wipp_messages` si absente → envoi idempotent.
3. Contrainte unique `(message_id, profile_id)` sur `wipp_reactions` → une réaction par personne, modifiable/retirable.
4. Vérification/ajustement des règles d'accès : réagir, marquer lu, masquer, épingler uniquement pour soi et seulement dans ses propres conversations ; le tombstone efface `body` (remplacé par vide) au lieu d'un DELETE.
Aucune table renommée ni supprimée.

## Fonctionnalités
- **Envoi** : chiffré côté appareil (module crypto existant), inséré avec `client_id`; statut `sending` → `sent` à l'accusé serveur. Hors ligne : reste dans la file durable, réessai à la reconnexion, doublons impossibles.
- **Répondre / balayer pour répondre** : `reply_to` = id du message ; l'aperçu de citation est reconstruit chez le destinataire depuis son propre message déchiffré (jamais d'aperçu en clair côté serveur). Toucher la citation fait défiler jusqu'à l'original.
- **Modifier** : seulement ses messages, fenêtre configurable (15 min par défaut, réglage dans le code), rechiffrement, `edited_at` → libellé « Modifié ».
- **Supprimer pour moi** : ligne dans `wipp_message_hides`.
- **Supprimer pour tout le monde** : tombstone (`deleted_at`, contenu vidé), citations et réactions affichent « Message supprimé ».
- **Copier, Transférer, Sélection multiple, Épingler** ; transfert = nouvel envoi rechiffré pour la conversation cible.
- **Menu appui long** adapté au type (texte, sticker, surprise, média, message d'autrui, supprimé).
- **Temps réel** : abonnement aux changements (nouveau, modifié, supprimé, réactions, épinglés, livré, lu).
- **Écrit…** : diffusion éphémère Supabase (aucune ligne en base), expiration auto après 5 s sans signal.
- **Statuts WIPP** conservés (points), alimentés par les vrais évènements ; « lu » respecte le réglage Accusés de lecture.

## Notifications push
Envoi serveur quand le destinataire n'est pas actif dans la conversation (présence temps réel) : texte générique « Nouveau message de {prénom} », jamais le contenu ; WIPP Privé = « WIPP — Nouveau message » sans nom ni avatar. Anti-doublon : pas de notification locale si la conversation est ouverte.
Prérequis : une clé de compte de service Firebase (secret) — je te la demanderai au moment voulu, avec la marche à suivre.

## Ordre de travail
1. Migration (après ton accord).
2. Couche d'accès serveur + temps réel + file hors ligne.
3. Branchement de l'écran conversation, suppression des minuteurs factices.
4. Push (après ajout de la clé).
5. Test à deux comptes sur 390×844.

## Détails techniques
- Fonctions serveur TanStack (`src/lib/messages.functions.ts`) avec `requireSupabaseAuth`; lectures temps réel via le client navigateur (RLS).
- Canaux : `postgres_changes` filtré par `chat_id`, `broadcast`/`presence` sur `chat:{realtime_key}` pour typing et présence.
- Push : FCM HTTP v1 depuis une route serveur, jeton OAuth signé avec la clé de service.
- Pré-requis bloquant pour le test réel : comptes réels (SMS Firebase configuré) ou le mode démo pour deux profils.
