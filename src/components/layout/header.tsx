import Link from "next/link";
import { auth } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";
import { Logo } from "./logo";

export async function Header() {
  const session = await auth();

  return (
    <header className="border-b border-stone-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Logo size="sm" priority />

        {session?.user && (
          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/book"
              className="rounded-full bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark transition-colors"
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
          </nav>
        )}
      </div>
    </header>
  );
}
