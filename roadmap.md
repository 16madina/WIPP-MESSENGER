# Roadmap
- [x] Accueil après présentation et saisie du téléphone selon les deux images fournies ; « Continuer » conserve le numéro sans lancer le SMS. Suite du parcours en attente des prochaines indications de l'utilisateur.
- [x] Lot 1 : messages synchronisés, réactions, modifier/supprimer/épingler, livré/lu réels, écrit… temps réel, file hors ligne
- [x] Lot 2 : épingler, archiver, sourdine (Toujours explicite), non lu manuel, brouillons locaux, recherche, infos
- [ ] Lot 1 : notifications push (doit vérifier wipp_is_muted) — bloqué : clé de compte de service Firebase
- [ ] Config Firebase web (4 valeurs) pour les SMS

- Lot 3 médias/contenus : fait (photos, vidéos, voir une fois, vocaux gestes, documents, Wippmojis, GIF locaux). WippPop animations : lot suivant. Envoi réel des médias + localisation, liens, éphémères, blocage, signalement : fait, non testé à deux comptes (Firebase).
- Lot 4 groupes : fait en démonstration locale (création 2 étapes, infos, admins, permissions, mentions, réactions détaillées, recherche ↑↓, invitation/réinitialisation, quitter, 2 groupes démo). À faire : groupes réels côté serveur + chiffrement de groupe (backend).
- [x] Lot 5 validation finale (tests écran téléphone, 4 corrections)
- [ ] REMOVE BEFORE PRODUCTION : mode démo (1234567 / test / test-mode)
- [x] Clôture Lovable : docs/lovable-freeze.md (checklist production incluse)
- Lot 6 (suite) : résolveur QR 4 types, scanner iPhone, Touch 10 états, protection des captures, bandeau hors ligne — fait. Bloqué : backend Touch/QR/demandes (accord requis sur audit).
- Lot 6 écrans : téléphone B (5 états, démo), stories (visibilité + suppression) — faits, NOT TESTED sur téléphone. Moi (compléments), passe de densité Chats, retests Touch/caméra/Debug/protection, audit final Lots 1→6 — à faire au prochain tour.
- Plan backend : docs/backend-migration-plan.md — en attente d'autorisation, rien exécuté.

- [ ] Production : wipp_touch_config calibrationLog = false avant publication
