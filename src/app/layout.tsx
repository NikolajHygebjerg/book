import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { AuthProvider } from "@/components/providers/auth-provider";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "Begejstring — Åbent værksted",
  description: "Book tid i keramikværkstedet. 10 pladser, døgnet rundt.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Begejstring",
  },
};

export const viewport: Viewport = {
  themeColor: "#b45309",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="da" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900 antialiased">
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-stone-200 bg-white py-8 text-center text-sm text-stone-500">
            <p>Værkstedet for kreativ begejstring · Ravnen 5, 8410 Rønde</p>
            <p className="mt-1">
              <a href="mailto:laila@begejstring.dk" className="hover:text-stone-700">
                laila@begejstring.dk
              </a>
            </p>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
