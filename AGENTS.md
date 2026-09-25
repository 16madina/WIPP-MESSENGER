<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Thème : src/theme/theme.ts est la seule source des tokens ; injecté en variables CSS --wipp-* dans __root et exposé en classes Tailwind wipp-*. Pourquoi : portable vers React Native.
- Navigation native : AppShell + StackNavigator (pile en mémoire, push/pop spring, retour par balayage) dans src/components/native. Pourquoi : sensation d'app native, découpage réutilisable en Expo.
- Logique serveur en fonctions serveur TanStack (src/lib/*.functions.ts), pas en Edge Functions : la plateforme bloque la création de nouvelles Edge Functions sur ce projet.
- Surprises de conversation : parcours et carte à gratter dans src/components/native, données temporaires dans ChatScreen ; aucune donnée secrète ne sort vers le serveur tant que le chiffrement et le type de message ne sont pas prêts. Pourquoi : garder une démonstration UI sûre et réutilisable.
- Feuilles natives : Sheet rend son panneau dans un portail au niveau du document. Pourquoi : éviter que la barre de saisie ne borne et masque les feuilles ouvertes depuis une conversation.
