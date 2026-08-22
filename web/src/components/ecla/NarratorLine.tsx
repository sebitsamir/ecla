'use client'

/** NarratorLine — quiet stage directions ("The café door opens."). */
export default function NarratorLine({ text }: { text: string }) {
    return <p className="text-center text-sm text-cream/50 italic py-1">{text}</p>
}