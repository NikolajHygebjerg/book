import Link from "next/link";
import { User } from "lucide-react";
import { auth } from "@/lib/auth";
import { Logo } from "./logo";

export async function Header() {
  const session = await auth();

  return (
    <header className="border-b border-stone-100 bg-white sticky top-0 z-50">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Logo size="sm" priority />

        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/abonnement"
            className="text-stone-600 hover:text-stone-900 transition-colors font-medium"
          >
            Abonnement
          </Link>
          {session?.user && (
            <Link
              href="/min-side"
              aria-label="Min side"
              className="flex h-9 w-9 items-center justify-center rounded-full text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors"
            >
              <User className="h-5 w-5" strokeWidth={1.75} />
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
