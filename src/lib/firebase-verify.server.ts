// Vérifie un jeton Firebase (numéro confirmé par SMS) côté serveur.
import { createRemoteJWKSet, jwtVerify } from "jose";

const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

export async function verifyFirebasePhone(idToken: string): Promise<{ uid: string; phone: string }> {
  const projectId = process.env["FIREBASE_PROJECT_ID"] ?? process.env["VITE_FIREBASE_PROJECT_ID"] ?? import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error("Firebase non configuré");
  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });
  const phone = payload["phone_number"];
  if (typeof phone !== "string" || !payload.sub) throw new Error("Numéro non vérifié");
  return { uid: payload.sub, phone };
}
