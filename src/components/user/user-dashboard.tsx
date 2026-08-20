"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { format } from "date-fns";
import { da } from "date-fns/locale";
import { formatDKK } from "@/lib/config";

type UserData = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  bookings: Array<{
    id: string;
    startTime: string;
    endTime: string;
    hours: number;
    persons: number;
    hasPotteryWheel: boolean;
    totalPriceOre: number;
  }>;
};

export function UserDashboard({ initialUser }: { initialUser: UserData }) {
  const [user, setUser] = useState(initialUser);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });

    if (res.ok) {
      const data = await res.json();
      setUser((u) => ({ ...u, ...data.user }));
      setMessage("Profil opdateret");
    } else {
      setMessage("Kunne ikke gemme ændringer");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    const res = await fetch("/api/user", { method: "DELETE" });
    if (res.ok) {
      await signOut({ callbackUrl: "/" });
    }
  };

  const totalHours = user.bookings.reduce((sum, b) => sum + b.hours, 0);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Min profil</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Navn</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-stone-200 px-4 py-3 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full rounded-xl border border-stone-100 bg-stone-50 px-4 py-3 text-stone-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Telefon</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-stone-200 px-4 py-3 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-amber-700 px-6 py-2 font-medium text-white hover:bg-amber-800 disabled:opacity-50 transition-colors"
          >
            {saving ? "Gemmer..." : "Gem ændringer"}
          </button>
          {message && (
            <p className="text-sm text-green-700">{message}</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-stone-900">Mine bookinger</h2>
          <span className="text-sm text-stone-500">{totalHours} timer i alt</span>
        </div>
        {user.bookings.length === 0 ? (
          <p className="text-stone-500 text-sm">Du har ingen bookinger endnu.</p>
        ) : (
          <div className="space-y-3">
            {user.bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between rounded-xl bg-stone-50 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-stone-900">
                    {format(new Date(booking.startTime), "d. MMM yyyy 'kl.' HH:mm", {
                      locale: da,
                    })}
                  </p>
                  <p className="text-stone-500">
                    {booking.hours} timer · {booking.persons} person(er)
                    {booking.hasPotteryWheel && " · Drejeskive"}
                  </p>
                </div>
                {booking.totalPriceOre > 0 && (
                  <span className="text-stone-600">{formatDKK(booking.totalPriceOre)}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-red-100 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-900 mb-2">Slet konto</h2>
        <p className="text-sm text-red-700 mb-4">
          Dette sletter permanent din konto og alle dine data. Handlingen kan ikke fortrydes.
        </p>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-xl border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-100 transition-colors"
          >
            Slet min konto
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 transition-colors"
            >
              Ja, slet min konto
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="rounded-xl px-4 py-2 text-sm text-stone-600 hover:bg-white transition-colors"
            >
              Annuller
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
