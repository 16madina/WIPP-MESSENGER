import { useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { Screen } from "@/components/native/Screen";
import { Avatar } from "@/components/native/Avatar";
import { Pressable } from "@/components/native/Pressable";
import { chats } from "@/data/mock";

/** Explorer : recherche de profils par username + suggestions (données factices). */
export function ExploreScreen() {
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase().replace(/^@/, "");
  const results = term ? chats.filter((c) => c.username.includes(term) || c.name.toLowerCase().includes(term)) : [];
  const suggestions = chats.slice(0, 5);

  return (
    <Screen title="Explorer">
      <div className="px-4 pb-3">
        <label className="glass flex items-center gap-2 rounded-[14px] border border-wipp-glass-border px-3 py-2.5">
          <Search size={18} className="text-wipp-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un @username"
            autoCapitalize="none"
            autoCorrect="off"
            className="flex-1 bg-transparent text-wipp-fg outline-none placeholder:text-wipp-muted"
          />
        </label>
      </div>
      {term ? (
        <Section title="Résultats">
          {results.length ? results.map((c) => <ProfileRow key={c.id} name={c.name} username={c.username} online={c.online} />) : (
            <p className="px-4 py-6 text-center text-wipp-muted">Aucun profil « @{term} »</p>
          )}
        </Section>
      ) : (
        <Section title="Suggestions">
          {suggestions.map((c) => <ProfileRow key={c.id} name={c.name} username={c.username} online={c.online} />)}
        </Section>
      )}
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="px-4 pb-1 pt-2 text-[13px] font-semibold uppercase tracking-wide text-wipp-muted">{title}</h2>
      <ul>{children}</ul>
    </section>
  );
}

function ProfileRow({ name, username, online }: { name: string; username: string; online?: boolean | undefined }) {
  return (
    <li className="flex items-center gap-3 px-4 py-2">
      <Avatar name={name} size={44} online={online} />
      <div className="flex-1 border-b border-wipp-sep pb-2">
        <div className="font-semibold text-wipp-fg">{name}</div>
        <div className="text-[13px] text-wipp-muted">@{username}</div>
      </div>
      <Pressable aria-label={`Ajouter ${name}`} className="flex h-9 w-9 items-center justify-center rounded-full bg-wipp-accent/15 text-wipp-accent">
        <UserPlus size={18} />
      </Pressable>
    </li>
  );
}
