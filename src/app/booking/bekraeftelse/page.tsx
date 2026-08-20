import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string; session_id?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
      <h1 className="mt-6 text-2xl font-bold text-stone-900">Booking bekræftet!</h1>
      <p className="mt-2 text-stone-500">
        Din booking er godkendt. Vi glæder os til at se dig i værkstedet.
      </p>
      {params.booking && (
        <p className="mt-4 text-xs text-stone-400">Booking ID: {params.booking}</p>
      )}
      <div className="mt-8 flex flex-col gap-3">
        <Link
          href="/min-side"
          className="rounded-xl bg-brand px-6 py-3 font-medium text-white hover:bg-brand-dark transition-colors"
        >
          Se mine bookinger
        </Link>
        <Link
          href="/book"
          className="rounded-xl border border-stone-200 px-6 py-3 text-stone-700 hover:bg-stone-50 transition-colors"
        >
          Book igen
        </Link>
      </div>
    </div>
  );
}
