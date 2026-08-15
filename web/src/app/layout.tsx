import type { Metadata } from "next";
import { Baloo_2, Nunito } from 'next/font/google';
import { ClerkProvider } from "@clerk/nextjs";
import { PostHogProvider } from '@/components/PostHogProvider';
import FeedbackButton from '@/components/FeedbackButton'; // <--- ADD THIS
import "./globals.css";

const baloo = Baloo_2({ subsets: ['latin'], variable: '--font-display', weight: ['600', '700', '800'] })
const nunito = Nunito({ subsets: ['latin'], variable: '--font-body', weight: ['400', '600', '700', '800'] })

export const metadata: Metadata = {
  title: 'Ecla',
  description: 'One curriculum. Four ways to learn.',
  icons: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${baloo.variable} ${nunito.variable}`}>
          <PostHogProvider>
            {children}
            <FeedbackButton />
          </PostHogProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}