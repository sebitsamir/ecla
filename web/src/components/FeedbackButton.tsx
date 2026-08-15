'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { MessageSquare, X, Send, Bug, Lightbulb, Smile } from 'lucide-react'
import posthog from 'posthog-js'

export default function FeedbackButton() {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)
    const [type, setType] = useState<'bug' | 'feature' | 'general'>('general')
    const [message, setMessage] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [isSent, setIsSent] = useState(false)

    const position = pathname === '/chat'
        ? 'bottom-24 right-4 lg:bottom-6 lg:right-6'
        : 'bottom-4 right-4 sm:bottom-6 sm:right-6'

    const handleSubmit = async (e: React.FormEvent) => {
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
            {/* Floating Trigger — icon only, unobtrusive, context-aware position */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed ${position} z-40 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-night-800/80 text-cream/60 opacity-80 backdrop-blur-sm shadow-glow-sm transition-all duration-200 hover:opacity-100 hover:text-cream hover:border-glow/40 active:scale-95`}
                title="Send feedback"
                aria-label="Send feedback"
            >
                <MessageSquare className="h-5 w-5" />
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="w-full max-w-md rounded-t-3xl border border-white/10 bg-night-800 shadow-glow-md sm:rounded-card overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-white/5">
                            <h3 className="font-display text-lg font-bold text-cream">Send Feedback</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="rounded-lg p-1.5 text-cream/50 hover:bg-night-700 hover:text-cream transition-colors"
                                aria-label="Close feedback"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="p-5 space-y-5">
                            {/* Feedback Type Selector */}
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'bug', label: 'Bug', icon: Bug },
                                    { id: 'feature', label: 'Feature', icon: Lightbulb },
                                    { id: 'general', label: 'General', icon: Smile }
                                ].map((t) => {
                                    const Icon = t.icon
                                    const isActive = type === t.id
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => setType(t.id as any)}
                                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${isActive
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

                            {/* Message Textarea */}
                            <div>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder={
                                        type === 'bug'
                                            ? "Describe what went wrong..."
                                            : type === 'feature'
                                                ? "What would you like to see?"
                                                : "Tell us what's on your mind..."
                                    }
                                    className="w-full p-4 rounded-xl bg-night-900/60 border border-white/10 text-cream placeholder:text-cream/30 focus:outline-none focus:border-glow focus:ring-1 focus:ring-glow/30 transition-all min-h-[120px] resize-none text-sm"
                                    autoFocus
                                />
                            </div>

                            {/* Submit Button */}
                            {isSent ? (
                                <div className="w-full py-3.5 rounded-xl bg-leaf/10 border border-leaf/20 text-leaf font-semibold text-center flex items-center justify-center gap-2">
                                    Sent successfully!
                                </div>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={!message.trim() || isSending}
                                    className="w-full py-3.5 rounded-xl bg-glow hover:bg-glow-bright disabled:bg-night-900/60 disabled:text-cream/30 text-night-900 font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                >
                                    {isSending ? 'Sending...' : 'Send Feedback'}
                                    {!isSending && <Send className="h-4 h-4" />}
                                </button>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}