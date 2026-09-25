# WIPP — Étape 1 : architecture proposée (aucun code écrit)

Aucun backend ne sera touché tant que le projet Supabase « WiPP » n'est pas connecté. Pas de Lovable Cloud, pas de Capacitor, aucune table créée ou modifiée.

## (a) Écrans et navigation

Racine : 4 onglets en bas (Discussions, Appels, Explorer, Profil), chacun avec sa propre pile de navigation.

```text
Non connecté
  Bienvenue → Créer un compte (username) → Choix du mot de passe → Avatar/nom affiché
  Bienvenue → Se connecter → (option) Ajouter cet appareil via QR

Onglet Discussions
  Liste des discussions (épinglées / non lues / en sourdine / archivées)
    → Discussion
        → Infos du contact ou du groupe
        → Recherche dans la discussion
        → Messages épinglés
        → Visionneuse média / vue unique
    → Nouvelle discussion → Ajouter par username | Scanner un QR | WIPP Touch
    → Archivées

Onglet Appels
  Historique des appels → Écran d'appel (audio/vidéo, plein écran) → Appel entrant

Onglet Explorer
  Explorer → Résultat de recherche de profil → Profil public → Ouvrir la discussion

Onglet Profil
  Mon profil → Modifier le profil
              → Mon QR (afficher / scanner)
              → Appareils connectés → Détail d'un appareil
              → Confidentialité et sécurité → Bloqués
              → Notifications
              → Apparence (clair / sombre / système)
              → Supprimer mon compte
```

Feuilles modales (montent du bas, poignée, fermeture par glissement) : réactions, réponse/transfert, pièces jointes, minuteur éphémère, signaler, sélecteur de stickers, confirmation de suppression.

Navigation : push glissé depuis la droite, retour vers la droite, geste de balayage depuis le bord gauche, grands titres qui se réduisent au scroll, barres translucides floutées.

## (b) Composants réutilisables

- Coquille : `AppShell`, `TabBar`, `NavHeader` (grand titre + réduction), `ScreenStack`, `Screen`, `Sheet`, `SafeArea`, `EdgeSwipeBack`
- Interactions : `Pressable` (échelle 0.97 en spring), `ListRow`, `SwipeActions`, `PullToRefresh`, `StaggeredList`, `Skeleton`, `EmptyState`, `Toast`
- Formulaires : `TextField`, `UsernameField`, `PasswordField`, `Button` (variantes), `Segmented`, `Switch`, `OtpBoxes`
- Identité : `Avatar`, `PresenceDot`, `UsernameTag`, `QrCode`, `QrScanner`
- Messagerie : `ChatListItem`, `MessageBubble`, `MessageStatus` (indicateurs personnalisés), `ReplyPreview`, `ReactionBar`, `PinnedBanner`, `Composer`, `AttachmentPreview`, `StickerPicker`, `EphemeralBadge`, `ViewOnceViewer`, `TypingIndicator`, `DateSeparator`
- Appels : `CallTile`, `CallControls`, `IncomingCallSheet`, `CallHistoryRow`
- WIPP Touch : `TouchRadar`, `TouchPairingCard`, `TouchResultSheet`

Indicateurs d'état : point pulsant (envoi), 1 point gris (envoyé), 2 points gris (reçu), 2 points jaunes reliés (lu), point rouge (échec). Respect de `prefers-reduced-motion` partout.

## (c) Fichier de thème unique

Un seul fichier `src/theme/theme.ts` (objet TypeScript exporté, sans dépendance web) recopiable tel quel dans React Native, plus un pont qui génère les variables CSS du design system.

```text
theme = {
  colors: { light: {...}, dark: {...} }   // fond, surfaces, verre, texte, primaire,
                                          // jaune « lu », succès, alerte, bordures
  typography: { family, sizes, weights, lineHeights, letterSpacing }
  spacing, radii, borders
  shadows   // élévations 0→4
  blur      // faible / moyen / fort (barres, feuilles)
  motion    // durées + springs nommés : push, sheet, press, stagger
  layout    // hauteurs barre d'onglets / en-tête, safe areas, largeur de référence 390
  zIndex
}
```

Aucune couleur écrite en dur dans les composants.

## (d) Edge Functions à créer (après connexion Supabase)

1. `auth-username` — inscription / connexion par username, sans numéro
2. `auth-device-link` — liaison d'un nouvel appareil par QR (`wipp_link_codes`, `wipp_devices`)
3. `livekit-token` — jeton d'accès LiveKit (clés en secrets)
4. `call-signal` — création et réponse aux invitations d'appel (`wipp_call_invites`)
5. `push-register` / `push-send` — jetons et envoi de notifications
6. `touch-arbiter` — arbitrage WIPP Touch (`wipp_touch_invites`, `_candidates`, `_config`)
7. `attachments-sign` — URLs signées pour les pièces jointes
8. `moderation-report` — signalements et blocages
9. `account-delete` — suppression complète du compte

Chaque fonction vérifie le jeton de l'appelant ; aucune clé privée côté client.

## (e) Connexion : migration vers Supabase Auth, sans numéro

Aujourd'hui : `password_hash` dans `wipp_profiles` + `wipp_sessions` maison — pas de RLS fiable, car les politiques ne peuvent pas s'appuyer sur `auth.uid()`.

Proposition : garder l'expérience « username + mot de passe », mais confier la session à Supabase Auth.

1. Chaque username est associé à un e-mail interne déterministe et invisible pour l'utilisateur (`<username_normalisé>@users.wipp.app`), avec confirmation automatique. Aucun numéro, aucune adresse réelle demandée.
2. Inscription : la fonction `auth-username` vérifie l'unicité du username, crée l'utilisateur via l'API admin, puis lie `wipp_profiles.id` à `auth.users.id`.
3. Connexion : le client envoie username + mot de passe, la fonction résout l'e-mail interne et renvoie une vraie session Supabase (jeton + refresh).
4. Migration des comptes existants : à la première connexion, l'ancien `password_hash` est vérifié une dernière fois, le compte Auth est créé avec ce même mot de passe, `wipp_profiles` est relié, puis le hash est effacé. Aucun utilisateur n'a besoin de réinitialiser son mot de passe.
5. `wipp_sessions` reste pour la liste « appareils connectés », alimentée par l'ID d'appareil, plus comme mécanisme d'authentification.
6. Toutes les politiques RLS sont ensuite réécrites sur `auth.uid()`. Priorité aux cinq tables ouvertes : `wipp_push_tokens`, `wipp_call_invites`, `wipp_touch_invites`, `wipp_touch_candidates`, `wipp_touch_config`.
7. Conséquence à valider : pas de réinitialisation de mot de passe par e-mail (aucune adresse réelle). Proposition de remplacement : un code de récupération affiché une fois à l'inscription.

## Ordre de travail proposé

1. Vous connectez le projet Supabase « WiPP ».
2. Je lis le schéma existant et je vous soumets le plan RLS complet avant toute écriture SQL.
3. Thème + coquille de navigation native, puis les écrans un par un d'après vos captures.

Point à confirmer : le code de récupération comme remplacement du mot de passe oublié (point e.7).
