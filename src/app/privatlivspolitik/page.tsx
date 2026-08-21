import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privatlivspolitik — Begejstring",
  description:
    "Privatlivspolitik for Begejstrings bookingtjeneste og Google Kalender-integration.",
};

export default function PrivatlivspolitikPage() {
  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-stone-900">Privatlivspolitik</h1>
        <p className="mt-2 text-sm text-stone-500">Sidst opdateret: 21. august 2026</p>

        <div className="mt-8 space-y-8 text-stone-700">
          <section>
            <h2 className="text-lg font-semibold text-stone-900">Om tjenesten</h2>
            <p className="mt-2 leading-relaxed">
              Begejstring driver et åbent keramikværksted i Rønde. Via{" "}
              <Link href="https://book.begejstring.dk" className="text-brand hover:underline">
                book.begejstring.dk
              </Link>{" "}
              kan brugere oprette konto, booke tid i værkstedet og administrere egne bookinger.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">Hvilke data vi indsamler</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
              <li>Navn, e-mail og telefonnummer ved oprettelse af konto og booking</li>
              <li>Bookingoplysninger (dato, tid, antal personer og betaling)</li>
              <li>Tekniske logdata nødvendige for at drive tjenesten</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">Google Kalender-integration</h2>
            <p className="mt-2 leading-relaxed">
              Begejstring bruger Google Kalender til at synkronisere værkstedets kalender. Kun
              administratoren forbinder en Google-konto — almindelige brugere forbinder ikke Google.
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 leading-relaxed">
              <li>
                <strong className="font-medium text-stone-900">Læseadgang:</strong> Hentning af
                kursus- og begivenhedsdata fra Google Kalender, så bookinger kan blokere tid, når
                der er kurser i værkstedet
              </li>
              <li>
                <strong className="font-medium text-stone-900">Skriveadgang:</strong> Oprettelse af
                kalenderbegivenheder i Google Kalender, når bookinger bekræftes
              </li>
            </ul>
            <p className="mt-3 leading-relaxed">
              Google OAuth refresh token og tilknyttede kalenderoplysninger opbevares sikkert i vores
              database. Vi sælger, udlejer eller deler ikke Google-brugerdata med tredjeparter.
              Google-brugerdata bruges udelukkende til at drive bookingtjenesten som beskrevet
              ovenfor.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">Deling af data</h2>
            <p className="mt-2 leading-relaxed">
              Vi sælger ikke personlige data. Data deles kun med betalingsudbydere (Stripe) og
              hosting/database-udbydere, der er nødvendige for at drive tjenesten, og som er
              underlagt databehandleraftaler.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">Dine rettigheder</h2>
            <p className="mt-2 leading-relaxed">
              Du kan til enhver tid anmode om indsigt i, rettelse af eller sletning af dine
              personoplysninger. Kontakt os via e-mail nedenfor.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stone-900">Kontakt</h2>
            <p className="mt-2 leading-relaxed">
              Begejstring
              <br />
              Ravnen 5, 8410 Rønde
              <br />
              E-mail:{" "}
              <a href="mailto:nikolaj@idevaerket.dk" className="text-brand hover:underline">
                nikolaj@idevaerket.dk
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
