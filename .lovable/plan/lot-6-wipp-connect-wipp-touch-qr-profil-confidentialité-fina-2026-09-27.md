# Lot 6 — WIPP Connect, WIPP Touch, QR, Profil, Confidentialité, Finalisation

Contrainte : ne rien reconstruire ni redessiner. Compléter l'existant (écrans Connect, Mon QR, Scanner, Recherche, À proximité, Fiche trouvée, WIPP Touch, WIPP Privé, Stories, Moi) et ne casser aucun lot 1–5. Aucune modification de table sans accord.

## 1. WIPP Connect (bouton central)
- Le tap sur le bouton WIPP ouvre une feuille native à ~72 % : grande carte WIPP Touch, puis Scanner un QR, Mon QR, Rechercher, À proximité ; pied « Plus besoin de demander un numéro. Demande son WIPP. »
- Design du bouton inchangé.

## 2. WIPP Touch (vraie fonction, détection native plus tard)
- Machine à états unique : ready, searching, detected, confirming, request_sent, accepted, declined, expired, multiple_devices, failed.
- Écran sombre, animation des deux téléphones, fiche publique détectée (photo, nom, @username) + « Se connecter » — jamais de connexion automatique.
- Côté B : feuille « X veut se connecter avec toi sur WIPP » (Accepter / Refuser), puis « Vous êtes connectés ✨ » (Écrire / Voir le profil), contact ajouté.
- Repli : « Personne détectée » → Afficher mon QR / Scanner son QR / Réessayer.
- Le fournisseur de proximité est séparé de l'écran (web = simulation claire, natif = BLE/NFC dans Cursor). Aucun numéro ni identifiant permanent diffusé : jetons courts.

## 3. QR
- Mon QR : carte premium, Partager / Enregistrer / QR temporaire. Le QR ne contient qu'une référence publique ou un jeton opaque.
- QR temporaire : compte à rebours discret (« Expire dans 01:12 »), renouvellement automatique, états active/used/expired/invalid.
- Scanner : vraie caméra quand le navigateur l'autorise, cadre jaune, lampe seulement si disponible, vibration, arrêt du scan dès détection. Écran d'autorisation et repli (Rechercher / Mon QR) si refus.
- Erreurs : pas un QR WIPP, expiré, déjà utilisé, utilisateur introuvable, vérification impossible. Aucun texte arbitraire interprété comme un utilisateur.

## 4. Recherche, demandes, profil public, partage, à proximité
- Recherche « Nom ou @username » : avatar, nom, @username, Se connecter / Écrire. Jamais de numéro.
- Demandes (Chats) reliées : photo, nom, @username, message d'intro ; Accepter / Ignorer ; menu Bloquer / Signaler.
- Profil public : photo, nom, @username, bio, ville si choisie ; Se connecter ou Message | Audio | Vidéo selon la relation.
- Partager mon WIPP : lien wippapp.com/@username (page web publique sûre ; liens natifs plus tard).
- À proximité : « Visible temporairement » activable/désactivable, pas de carte ni de distance précise.

## 5. Confidentialité et Moi
- WIPP Privé : parcours explication → code → confirmation → biométrie (plus tard) ; appui 3 s sur le logo ; aucun indice sur Chats ; « Masquer et verrouiller » depuis l'appui long ; notification anonyme « WIPP — Nouveau message ».
- Protection d'écran : réglages et niveaux none / sensitive / view_once / private_chat / story / profile_photo, bouclier de confidentialité, option par conversation. Aucune promesse absolue.
- Moi : en-tête (avatar, nom, @username, bio, Modifier / Mon QR / Partager), raccourcis, liste de réglages demandée.
- Confidentialité regroupée : WIPP Privé, Qui peut m'appeler, Demandes, Visibilité à proximité, Stories, Photo de profil, Protection des captures.
- Stories : compléter seulement ce qui manque (supprimer sa story, « Qui peut voir ma story ? »). Photo de profil agrandie selon réglage.
- Préférences de notifications complétées ; états vides chaleureux ; bandeau hors ligne / réessayer sans écran blanc.

## 6. Architecture pour Cursor
Fournisseurs remplaçables : ProximityProvider, QRScannerProvider, ScreenProtectionProvider, BiometricProvider, ShareProvider, NotificationProvider (versions web aujourd'hui).

## 7. Serveur / base (BACKEND)
- Les tables `wipp_touch_invites` et `wipp_touch_candidates` existent déjà : je les réutilise pour WIPP Touch et le QR temporaire si leurs règles le permettent, via fonctions serveur, sans modifier leur structure.
- Demandes de connexion réelles, profil public par @username, lien public : si aucune table existante ne convient, je m'arrête et je te présente la modification exacte pour accord. D'ici là, ces parties restent en démonstration clairement marquée.
- Le mode démo (1234567 / test) reste marqué « à retirer avant production ».

## 8. Audit final et rapport
Test complet sur téléphone 390×844 de tous les parcours des lots 1–6, puis rapport : PASS, FIXED, SIMULATED, BACKEND, NATIVE, SECURITY, REMOVE BEFORE PRODUCTION, avec WIPP Touch et QR détaillés séparément.

## Détails techniques
- Fournisseurs dans `src/lib/providers/*` (interface + implémentation web), état Touch dans un module dédié, écrans existants `connect.tsx` / `touch.tsx` enrichis.
- Scanner : `BarcodeDetector` quand disponible, sinon décodeur JS léger.
- Format QR : `https://wippapp.com/q/<ref>` (permanent) et `.../t/<jeton>` (temporaire) ; résolution uniquement côté serveur.
