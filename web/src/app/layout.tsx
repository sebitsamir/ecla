import type { Metadata } from "next";
import { Instrument_Serif, Geist } from 'next/font/google';
import { ClerkProvider } from "@clerk/nextjs";
import { PostHogProvider } from '@/components/PostHogProvider';
import FeedbackButton from '@/components/FeedbackButton'; // <--- ADD THIS
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'
import { ThemeProvider } from '@/components/ThemeProvider'
import "./globals.css";

const instrumentSerif = Instrument_Serif({ subsets: ['latin'], variable: '--font-ecla-display', weight: ['400'], display: 'swap' })
const geist = Geist({ subsets: ['latin'], variable: '--font-ecla-body', display: 'swap' })

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}
export const metadata: Metadata = {
  title: 'ECLA',
  description: 'A more human way to learn languages.',
  icons: [{ url: '/brand/ecla-app-icon.png', type: 'image/png', sizes: '512x512' }],
  manifest: '/manifest.webmanifest',
};

const themeBootScript = `(function(){try{var p=localStorage.getItem('ecla-theme');if(p!=='light'&&p!=='dark'&&p!=='system')p='system';var t=p==='system'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):p;document.documentElement.dataset.theme=t;document.documentElement.dataset.themePreference=p;document.documentElement.style.colorScheme=t}catch(e){document.documentElement.dataset.theme='dark'}})()`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#08111a" />
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className={`${instrumentSerif.variable} ${geist.variable}`}>
        <ThemeProvider>
          <ClerkProvider dynamic>
            <PostHogProvider>
              {children}
              <FeedbackButton />
              <ServiceWorkerRegistration />
            </PostHogProvider>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
