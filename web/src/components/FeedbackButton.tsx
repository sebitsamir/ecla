'use client'

import { useState } from 'react'
import { MessageSquare, X, Send, Bug, Lightbulb, Smile } from 'lucide-react'
import posthog from 'posthog-js'

export default function FeedbackButton() {
    const [isOpen, setIsOpen] = useState(false)
    const [type, setType] = useState<'bug' | 'feature' | 'general'>('general')
    const [message, setMessage] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [isSent, setIsSent] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!message.trim() || isSending) return

        setIsSending(true)

        // Capture feedback directly in PostHog with rich context
        posthog.capture('feedback_submitted', {
            feedback_type: type,
            message: message,
            current_url: window.location.href,
            user_agent: navigator.userAgent,
        })

        // Simulate a tiny delay for UX satisfaction
        await new Promise(resolve => setTimeout(resolve, 600))

        setIsSending(false)
        setIsSent(true)
        setMessage('')

        // Reset modal after 2 seconds
        setTimeout(() => {
            setIsSent(false)
            setIsOpen(false)
        }, 2000)
    }

    return (
        <>
            {/* Floating Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 shadow-lg transition-all duration-200 active:scale-95"
            >
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm font-semibold">Feedback</span>
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
                            <h3 className="text-lg font-bold text-white">Send Feedback</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-900 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
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
                                                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                                                    : 'border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:border-zinc-700'
                                                }`}
                                        >
                                            <Icon className="w-5 h-5" />
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
                                    placeholder={type === 'bug' ? "Describe what went wrong..." : type === 'feature' ? "What would you like to see?" : "Tell us what's on your mind..."}
                                    className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all min-h-[120px] resize-none text-sm"
                                    autoFocus
                                />
                            </div>

                            {/* Submit Button */}
                            {isSent ? (
                                <div className="w-full py-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-center flex items-center justify-center gap-2">
                                    Sent successfully!
                                </div>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={!message.trim() || isSending}
                                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                >
                                    {isSending ? 'Sending...' : 'Send Feedback'}
                                    {!isSending && <Send className="w-4 h-4" />}
                                </button>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}