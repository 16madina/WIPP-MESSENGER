# WIPP messenger

Projet : WIPP — application de messagerie et d'appels SANS numéro de téléphone. On s'ajoute par username WIPP, par code QR, ou en collant deux téléphones (WIPP Touch). Messages chiffrés de bout en bout. Public 18+, aucune publicité. Langue de l'interface : français.

⚠️ RÈGLES STRICTES — À RESPECTER DÈS MAINTENANT
1. N'active PAS Lovable Cloud. Je vais connecter mon propre projet Supabase existant nommé « WiPP ». Attends cette connexion avant toute chose liée au backend. Ne crée aucune nouvelle base de données.
2. La base existe déjà : 21 tables préfixées wipp_ (wipp_profiles, wipp_chats, wipp_chat_members, wipp_messages, wipp_receipts, wipp_reactions, wipp_message_hides, wipp_attachments, wipp_attachment_chunks, wipp_call_invites, wipp_touch_invites, wipp_touch_candidates, wipp_touch_config, wipp_blocks, wipp_moderation_flags, wipp_moderation_access, wipp_moderation_keys, wipp_push_tokens, wipp_devices, wipp_sessions, wipp_link_codes). Ne supprime, ne renomme et ne modifie aucune table sans mon accord explicite.
3. Pas de Capacitor. Application web uniquement. Le code sera ensuite repris en React Native / Expo par un autre outil : il doit donc être propre, bien découpé en composants, et facile à traduire.
4. Toute la logique serveur dans des Supabase Edge Functions (connexion, génération du jeton LiveKit — les clés LiveKit en secrets, jamais dans le code client —, notifications push, arbitrage WIPP Touch). Les appels audio/vidéo passent par LiveKit Cloud (projet « WIPP »).
5. Sécurité : RLS activée sur TOUTES les tables, avec des règles qui gardent l'app fonctionnelle. Les tables wipp_push_tokens, wipp_call_invites, wipp_touch_invites, wipp_touch_candidates et wipp_touch_config sont actuellement ouvertes : à corriger.
6. Tous les assets (logo, icônes, stickers, images) stockés DANS le projet, jamais hébergés ailleurs.

🎨 EXIGENCE N°1 : L'APP DOIT DONNER LA SENSATION D'UNE VRAIE APP NATIVE iOS/Android, PAS D'UN SITE WEB
- Conçue mobile d'abord (390×844), plein écran, respect des safe areas (encoche, barre du bas). Aucun scroll horizontal, aucun effet de survol (hover), aucune sélection de texte accidentelle, pas de surlignage bleu au toucher.
- Navigation native : barre d'onglets en bas (Discussions, Appels, Explorer, Profil), en-têtes avec grands titres qui se réduisent au scroll, bouton retour à gauche.
- Transitions natives avec framer-motion : nouvel écran qui glisse depuis la droite (push), retour qui glisse vers la droite, feuilles modales qui montent du bas avec poignée et fermeture par glissement vers le bas, animations en « spring » (pas de transitions linéaires). Geste de balayage depuis le bord gauche pour revenir en arrière.
- Retour tactile : chaque bouton et chaque ligne réduit légèrement d'échelle à l'appui (0.97) et revient en spring. Listes avec apparition échelonnée douce.
- Glassmorphism : barre d'onglets, en-têtes et feuilles modales translucides avec flou d'arrière-plan fort (backdrop-blur), fine bordure claire semi-transparente, légère ombre. Le contenu défile visiblement derrière les barres floutées, comme sur iOS.
- Design system dans UN SEUL fichier de thème : couleurs, polices, tailles, rayons, ombres, niveaux de flou ET paramètres d'animation (durées, raideur/amortissement des springs). Mode clair et sombre. Ce fichier sera recopié tel quel dans l'app native.
- Indicateurs d'état des messages personnalisés (PAS les coches WhatsApp) : point qui pulse = envoi en cours, un point gris = envoyé, deux points gris = reçu, deux points jaunes reliés = lu, point rouge = échec.
- Respecter « prefers-reduced-motion ».

📱 FONCTIONNALITÉS PRINCIPALES
Inscription/connexion par username (pas de numéro), liste des discussions (épinglées, archivées, en sourdine, non lues), chat (réponses, modification, suppression, réactions, épinglage, messages éphémères, pièces jointes, vue unique, stickers), appels audio/vidéo, WIPP Touch, code QR (afficher / scanner), Explorer, profil, appareils connectés, blocage et signalement, suppression de compte dans l'app.

✅ ÉTAPE 1 SEULEMENT — NE CODE RIEN POUR L'INSTANT
Réponds avec : (a) la liste des écrans et leur navigation, (b) la liste des composants réutilisables, (c) la structure du fichier de thème, (d) la liste des Edge Functions à créer, (e) ta proposition pour la connexion : la connexion actuelle est faite maison (password_hash dans wipp_profiles + table wipp_sessions) ; propose une migration vers Supabase Auth en gardant la connexion par username, sans numéro de téléphone. J'enverrai ensuite les captures d'écran de l'app actuelle pour reproduire exactement le design, écran par écran.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/256061db-e451-4b1c-a5a6-94a5f8fcc7f8).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
