import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { AuthProvider } from "@/components/providers/auth-provider";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "Begejstring booking — Åbent værksted",
  description:
    "Begejstring booking: Book tid i keramikværkstedet i Rønde. Medlemmer og gæster kan booke værkstedstid; administrator synkroniserer kurser via Google Kalender.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Begejstring booking",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7a72e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="da" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-white text-stone-900 antialiased">
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-stone-100 bg-white py-6 text-center text-sm text-stone-500">
            <p>Ravnen 5, 8410 Rønde</p>
            <p className="mt-2">
              <Link href="/privatlivspolitik" className="hover:text-stone-700 transition-colors">
                Privatlivspolitik
              </Link>
            </p>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
