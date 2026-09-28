import { useEffect, useState } from "react";
import { profileQr, tempQr } from "@/lib/qr-payload";
import { issueTemp } from "@/lib/qr-remote";
import { stashHandoff } from "@/components/qr-results";
import { LiveScanner } from "@/components/live-scanner";
import { BadgeCheck, Lock, MapPin, Phone, QrCode, ScanLine, Search, Share2, Smartphone, Store, Video } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { SmartImg } from "@/components/smart-img";
import { WippMark, WippWordmark } from "@/components/logo";
import { QrCard } from "@/components/qr-card";
import { BlockSheet, ReportSheet } from "@/components/safety";
import { Btn, Chip, Empty, Header, SearchField, StatusBar } from "@/components/ui";
import { providers } from "@/lib/providers";
import { useT, useWgoStore } from "@/lib/store";
import type { FoundVia } from "@/lib/types";
import { cn, APP_HOST } from "@/lib/utils";
import { ConnectHubExtras, ScanResultHint } from "./connect-extras";
import { getActiveTouchInvite } from "@/lib/messaging/touch-active";
import { acceptTouchCode, resolveTouchCode } from "@/lib/messaging/touch-client";
import { ensureServerSession, getStoredToken } from "@/lib/messaging/client";

export function ConnectScreen() {
  const t = useT();
  const push = useWgoStore((s) => s.push);

  const cards = [
    { name: "scanner" as const, icon: ScanLine, title: t("scan"), sub: t("scanSub") },
    { name: "my-qr" as const, icon: QrCode, title: t("myQr"), sub: t("myQrSub") },
    { name: "search-user" as const, icon: Search, title: t("searchCard"), sub: t("searchCardSub") },
    { name: "nearby" as const, icon: MapPin, title: t("nearby"), sub: t("nearbySub") },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="glass sticky top-0 z-10">
        <StatusBar />
        <div className="flex h-[var(--wipp-nav-bar-height)] items-center px-5">
          <h1 className="min-w-0 truncate text-[24px] leading-tight font-semibold tracking-tight">{t("connectTitle")}</h1>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar pb-24 pt-1">
        <button
          type="button"
          onClick={() => push({ name: "wgo-touch" })}
          className="press mx-4 flex w-[calc(100%-2rem)] items-center gap-3 rounded-2xl bg-navy px-4 py-3.5 text-left text-paper ring-1 ring-accent/35"
        >
          <WippMark size={52} invert />
          <div className="flex-1">
            <p className="text-[16px] font-semibold">{t("wgoTouch")}</p>
            <p className="text-[12px] text-paper/60">{t("wgoTouchSub")}</p>
          </div>
          <span className="rounded-full bg-accent px-2 py-1 text-[11px] font-semibold text-accent-fg">
            {t("touchLive")}
          </span>
        </button>
        <div className="mt-3 grid grid-cols-2 gap-3 px-4">
          {cards.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => push({ name: c.name })}
              className="press flex min-h-[108px] flex-col items-start rounded-2xl glass-card p-3.5 text-left"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-navy text-paper">
                <c.icon className="size-5" />
              </span>
              <span className="mt-auto pt-3 text-[15px] font-semibold">{c.title}</span>
              <span className="mt-0.5 text-[11px] leading-snug text-muted">{c.sub}</span>
            </button>
          ))}
        </div>
        <ConnectHubExtras />
      </div>
    </div>
  );
}

export function MyQrScreen() {
  const t = useT();
  const pop = useWgoStore((s) => s.pop);
  const push = useWgoStore((s) => s.push);
  const me = useWgoStore((s) => s.me);
  const [copied, setCopied] = useState(false);
  const [temp, setTemp] = useState<{ token: string; expiresAt: number } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!temp) return;
    const id = window.setInterval(() => {
      const n = Date.now();
      setNow(n);
      // À expiration : ancien jeton invalidé, nouveau jeton émis.
      if (n >= temp.expiresAt) void renewTemp();
    }, 1000);
    return () => window.clearInterval(id);
  }, [temp]);
  const [tempErr, setTempErr] = useState<string | null>(null);
  async function renewTemp() {
    setTemp(null);
    try {
      const r = await issueTemp();
      if ("error" in r) setTempErr(r.error === "no_session" ? "Connecte-toi avec un vrai compte pour un QR temporaire." : "QR temporaire indisponible, réessaie.");
      else { setTempErr(null); setTemp(r); setNow(Date.now()); }
    } catch {
      setTempErr("QR temporaire indisponible, réessaie.");
    }
  }
  const left = temp ? Math.max(0, Math.ceil((temp.expiresAt - now) / 1000)) : 0;
  const touchInvite = getActiveTouchInvite();
  const isTouchShare = Boolean(touchInvite?.status === "active" && touchInvite.code);
  const permanent = profileQr(me.username);
  const qrValue = isTouchShare ? touchInvite!.qrPayload : temp ? tempQr(temp.token) : permanent;
  const link = qrValue.replace(/^https?:\/\//, "").replace(/\/t\/.{8}.*/, "/t/…");
  const shareUrl = isTouchShare ? touchInvite!.qrPayload : permanent;
  void APP_HOST;
  async function save() {
    const svg = document.querySelector(".wipp-qr-save svg");
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `wipp-${me.username}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function share() {
    const payload = {
      title: "Wipp",
      text: isTouchShare ? `Code WIPP Touch ${touchInvite!.code}` : `@${me.username}`,
      url: shareUrl,
    };
    try {
      if (navigator.share) await navigator.share(payload);
      else {
        await navigator.clipboard.writeText(isTouchShare ? touchInvite!.code : shareUrl);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }
    } catch {
      await navigator.clipboard.writeText(isTouchShare ? touchInvite!.code : shareUrl);
      setCopied(true);
    }
  }

  return (
    <div className="flex h-full flex-col bg-navy text-paper">
      <StatusBar />
      <Header title={isTouchShare ? t("wgoTouch") : t("myQr")} onBack={pop} className="text-paper [&_button]:text-paper" />
      <div className="flex flex-1 flex-col items-center overflow-y-auto no-scrollbar px-6 pt-2 pb-10">
        <WippWordmark className="mb-4 text-[22px] text-paper" />
        <Avatar user={me} size={72} />
        <p className="mt-3 text-[20px] font-semibold">{me.displayName}</p>
        <p className="text-[14px] text-paper/60">@{me.username}</p>
        {isTouchShare ? (
          <p className="mt-2 font-mono text-[22px] font-semibold tracking-[0.2em] text-accent">{touchInvite!.code}</p>
        ) : null}
        <div className="wipp-card wipp-qr-save mt-5 rounded-2xl p-1">
          <div className="rounded-xl bg-paper p-4">
            <QrCard value={qrValue} size={220} />
          </div>
        </div>
        {tempErr && !temp ? <p className="mt-3 text-[13px] text-danger" role="alert">{tempErr}</p> : null}
        {temp && !isTouchShare ? (
          <p className="mt-3 font-mono text-[13px] text-accent" aria-live="polite">
            Expire dans {String(Math.floor(left / 60)).padStart(2, "0")}:{String(left % 60).padStart(2, "0")}
          </p>
        ) : null}
        <p className="mt-3 max-w-[30ch] text-center text-[13px] leading-relaxed text-paper/60">
          {isTouchShare
            ? t("touchFail")
            : temp
              ? "QR temporaire : usage unique, il se renouvelle tout seul."
              : "Ce QR ne contient ni ton numéro, ni ton e-mail."}
        </p>
        <p className="mt-1 text-[12px] text-paper/40">{link}</p>
        <Btn className="mt-5 w-full" onClick={share}>
          <Share2 className="size-4" />
          {copied ? t("copied") : "Partager mon WIPP"}
        </Btn>
        {!isTouchShare ? (
          <div className="mt-2 grid w-full grid-cols-2 gap-2">
            <Btn variant="secondary" onClick={() => void save()}>Enregistrer</Btn>
            <Btn
              variant="secondary"
              onClick={() => (temp ? setTemp(null) : void renewTemp())}
            >
              {temp ? "QR permanent" : "QR temporaire"}
            </Btn>
          </div>
        ) : null}
        {!isTouchShare ? (
          <Btn variant="secondary" className="mt-2 w-full" onClick={() => push({ name: "wgo-touch" })}>
            <Smartphone className="size-4" />
            {t("wgoTouch")}
          </Btn>
        ) : null}
      </div>
    </div>
  );
}

export function ScannerScreen() {
  const t = useT();
  const pop = useWgoStore((s) => s.pop);
  const replace = useWgoStore((s) => s.replace);
  const completeTouch = useWgoStore((s) => s.completeTouch);
  const redeemQr = useWgoStore((s) => s.redeemQr);
  const me = useWgoStore((s) => s.me);
  const [scan, setScan] = useState<null | "profile" | "once" | "group" | "shop">(null);
  const [fail, setFail] = useState<string | null>(null);
  const [touchCode, setTouchCode] = useState("");
  const [touchBusy, setTouchBusy] = useState(false);

  async function redeemTouchCode(raw: string) {
    const code = raw
      .trim()
      .toUpperCase()
      .replace(/^.*\/T\//i, "")
      .replace(/[^A-Z0-9]/g, "");
    if (code.length < 6) {
      setFail(t("codeNotFound"));
      return;
    }
    setTouchBusy(true);
    setFail(null);
    try {
      if (!getStoredToken()) {
        await ensureServerSession({
          username: me.username || "deena",
          displayName: me.displayName,
        });
      }
      await resolveTouchCode(code, { manual: true });
      const { invite } = await acceptTouchCode(code);
      const r = invite.receiver;
      const sender = invite.sender;
      useWgoStore.setState((st) => ({
        users: {
          ...st.users,
          [sender.id]: {
            ...st.users[sender.id],
            id: sender.id,
            firstName: sender.firstName,
            lastName: "",
            displayName: sender.displayName,
            username: sender.username,
            bio: "",
            avatar: sender.avatarUrl || "/avatars/deena.jpg",
            online: true,
            city: "",
            connected: true,
          },
        },
      }));
      completeTouch(sender.id);
      replace({ name: "found-profile", userId: sender.id, via: "touch" });
      void r;
    } catch (err) {
      setFail(err instanceof Error ? err.message : t("codeNotFound"));
    } finally {
      setTouchBusy(false);
    }
  }

  useEffect(() => {
    if (!scan) return;
    const id = window.setTimeout(() => {
      if (scan === "profile") {
        replace({ name: "found-profile", userId: "lea", via: "qr" });
        return;
      }
      if (scan === "group") {
        replace({ name: "group-invite", token: "soiree-samedi" });
        return;
      }
      const token =
        scan === "once" ? "once-lea-cafe" : scan === "shop" ? "shop-nails" : "event-soiree-sam";
      const res = redeemQr(token);
      if (!res.ok) {
        setFail(
          res.reason === "used"
            ? t("codeUsed")
            : res.reason === "expired"
              ? t("qrExpired")
              : t("codeNotFound"),
        );
        setScan(null);
      }
    }, 1100);
    return () => window.clearTimeout(id);
  }, [scan, replace, redeemQr, t]);

  return (
    <div className="flex h-full flex-col bg-ink text-paper">
      <StatusBar />
      <Header title={t("scan")} onBack={pop} className="text-paper [&_button]:text-paper" />
      <LiveScanner
        onFallback={(to) => replace({ name: to === "search" ? "search-user" : "my-qr" })}
        onResult={(d) => {
          if (!d.ok) return setFail(d.error);
          if (d.kind === "profile") replace({ name: "found-profile", userId: d.userId, via: "qr" });
          else if (d.kind === "remote-profile") replace({ name: "qr-profile", key: stashHandoff({ kind: "profile", profile: d.profile, connected: d.connected }) });
          else if (d.kind === "remote-group") replace({ name: "qr-group", key: stashHandoff({ kind: "group", token: d.token, name: d.name, members: d.members, member: d.member }) });
          else if (d.kind === "group") replace({ name: "group-invite", token: d.token });
          else replace({ name: "shop", shopId: d.shopId });
        }}
      />
      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <p className="mt-2 text-[14px] text-paper/60">{t("scanHint")}</p>
        {fail ? <p className="mt-2 text-[13px] text-danger" role="alert">{fail}</p> : null}
        <div className="mt-6 w-full rounded-2xl bg-paper/8 p-3 ring-1 ring-paper/10">
          <p className="mb-2 text-center text-[12px] text-paper/50">Code WIPP Touch</p>
          <input
            value={touchCode}
            onChange={(e) => setTouchCode(e.target.value.toUpperCase())}
            placeholder="ABCD2345"
            maxLength={12}
            className="h-11 w-full rounded-xl bg-ink px-3 text-center font-mono text-[18px] tracking-[0.2em] text-paper outline-none ring-1 ring-paper/15"
          />
          <Btn
            className="mt-2 w-full"
            disabled={touchBusy || touchCode.trim().length < 6}
            onClick={() => void redeemTouchCode(touchCode)}
          >
            {touchBusy ? "…" : t("touchAllow")}
          </Btn>
        </div>
        {import.meta.env.DEV ? (
          /* REMOVE BEFORE PRODUCTION — simulateurs de scan (mode développeur uniquement) */
          <details className="mt-6 w-full text-[12px] text-paper/50">
            <summary className="cursor-pointer py-2 text-center">Debug · simuler un scan</summary>
            <div className="grid gap-2">
              <Btn variant="secondary" onClick={() => { setFail(null); setScan("profile"); }}>{t("scanProfile")}</Btn>
              <Btn variant="secondary" onClick={() => { setFail(null); setScan("once"); }}>{t("scanOnce")}</Btn>
              <Btn variant="secondary" onClick={() => { setFail(null); setScan("group"); }}>{t("scanGroup")}</Btn>
              <Btn variant="secondary" onClick={() => { setFail(null); setScan("shop"); }}>{t("scanShop")}</Btn>
            </div>
          </details>
        ) : null}
      </div>
    </div>
  );
}

export function SearchUserScreen() {
  const t = useT();
  const pop = useWgoStore((s) => s.pop);
  const push = useWgoStore((s) => s.push);
  const users = useWgoStore((s) => s.users);
  const shops = useWgoStore((s) => s.shops);
  const blocked = useWgoStore((s) => s.blockedIds);
  const [q, setQ] = useState("");
  const query = q.replace(/^@/, "").toLowerCase();
  const hits = Object.values(users).filter(
    (u) =>
      !blocked.includes(u.id) &&
      query.length > 0 &&
      (`${u.username} ${u.displayName} ${u.firstName} ${u.lastName}`.toLowerCase().includes(query)),
  );
  const shopHits = shops.filter(
    (s) =>
      query.length > 0 &&
      `${s.handle} ${s.name} ${s.city}`.toLowerCase().includes(query),
  );

  return (
    <div className="flex h-full flex-col">
      <StatusBar />
      <Header title={t("searchCard")} onBack={pop} />
      <div className="px-4">
        <SearchField
          autoFocus
          placeholder="@username"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="mt-2 flex-1 overflow-y-auto no-scrollbar px-4">
        {shopHits.map((s) => (
          <button
            key={s.id}
            type="button"
            className="flex w-full items-center gap-3 py-3 text-left"
            onClick={() => push({ name: "shop", shopId: s.id })}
          >
            {s.image ? (
              <SmartImg src={s.image} alt="" className="size-12 rounded-full object-cover" />
            ) : (
              <span className="flex size-12 items-center justify-center rounded-full bg-navy text-accent">
                <Store className="size-5" />
              </span>
            )}
            <span>
              <span className="block text-[16px] font-medium">{s.name}</span>
              <span className="text-[13px] text-muted">
                {t("shopContext")} · @{s.handle}
              </span>
            </span>
          </button>
        ))}
        {hits.map((u) => (
          <button
            key={u.id}
            type="button"
            className="flex w-full items-center gap-3 py-3 text-left"
            onClick={() => push({ name: "found-profile", userId: u.id, via: "username" })}
          >
            <Avatar user={u} size={48} />
            <span>
              <span className="block text-[16px] font-medium">{u.displayName}</span>
              <span className="text-[13px] text-muted">@{u.username}</span>
            </span>
          </button>
        ))}
        {query && hits.length === 0 && shopHits.length === 0 ? (
          <p className="pt-10 text-center text-[14px] text-muted">{t("noResults")}</p>
        ) : null}
      </div>
    </div>
  );
}

export { NearbyScreen } from "./nearby";

export function FoundProfileScreen({
  userId,
  via,
}: {
  userId: string;
  via?: FoundVia;
}) {
  const t = useT();
  const pop = useWgoStore((s) => s.pop);
  const push = useWgoStore((s) => s.push);
  const users = useWgoStore((s) => s.users);
  const me = useWgoStore((s) => s.me);
  const sent = useWgoStore((s) => s.sentRequestIds.includes(userId));
  const blocked = useWgoStore((s) => s.blockedIds.includes(userId));
  const connectWith = useWgoStore((s) => s.connectWith);
  const openOrCreateDm = useWgoStore((s) => s.openOrCreateDm);
  const startCall = useWgoStore((s) => s.startCall);
  const unblockUser = useWgoStore((s) => s.unblockUser);
  const verified = useWgoStore((s) => s.verifiedIds.includes(userId));
  const chats = useWgoStore((s) => s.chats);
  const user = userId === "me" ? me : users[userId];
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  if (!user) return null;
  const connected = user.connected || userId === "me";

  return (
    <div className="flex h-full flex-col">
      <StatusBar />
      <Header title={t("foundTitle")} onBack={pop} />
      <div className="flex flex-1 flex-col items-center px-6 pt-4">
        <Avatar user={user} size={112} />
        <h1 className="mt-4 flex items-center gap-1.5 text-[24px] font-semibold">
          {user.displayName}
          {verified ? <BadgeCheck className="size-5 text-accent" /> : null}
        </h1>
        <p className="text-[15px] text-muted">@{user.username}</p>
        {connected && userId !== "me" ? (
          <p className="mt-1 flex items-center gap-1 text-[12px] text-muted">
            <Lock className="size-3" />
            {verified ? t("e2eVerified") : t("e2eOn")}
          </p>
        ) : null}
        <ScanResultHint via={via} />
        {user.bio ? (
          <p className="mt-3 max-w-[32ch] text-center text-[14px] leading-relaxed text-muted">
            {user.bio}
          </p>
        ) : null}
        <p className="mt-2 text-[12px] text-muted">
          {user.city} · 2 {t("commonContacts")}
        </p>
        {connected && userId !== "me" ? (
          <div className="mt-6 flex items-center justify-center gap-8">
            <button
              type="button"
              className="press flex flex-col items-center gap-1.5"
              onClick={() => startCall(userId, "audio")}
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-navy text-paper">
                <Phone className="size-5" />
              </span>
              <span className="text-[11px] font-medium text-muted">{t("audioCall")}</span>
            </button>
            <button
              type="button"
              className="press flex flex-col items-center gap-1.5"
              onClick={() => startCall(userId, "video")}
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-navy text-paper">
                <Video className="size-5" />
              </span>
              <span className="text-[11px] font-medium text-muted">{t("videoCall")}</span>
            </button>
          </div>
        ) : null}
        {connected && userId !== "me" ? (
          <button
            type="button"
            className="mt-5 flex items-center gap-2 text-[13px] text-muted"
            onClick={() => {
              const chat = chats.find(
                (c) => c.type === "dm" && c.participantIds.includes(userId) && !c.ephemeral,
              );
              if (chat) push({ name: "e2e-info", chatId: chat.id });
              else {
                const id = openOrCreateDm(userId);
                push({ name: "e2e-info", chatId: id });
              }
            }}
          >
            <Lock className="size-3.5" />
            {t("e2eCompare")}
          </button>
        ) : null}
        {userId !== "me" ? (
          <div className="mt-5 grid w-full gap-2">
            <Btn
              disabled={sent && !connected}
              onClick={() => (connected ? openOrCreateDm(userId) : connectWith(userId))}
            >
              {connected ? t("message") : sent ? t("requestSent") : t("connectWith")}
            </Btn>
            {connected ? (
              <Btn
                variant="secondary"
                onClick={() => push({ name: "introduce", toUserId: userId })}
              >
                {t("introduce")}
              </Btn>
            ) : (
              <Btn variant="secondary" onClick={() => openOrCreateDm(userId, true)}>
                {t("message")}
              </Btn>
            )}
            <Btn
              variant="ghost"
              onClick={() => setReportOpen(true)}
            >
              {t("report")}
            </Btn>
            {blocked ? (
              <Btn variant="ghost" onClick={() => unblockUser(userId)}>
                {t("unblock")}
              </Btn>
            ) : (
              <Btn variant="ghost" className="text-danger" onClick={() => setBlockOpen(true)}>
                {t("block")}
              </Btn>
            )}
          </div>
        ) : null}
      </div>
      <ReportSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        kind="user"
        targetId={userId}
        blockUserId={userId}
        onSubmitted={pop}
      />
      <BlockSheet
        open={blockOpen}
        onClose={() => setBlockOpen(false)}
        userId={userId}
        onBlocked={pop}
      />
    </div>
  );
}
