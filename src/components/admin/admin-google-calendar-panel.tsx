"use client";

import { useCallback, useEffect, useState } from "react";
import { Calendar, Link2, Unlink } from "lucide-react";

type GoogleCalendarStatus = {
  oauthConfigured: boolean;
  connected: boolean;
  calendarId: string | null;
  calendarSummary: string | null;
  syncBookingsEnabled: boolean;
  connectedByEmail: string | null;
  updatedAt: string | null;
};

const STATUS_MESSAGES: Record<string, string> = {
  connected: "Google Kalender er forbundet.",
  denied: "Forbindelse afvist — log ind som admin.",
  error: "Google returnerede en fejl.",
  missing: "Manglende parametre fra Google.",
  state: "Ugyldig sikkerhedstoken — prøv igen.",
  no_refresh: "Ingen refresh token — afbryd adgang i Google og forbind igen.",
  no_calendar: "Ingen kalender fundet på Google-kontoen.",
  failed: "Kunne ikke fuldføre forbindelsen.",
};

type AdminGoogleCalendarPanelProps = {
  initialMessage?: string | null;
};

export function AdminGoogleCalendarPanel({ initialMessage }: AdminGoogleCalendarPanelProps) {
  const [status, setStatus] = useState<GoogleCalendarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(initialMessage ?? "");
  const [error, setError] = useState("");

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/google-calendar");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Kunne ikke hente status");
        return;
      }
      setStatus(data);
    } catch {
      setError("Kunne ikke hente status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleConnect = () => {
    window.location.href = "/api/admin/google-calendar/auth";
  };

  const handleDisconnect = async () => {
    if (!confirm("Afbryd Google Kalender? Eksisterende begivenheder i Google påvirkes ikke.")) {
      return;
    }
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/google-calendar", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Kunne ikke afbryde");
        return;
      }
      setMessage("Google Kalender er afbrudt.");
      await loadStatus();
    } finally {
      setActionLoading(false);
    }
  };

  const handleSyncToggle = async (enabled: boolean) => {
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/google-calendar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncBookingsEnabled: enabled }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Kunne ikke gemme");
        return;
      }
      await loadStatus();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <Calendar className="h-5 w-5 text-brand mt-0.5" />
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Google Kalender</h2>
          <p className="text-sm text-stone-500 mt-1">
            Forbind værkstedskalenderen med Google Kalender. Kurser du opretter i Google blokerer
            alle 10 pladser i det tidsrum. Bekræftede bookinger kan synkroniseres tilbage til
            Google.
          </p>
        </div>
      </div>

      {message && (
        <p className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">{message}</p>
      )}
      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-stone-500">Henter status…</p>
      ) : status ? (
        <div className="space-y-4">
          {!status.oauthConfigured && (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Sæt <code className="rounded bg-white px-1">GOOGLE_CLIENT_ID</code> og{" "}
              <code className="rounded bg-white px-1">GOOGLE_CLIENT_SECRET</code> i miljøvariabler,
              og tilføj redirect URI:{" "}
              <code className="rounded bg-white px-1 break-all">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/api/admin/google-calendar/callback`
                  : "/api/admin/google-calendar/callback"}
              </code>
            </p>
          )}

          {status.connected ? (
            <>
              <div className="rounded-xl bg-stone-50 px-4 py-3 text-sm space-y-1">
                <p>
                  <span className="text-stone-500">Kalender:</span>{" "}
                  <span className="font-medium text-stone-900">
                    {status.calendarSummary ?? status.calendarId}
                  </span>
                </p>
                <p>
                  <span className="text-stone-500">Forbundet af:</span>{" "}
                  {status.connectedByEmail}
                </p>
              </div>

              <label className="flex items-center gap-3 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={status.syncBookingsEnabled}
                  disabled={actionLoading}
                  onChange={(e) => handleSyncToggle(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 text-brand focus:ring-brand"
                />
                Synkronisér bekræftede bookinger til Google Kalender
              </label>

              <button
                type="button"
                onClick={handleDisconnect}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-50"
              >
                <Unlink className="h-4 w-4" />
                Afbryd forbindelse
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleConnect}
              disabled={!status.oauthConfigured || actionLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
            >
              <Link2 className="h-4 w-4" />
              Forbind Google Kalender
            </button>
          )}
        </div>
      ) : null}
    </section>
  );
}

export function googleCalendarStatusMessage(code: string | null | undefined): string | null {
  if (!code) return null;
  return STATUS_MESSAGES[code] ?? null;
}
