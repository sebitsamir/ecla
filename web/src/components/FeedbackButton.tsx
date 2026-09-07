'use client'

import { useState, type ChangeEvent, type FormEvent, type MouseEvent } from 'react'
import { usePathname } from 'next/navigation'
import { AlertTriangle, MessageCircle, MessageSquare, Send, X, Zap } from 'lucide-react'
import posthog from 'posthog-js'

export default function FeedbackButton() {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)
    const [type, setType] = useState<'bug' | 'feature' | 'general'>('general')
    const [message, setMessage] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [isSent, setIsSent] = useState(false)

    // Keep the public marketing page visually clean. Feedback remains available
    // everywhere inside the signed-in product where it is contextually useful.
    if (pathname === '/') return null

    const position = pathname === '/chat'
        ? 'bottom-24 right-4 lg:bottom-6 lg:right-6'
        : 'bottom-4 right-4 sm:bottom-6 sm:right-6'

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!message.trim() || isSending) return

        setIsSending(true)

        posthog.capture('feedback_submitted', {
            feedback_type: type,
            message: message,
            current_url: window.location.href,
            user_agent: navigator.userAgent,
        })

        await new Promise(resolve => setTimeout(resolve, 600))

        setIsSending(false)
        setIsSent(true)
        setMessage('')

        setTimeout(() => {
            setIsSent(false)
            setIsOpen(false)
        }, 2000)
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed ${position} z-40 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-night-800/80 text-cream/60 opacity-80 backdrop-blur-sm shadow-glow-sm transition-all duration-200 hover:opacity-100 hover:text-cream hover:border-glow/40 active:scale-95`}
                title="Send feedback"
                aria-label="Send feedback"
            >
                <MessageSquare className="h-5 w-5" />
            </button>

            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="w-full max-w-md overflow-hidden rounded-t-3xl border border-white/10 bg-night-800 shadow-glow-md sm:rounded-card"
                        onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-white/5 p-5">
                            <h3 className="font-display text-lg font-bold text-cream">Send Feedback</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="rounded-lg p-1.5 text-cream/50 transition-colors hover:bg-night-700 hover:text-cream"
                                aria-label="Close feedback"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5 p-5">
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'bug', label: 'Bug', icon: AlertTriangle },
                                    { id: 'feature', label: 'Feature', icon: Zap },
                                    { id: 'general', label: 'General', icon: MessageCircle }
                                ].map((t) => {
                                    const Icon = t.icon
                                    const isActive = type === t.id
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => setType(t.id as 'bug' | 'feature' | 'general')}
                                            className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all ${isActive
                                                ? 'border-glow/50 bg-glow/10 text-glow'
                                                : 'border-white/10 bg-night-900/50 text-cream/50 hover:border-white/25 hover:text-cream/70'
                                                }`}
                                        >
                                            <Icon className="h-5 w-5" />
                                            <span className="text-xs font-semibold">{t.label}</span>
                                        </button>
                                    )
                                })}
                            </div>

                            <div>
                                <textarea
                                    value={message}
                                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                                    placeholder={
                                        type === 'bug'
                                            ? 'Describe what went wrong...'
                                            : type === 'feature'
                                                ? 'What would you like to see?'
                                                : "Tell us what's on your mind..."
                                    }
                                    className="min-h-[120px] w-full resize-none rounded-xl border border-white/10 bg-night-900/60 p-4 text-sm text-cream transition-all placeholder:text-cream/30 focus:border-glow focus:outline-none focus:ring-1 focus:ring-glow/30"
                                    autoFocus
                                />
                            </div>

                            {isSent ? (
                                <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-leaf/20 bg-leaf/10 py-3.5 text-center font-semibold text-leaf">
                                    Sent successfully!
                                </div>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={!message.trim() || isSending}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-glow py-3.5 font-bold text-night-900 transition-all hover:bg-glow-bright active:scale-[0.98] disabled:bg-night-900/60 disabled:text-cream/30"
                                >
                                    {isSending ? 'Sending...' : 'Send Feedback'}
                                    {!isSending && <Send className="h-4 w-4" />}
                                </button>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
