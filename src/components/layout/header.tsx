import Link from "next/link";
import { auth } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";

export async function Header() {
  const session = await auth();

  return (
    <header className="border-b border-stone-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🏺</span>
          <div>
            <p className="font-semibold text-stone-900 leading-tight">Begejstring</p>
            <p className="text-xs text-stone-500">Åbent værksted</p>
          </div>
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          {session?.user ? (
            <>
              <Link
                href="/book"
                className="rounded-full bg-amber-700 px-4 py-2 font-medium text-white hover:bg-amber-800 transition-colors"
              >
                Book tid
              </Link>
              <Link
                href="/min-side"
                className="text-stone-600 hover:text-stone-900 transition-colors"
              >
                Min side
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-stone-600 hover:text-stone-900 transition-colors"
              >
                Log ind
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-amber-700 px-4 py-2 font-medium text-white hover:bg-amber-800 transition-colors"
              >
                Opret bruger
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
