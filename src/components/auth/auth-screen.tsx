"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type Mode = "login" | "register";

export function AuthScreen({ initialMode = "login" }: { initialMode?: Mode }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (mode === "register") {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Noget gik galt");
        setLoading(false);
        return;
      }
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(mode === "login" ? "Forkert email eller adgangskode" : "Kunne ikke logge ind efter oprettelse");
      setLoading(false);
      return;
    }

    router.push("/book");
    router.refresh();
  };

  return (
    <div className="w-full max-w-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" && (
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Navn</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-light"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-light"
          />
        </div>

        {mode === "register" && (
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Telefon <span className="text-stone-400">(valgfrit)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-light"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Adgangskode</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === "register" ? 6 : undefined}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-light"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-50 transition-colors"
        >
          {loading
            ? mode === "login"
              ? "Logger ind..."
              : "Opretter..."
            : mode === "login"
              ? "Log ind"
              : "Opret bruger"}
        </button>
      </form>

      {mode === "login" ? (
        <button
          type="button"
          onClick={() => switchMode("register")}
          className="mt-6 w-full text-center text-sm text-brand hover:underline"
        >
          Opret bruger
        </button>
      ) : (
        <button
          type="button"
          onClick={() => switchMode("login")}
          className="mt-6 w-full text-center text-sm text-brand hover:underline"
        >
          Log ind
        </button>
      )}
    </div>
  );
}
