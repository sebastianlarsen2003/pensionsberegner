import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Figtree } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import CookieConsent from "./components/CookieConsent"
import "./globals.css"


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#4fb7e7",
}

export const metadata: Metadata = {
  title: "Pensionsberegner | RådgiverXperten",
  description:
    "Få et hurtigt og vejledende estimat af, hvordan din pensionsopsparing kan udvikle sig frem mod pension.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="da">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${figtree.variable} antialiased`}
      >
{children}
        <Analytics />
        <CookieConsent />
      </body>
    </html>
  )
}