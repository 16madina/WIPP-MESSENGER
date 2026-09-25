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
