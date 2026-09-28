# Carte professionnelle WIPP

## Résultat attendu
Transformer **Moi → Ma carte de visite professionnelle** en un parcours complet, fidèle à la maquette : création, aperçu premium, modification, QR professionnel, partage et découverte dans **Explorer → Boutiques**.

## Parcours
1. **Sans carte**
   - Afficher « Crée ta carte professionnelle » avec les trois bénéfices de la maquette.
   - Le bouton jaune ouvre la création.

2. **Création / modification**
   - Couverture, logo, nom, catégorie, description, pays, ville, adresse facultative et masquable, horaires, téléphone professionnel facultatif, site web et galerie.
   - Ne jamais préremplir ni exposer le numéro personnel WIPP.
   - Ajouter un bouton **Aperçu** avant l’enregistrement et permettre de revenir modifier.

3. **Carte premium**
   - Présentation sombre WIPP avec couverture, logo, informations publiques, galerie et QR business distinct du QR personnel.
   - Pour le propriétaire : **Modifier**, **Partager**, **Mon QR**.
   - Pour les visiteurs : **Écrire sur WIPP**, puis Appeler/Itinéraire seulement si les informations publiques existent.

4. **Partage**
   - Feuille « Partager ma carte » avec recherche et contacts récents.
   - Envoi dans WIPP sous forme de carte riche ouvrant la fiche professionnelle.
   - Actions : **Partager sur WIPP**, **Copier le lien**, **Partager le QR**, **Partager ailleurs** via le partage natif.
   - URL stable `https://wippapp.com/b/<identifiant-public>` sans identifiant privé.

## Données et sécurité
- Ajouter une nouvelle table `wipp_business_cards` sans modifier les tables WIPP existantes.
- Une carte par compte pour cette version, avec identifiant public stable et propriétaire dérivé de la session.
- Lecture publique limitée aux champs volontairement publiés ; création, modification et suppression réservées au propriétaire avec RLS.
- Ajouter un espace de stockage dédié aux couvertures, logos et galeries, avec limites d’images et règles d’accès sécurisées.
- Les champs privés du profil, le numéro personnel, l’email et les identifiants d’authentification ne sortent jamais.

## Intégration existante
- Réutiliser l’apparence Boutique déjà présente plutôt que créer un second système concurrent.
- Charger les vraies cartes dans **Explorer → Boutiques** et dans sa recherche.
- Étendre le résolveur `/b/<identifiant-public>` pour ouvrir une carte réelle depuis un QR ou un lien.
- Conserver les boutiques de démonstration séparées et ne toucher à aucune autre fonctionnalité.
- Rendre les liens de carte partagés dans une conversation comme des cartes riches, sans modifier la table des messages.

## Vérification
- Tester création, aperçu, modification, images et persistance après actualisation.
- Tester recherche dans Explorer, vue publique et contact WIPP.
- Tester QR business, ouverture depuis scan, copie du lien, QR partagé et partage natif.
- Tester l’envoi à un contact et l’ouverture de la carte depuis le message.
- Vérifier qu’un autre compte ne peut pas modifier la carte et qu’aucune donnée privée n’est exposée.
- Vérifier les écrans téléphone et large, puis confirmer l’état de compilation.
