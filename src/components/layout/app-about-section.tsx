export function AppAboutSection({ compact = false }: { compact?: boolean }) {
  return (
    <section
      id="om-appen"
      aria-labelledby="app-purpose-heading"
      className={
        compact
          ? "mx-auto max-w-lg text-left text-sm text-stone-600"
          : "w-full max-w-lg rounded-2xl border border-stone-100 bg-stone-50 px-6 py-6 text-sm text-stone-700"
      }
    >
      <h2 id="app-purpose-heading" className="text-base font-semibold text-stone-900">
        Om appen
      </h2>
      <p className="mt-3 leading-relaxed">
        <strong className="font-semibold text-stone-900">Begejstring booking</strong> er
        værkstedets bookingsystem. Med appen kan medlemmer og gæster oprette konto, booke tid i
        keramikværkstedet og administrere egne bookinger og abonnement.
      </p>
      <p className="mt-3 leading-relaxed">
        Værkstedets administrator forbinder Google Kalender for at synkronisere kurser og
        begivenheder, så bookinger automatisk respekterer lukkede perioder, og bekræftede bookinger
        oprettes som kalenderbegivenheder. Almindelige brugere logger ind med e-mail og
        adgangskode — de forbinder ikke Google.
      </p>
      <p className="mt-3 leading-relaxed">
        Appen bruges af værkstedsgæster og abonnenter samt af Begejstrings administrator til
        kalenderstyring.
      </p>
    </section>
  );
}
