import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { PostHogProvider } from '@/components/PostHogProvider';
import FeedbackButton from '@/components/FeedbackButton'; // <--- ADD THIS
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'ecla',
  description: 'One curriculum. Four ways to learn.',
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
        <body className={inter.className}>
          <PostHogProvider>
            {children}
            <FeedbackButton />
          </PostHogProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}