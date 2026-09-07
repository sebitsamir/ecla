import type { Metadata } from "next";
import { Instrument_Serif, Geist } from 'next/font/google';
import { ClerkProvider } from "@clerk/nextjs";
import { PostHogProvider } from '@/components/PostHogProvider';
import FeedbackButton from '@/components/FeedbackButton'; // <--- ADD THIS
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
import "./globals.css";

const instrumentserif = Instrument_Serif({ subsets: ['latin'], variable: '--font-ecla-display', weight: ['400'] })
const geist = Geist({ subsets: ['latin'], variable: '--font-ecla-body', display: 'swap' })

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}
export const metadata: Metadata = {
  title: 'Ecla',
  description: 'One curriculum. Four ways to learn.',
  icons: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${instrumentserif.variable} ${geist.variable}`}>
        <ClerkProvider dynamic>
          <PostHogProvider>
            {children}
            <FeedbackButton />
            <ServiceWorkerRegistration />
          </PostHogProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
