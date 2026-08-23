'use client'

/**
 * NarratorLine — Cinematic stage directions.
 * Styled like elegant script directions to set the mood without distracting.
 */
export default function NarratorLine({ text }: { text: string }) {
    return (
        <div className="flex items-center justify-center py-4 animate-fade-in">
            <div className="relative max-w-md text-center">
                <p className="text-[13px] text-cream/40 italic font-serif tracking-wide leading-relaxed">
                    {text}
                </p>
            </div>
        </div>
    )
}