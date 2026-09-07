'use client'

import { SignInButton, SignUpButton } from '@clerk/nextjs'
import { ArrowRight } from 'lucide-react'

type Props = {
  compact?: boolean
  mobile?: boolean
  primaryOnly?: boolean
}

export default function LandingAuthActions({ compact = false, mobile = false, primaryOnly = false }: Props) {
  if (mobile) {
    return (
      <div className="grid gap-2 border-t border-white/[0.07] pt-4">
        <SignInButton mode="modal">
          <button className="min-h-11 rounded-xl border border-white/[0.1] px-4 text-sm font-bold text-cream/75 transition-colors hover:border-white/20 hover:bg-white/[0.03] hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow/70">
            Sign in
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-glow px-4 text-sm font-extrabold text-night-950 transition hover:bg-glow-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow-bright focus-visible:ring-offset-2 focus-visible:ring-offset-night-950">
            Start learning
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </SignUpButton>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {!primaryOnly ? (
        <SignInButton mode="modal">
          <button className={`${compact ? 'px-3 py-2 text-sm' : 'px-4 py-2.5 text-sm'} font-bold text-cream/[65%] transition-colors hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow/70 focus-visible:ring-offset-2 focus-visible:ring-offset-night-950`}>
            Sign in
          </button>
        </SignInButton>
      ) : null}
      <SignUpButton mode="modal">
        <button className={`${compact ? 'px-4 py-2 text-sm' : 'px-5 py-2.5 text-sm'} inline-flex items-center gap-2 rounded-xl bg-glow font-extrabold text-night-950 transition hover:bg-glow-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow-bright focus-visible:ring-offset-2 focus-visible:ring-offset-night-950`}>
          Start learning
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </SignUpButton>
    </div>
  )
}
