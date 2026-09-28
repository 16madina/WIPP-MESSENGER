// Envoi FCM v1 (serveur uniquement).
type ServiceAccount = { client_email: string; private_key: string; project_id?: string };

let cachedToken: { value: string; expiresAt: number } | null = null;

export function readServiceAccount(): ServiceAccount | null {
  const raw = process.env["FIREBASE_SERVICE_ACCOUNT"];
  if (!raw) return null;
  try {
    const sa = JSON.parse(raw) as ServiceAccount;
    return sa.client_email && sa.private_key ? sa : null;
  } catch {
    return null;
  }
}

export async function googleAccessToken(sa: ServiceAccount): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const { createSign } = await import("node:crypto");
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;
  const sign = createSign("RSA-SHA256");
  sign.update(unsigned);
  const jwt = `${unsigned}.${sign.sign(sa.private_key, "base64url")}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  if (!res.ok) throw new Error(`Google OAuth [${res.status}]: ${await res.text()}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

export async function sendFcm(accessToken: string, projectId: string, token: string, title: string, body: string, path: string) {
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        token,
        notification: { title, body },
        data: { path },
        webpush: { notification: { icon: "/favicon.svg" } },
      },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    // Jeton périmé : 404 UNREGISTERED / 400 → à supprimer par l'appelant.
    const stale = res.status === 404 || res.status === 400;
    const err = new Error(`FCM [${res.status}]: ${text}`) as Error & { stale?: boolean };
    err.stale = stale;
    throw err;
  }
}

