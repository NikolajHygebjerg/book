import Link from "next/link";
import { auth } from "@/lib/auth";
import { PRICING, formatDKK } from "@/lib/config";

export default async function HomePage() {
  const session = await auth();

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-amber-50 to-stone-50 py-20 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-5xl mb-4 block">🏺</span>
          <h1 className="text-4xl font-bold text-stone-900 sm:text-5xl">
            Åbent værksted
          </h1>
          <p className="mt-4 text-lg text-stone-600 max-w-xl mx-auto">
            Book tid i vores keramikværksted. 10 pladser, døgnet rundt — kom og vær kreativ
            når det passer dig.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            {session ? (
              <Link
                href="/book"
                className="rounded-full bg-amber-700 px-8 py-3 font-medium text-white hover:bg-amber-800 transition-colors"
              >
                Book tid nu
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="rounded-full bg-amber-700 px-8 py-3 font-medium text-white hover:bg-amber-800 transition-colors"
                >
                  Opret bruger & book
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-stone-300 px-8 py-3 font-medium text-stone-700 hover:bg-white transition-colors"
                >
                  Log ind
                </Link>
              </>
            )}
          </div>
          <p className="mt-4 text-sm text-stone-500">
            Fra {formatDKK(PRICING.hourlyRateOre)}/time · Max 10 personer ad gangen
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-4xl grid gap-8 sm:grid-cols-3">
          {[
            {
              icon: "🕐",
              title: "Døgnet rundt",
              desc: "Book 1–24 timer når det passer dig, alle ugens dage.",
            },
            {
              icon: "👥",
              title: "Se belægning",
              desc: "Se hvor mange der er i værkstedet, inden du booker.",
            },
            {
              icon: "🔄",
              title: "Drejeskive",
              desc: `Tilvalg drejeskive for ${formatDKK(PRICING.potteryWheelPerHourOre)}/time ekstra.`,
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="text-center">
              <span className="text-3xl">{icon}</span>
              <h3 className="mt-3 font-semibold text-stone-900">{title}</h3>
              <p className="mt-1 text-sm text-stone-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Abonnementer */}
      <section className="py-16 px-4 bg-white border-y border-stone-200">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-stone-900">Abonnementer</h2>
          <p className="mt-2 text-stone-500">Kom oftere og spar penge med et månedligt abonnement.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {Object.entries(PRICING.subscriptions).map(([key, plan]) => (
              <div key={key} className="rounded-2xl border border-stone-200 p-6">
                <h3 className="font-semibold text-stone-900">{plan.name}</h3>
                <p className="text-2xl font-bold text-stone-900 mt-2">
                  {formatDKK(plan.monthlyPriceOre)}<span className="text-sm font-normal text-stone-500">/md</span>
                </p>
                <p className="text-sm text-stone-500 mt-2">{plan.description}</p>
              </div>
            ))}
          </div>
          <Link
            href={session ? "/min-side/abonnement" : "/register"}
            className="mt-8 inline-block rounded-full bg-amber-700 px-8 py-3 font-medium text-white hover:bg-amber-800 transition-colors"
          >
            Se abonnementer
          </Link>
        </div>
      </section>
    </div>
  );
}
