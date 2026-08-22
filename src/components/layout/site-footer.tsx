"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppAboutSection } from "./app-about-section";

export function SiteFooter() {
  const pathname = usePathname();
  const showAbout = pathname !== "/";

  return (
    <footer className="border-t border-stone-100 bg-white py-10 text-center text-sm text-stone-500">
      <div className="mx-auto max-w-5xl px-4">
        {showAbout && <AppAboutSection compact />}
        <p className={showAbout ? "mt-8" : undefined}>Ravnen 5, 8410 Rønde</p>
        <p className="mt-2">
          <Link href="/privatlivspolitik" className="hover:text-stone-700 transition-colors">
            Privatlivspolitik
          </Link>
        </p>
      </div>
    </footer>
  );
}
