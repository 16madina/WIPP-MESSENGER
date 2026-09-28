# Roadmap
- [x] Remplacer uniquement l'onglet Stickers par la version complète et actuelle de wipp-grok (tous les sous-onglets, stickers et animations), après accès à sa source.
- [x] Rendre accessibles tous les packs Stickers disponibles dans le projet (Wippmojis, classiques, Elle, Lui, Fun, Fun 2, WIPP, Scènes, Général, AniWipp), avec leurs formats animés conservés, sans changer les autres onglets. Version antérieure remplacée par les familles et animations actuelles de wipp-grok.
- [x] Conversation : rapprocher les réactions WIPP du menu compact et permettre de répondre par balayage aux textes, photos et vidéos sans ouvrir le média.
- [x] Moi : retirer les panneaux de test messagerie et liaison web, rapprocher Mon activité ; retirer les accès de démonstration du client sans toucher à la messagerie réelle. Liaison web conservée dans le code pour un futur Moi → Paramètres → Appareils liés.
- [x] Drapeau et indicatif visibles sur la saisie du téléphone ; tous les pays regroupés par région dans la sélection.
- [x] Menu de message compact dans la conversation, actions courantes visibles et « Plus… » pour les autres.
- [x] Accueil et saisie du téléphone selon les images fournies ; « Continuer » envoie le SMS Firebase.
- [x] Vérification SMS puis profil (nom, prénom, pays conservé, photo, pseudo unique, sans mot de passe) selon les deux nouvelles images. SMS réel à vérifier lorsque Firebase est disponible.
- [x] Création réussie : récompense plein écran automatique, puis Chats ; accueil de connexion uniquement si la liste est vide.
- [x] Lot 1 : messages synchronisés, réactions, modifier/supprimer/épingler, livré/lu réels, écrit… temps réel, file hors ligne
- [x] Lot 2 : épingler, archiver, sourdine (Toujours explicite), non lu manuel, brouillons locaux, recherche, infos
- [ ] Lot 1 : notifications push (doit vérifier wipp_is_muted) — bloqué : clé de compte de service Firebase
- [ ] Config Firebase web (4 valeurs) pour les SMS

- Lot 3 médias/contenus : fait (photos, vidéos, voir une fois, vocaux gestes, documents, Wippmojis, GIF locaux). WippPop animations : lot suivant. Envoi réel des médias + localisation, liens, éphémères, blocage, signalement : fait, non testé à deux comptes (Firebase).
- Lot 4 groupes : fait en démonstration locale (création 2 étapes, infos, admins, permissions, mentions, réactions détaillées, recherche ↑↓, invitation/réinitialisation, quitter, 2 groupes démo). À faire : groupes réels côté serveur + chiffrement de groupe (backend).
- [x] Lot 5 validation finale (tests écran téléphone, 4 corrections)
- [x] Retirer le mode démo (1234567 / test / test-mode) et les connexions aux comptes de test du parcours public.
- [x] Clôture Lovable : docs/lovable-freeze.md (checklist production incluse)
- Lot 6 (suite) : résolveur QR 4 types, scanner iPhone, Touch 10 états, protection des captures, bandeau hors ligne — fait. Bloqué : backend Touch/QR/demandes (accord requis sur audit).
- Lot 6 écrans : téléphone B (5 états, démo), stories (visibilité + suppression) — faits, NOT TESTED sur téléphone. Moi (compléments), passe de densité Chats, retests Touch/caméra/Debug/protection, audit final Lots 1→6 — à faire au prochain tour.
- Plan backend : docs/backend-migration-plan.md — en attente d'autorisation, rien exécuté.

- [ ] Production : wipp_touch_config calibrationLog = false avant publication

- [x] Compte admin Deena (+1 819 580 3940, code temporaire) + espace Admin dans Moi
- [ ] Carte professionnelle réelle : créer, modifier, afficher, QR business, partager et découvrir dans Explorer.
