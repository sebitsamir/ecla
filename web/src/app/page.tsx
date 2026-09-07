import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import LandingPage from '@/components/landing/LandingPage'

export const metadata: Metadata = {
  title: 'ECLA — Language learning built for real fluency',
  description:
    'A curriculum-driven language learning platform built around real-world practice, adaptive review, measurable progress, and lasting ability.',
}

export default async function HomePage() {
  const { userId } = await auth()

  if (userId) {
    redirect('/dashboard')
  }

  return <LandingPage />
}
