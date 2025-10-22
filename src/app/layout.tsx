import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from '@/components/ui/sonner'
import { RecaptchaProvider } from '@/components/providers/recaptcha-provider'
import { CookieConsentProvider } from '@/contexts/cookie-consent-context'
import { CookieBanner } from '@/components/cookie-banner'
import { CookieSettingsDialog } from '@/components/cookie-settings-dialog'
import { AuthErrorBoundary } from '@/components/auth/auth-error-boundary'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "barntrack - Moderne Futtermittelverwaltung für Landwirtschaft",
    template: "%s | barntrack",
  },
  description: "Verwalten Sie Ihre Futterdaten, berechnen Sie Kosten automatisch und behalten Sie den Überblick über alle Ihre Ställe. Nahtlose Integration mit GEA, Lely, DeLaval und weiteren Systemen.",
  keywords: [
    "Futtermittelverwaltung",
    "Futterkosten",
    "Landwirtschaft",
    "GEA Integration",
    "Fütterungssystem",
    "Kostenanalyse",
    "Farm Management",
    "Viehwirtschaft",
    "Agrar-Software",
  ],
  authors: [{ name: "barntrack" }],
  creator: "barntrack",
  publisher: "barntrack",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "/",
    title: "barntrack - Moderne Futtermittelverwaltung",
    description: "Verwalten Sie Ihre Futterdaten, berechnen Sie Kosten automatisch und behalten Sie den Überblick über alle Ihre Ställe.",
    siteName: "barntrack",
  },
  twitter: {
    card: "summary_large_image",
    title: "barntrack - Moderne Futtermittelverwaltung",
    description: "Verwalten Sie Ihre Futterdaten, berechnen Sie Kosten automatisch und behalten Sie den Überblick über alle Ihre Ställe.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthErrorBoundary>
          <CookieConsentProvider>
            <RecaptchaProvider>
              {children}
              <Toaster />
              <CookieBanner />
              <CookieSettingsDialog />
            </RecaptchaProvider>
          </CookieConsentProvider>
        </AuthErrorBoundary>
      </body>
    </html>
  );
}
