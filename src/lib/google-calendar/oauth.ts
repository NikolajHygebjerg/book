import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

export function getGoogleOAuthRedirectUri(): string {
  const base = process.env.NEXTAUTH_URL;
  if (!base) {
    throw new Error("NEXTAUTH_URL mangler");
  }
  return `${base}/api/admin/google-calendar/callback`;
}

export function createGoogleOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID og GOOGLE_CLIENT_SECRET skal være sat");
  }

  return new google.auth.OAuth2(clientId, clientSecret, getGoogleOAuthRedirectUri());
}

export function getGoogleOAuthConsentUrl(state: string): string {
  const client = createGoogleOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state,
  });
}

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}
