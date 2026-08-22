import Link from "next/link";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/layout/logo";
import { AppAboutSection } from "@/components/layout/app-about-section";
import { AuthScreen } from "@/components/auth/auth-screen";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-12">
      <Logo size="lg" href={null} priority className="mb-6" />
      <h1 className="text-2xl font-bold text-stone-900 text-center">Begejstring booking</h1>
      <p className="mt-2 max-w-md text-center text-stone-600">
        Officiel bookingapp til Begejstrings åbne keramikværksted i Rønde.
      </p>

      <div className="mt-10">
        <AppAboutSection />
      </div>

      {session ? (
        <div className="mt-10 w-full max-w-sm">
          <Link
            href="/book"
            className="block w-full rounded-xl bg-brand py-3 text-center font-medium text-white hover:bg-brand-dark transition-colors"
          >
            Gå til booking
          </Link>
        </div>
      ) : (
        <div className="mt-10 w-full max-w-sm">
          <h2 className="mb-4 text-center text-lg font-semibold text-stone-900">Log ind</h2>
          <AuthScreen />
        </div>
      )}
    </div>
  );
}
