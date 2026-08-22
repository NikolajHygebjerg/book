import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { SiteFooter } from "@/components/layout/site-footer";
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
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
