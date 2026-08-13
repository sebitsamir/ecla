import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Fluenta',
  description: 'One curriculum. Four ways to learn.',
  // viewport object:
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1, // Prevents zooming on input focus
    userScalable: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-zinc-950 text-zinc-100">{children}</body>
      </html>
    </ClerkProvider>
  )
}
