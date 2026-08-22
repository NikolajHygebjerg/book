import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/layout/logo";
import { AuthScreen } from "@/components/auth/auth-screen";

export default async function HomePage() {
  const session = await auth();
  if (session) redirect("/book");

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-12">
      <Logo size="lg" href={null} priority className="mb-6" />
      <h1 className="text-2xl font-bold text-stone-900 text-center">Begejstring booking</h1>
      <p className="mt-2 max-w-md text-center text-stone-600">
        Officiel bookingapp til Begejstrings åbne keramikværksted i Rønde.
      </p>

      <section
        aria-labelledby="app-purpose-heading"
        className="mt-10 w-full max-w-lg rounded-2xl border border-stone-100 bg-stone-50 px-6 py-6 text-sm text-stone-700"
      >
        <h2 id="app-purpose-heading" className="text-base font-semibold text-stone-900">
          Om appen
        </h2>
        <p className="mt-3 leading-relaxed">
          Begejstring booking er værkstedets bookingsystem. Med appen kan medlemmer og gæster oprette
          konto, booke tid i keramikværkstedet og administrere egne bookinger og abonnement.
        </p>
        <p className="mt-3 leading-relaxed">
          Værkstedets administrator forbinder Google Kalender for at synkronisere kurser og
          begivenheder, så bookinger automatisk respekterer lukkede perioder, og bekræftede bookinger
          oprettes som kalenderbegivenheder. Almindelige brugere logger ind med e-mail og adgangskode
          — de forbinder ikke Google.
        </p>
        <p className="mt-3 leading-relaxed">
          Appen bruges af værkstedsgæster og abonnenter samt af Begejstrings administrator til
          kalenderstyring.
        </p>
      </section>

      <div className="mt-10 w-full max-w-sm">
        <h2 className="mb-4 text-center text-lg font-semibold text-stone-900">Log ind</h2>
        <AuthScreen />
      </div>
    </div>
  );
}
