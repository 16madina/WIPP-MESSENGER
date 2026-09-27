# Récupérer l'UI complète du dépôt Wipp (sauf Surprise)

## Objectif
Remplacer l'interface actuelle par celle du dépôt 16madina/wipp — écrans, animations, splash — en **gardant notre parcours Surprise** (bouton « + » dans une conversation) tel quel.

## Ce qui sera récupéré du dépôt
- **Démarrage** : splash vidéo `wipp-boot.mp4`, écran d'intro, onboarding.
- **Auth (visuel)** : inscription / connexion / code SMS / configuration profil (données factices, pas de backend).
- **Écrans principaux** : Discussions (chats.tsx), Conversation (conversation.tsx), Appels (calls.tsx), Explorer (explore.tsx), Profil (me.tsx), Stories, Confiance/sécurité, Connexion (QR).
- **Composants** : barre d'onglets, en-têtes, avatars, logo, galerie, fiches sécurité, carte QR, phone-shell.
- **Assets** : public/brand, avatars, fx, media, music.
- **Libs utilitaires** : format, haptics, i18n (français), seed (données factices), store local.

## Ce qui sera exclu (on garde les nôtres)
- `surprise-hub.tsx`, `surprise-compose.tsx`, `surprise-card-view.tsx`, `scratch-card.tsx`, `lib/surprise-cards.ts`, `fx-amour.tsx`, `fx-birthday.tsx` → notre SurpriseFlow/SurpriseReveal reste branché dans le menu « + ».
- Tout le backend du dépôt : `server/`, `lib/messaging`, `lib/crypto`, `lib/livekit`, `lib/supabase`, `lib/firebase`, `lib/db.ts` (pglite) → remplacé par données factices locales.

## Méthode
1. Copier les assets `public/` du dépôt (brand, avatars, fx, media, music).
2. Porter les libs utilitaires (format, haptics, i18n, types, utils, seed, store) en retirant toute dépendance backend.
3. Porter les composants UI puis les écrans, en découpant les appels serveur vers des données factices.
4. Brancher notre parcours Surprise existant dans le menu « + » de la conversation du dépôt.
5. Respecter nos règles : tokens dans `src/theme/theme.ts`, français, mobile 390×844, pas de backend ni de modification des tables wipp_.
6. Vérifier chaque écran dans l'aperçu (splash, onboarding, 4 onglets, conversation, appels, profil) avec Playwright.

## Limites
- Les fonctions qui dépendaient du serveur du dépôt (envoi réel de messages, appels LiveKit, chiffrement) seront visuelles seulement, avec données factices.
- Le splash vidéo avec son peut demander un toucher utilisateur (politique autoplay des navigateurs), comme dans le dépôt.
