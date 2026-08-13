'use client'

import { useState } from 'react'
import { MessageSquare, X, Send, Loader2 } from 'lucide-react'

export default function FeedbackButton() {
    const [isOpen, setIsOpen] = useState(false)
    const [feedback, setFeedback] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [isSent, setIsSent] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!feedback.trim()) return

        setIsSending(true)

        // Simulate API call (In Week 12+, we can connect this to a real database or email service)
        await new Promise(resolve => setTimeout(resolve, 1000))

        setIsSending(false)
        setIsSent(true)
        setFeedback('')

        // Auto-close after showing success
        setTimeout(() => {
            setIsSent(false)
            setIsOpen(false)
        }, 2500)
    }

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-full text-zinc-300 transition-all shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-500/50 z-50 flex items-center gap-2 group"
                title="Send Beta Feedback"
            >
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                <span className="max-w-0 overflow-hidden group-hover:max-w-[120px] transition-all duration-300 whitespace-nowrap text-sm font-medium text-zinc-300 group-hover:text-white">
                    Beta Feedback
                </span>
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">

                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-emerald-400" />
                                Beta Feedback
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Success State */}
                        {isSent ? (
                            <div className="text-center py-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="inline-flex p-3 rounded-full bg-emerald-500/10 mb-4">
                                    <Send className="w-6 h-6 text-emerald-400" />
                                </div>
                                <h4 className="text-xl font-bold mb-2">Thank you!</h4>
                                <p className="text-zinc-400 text-sm">Your feedback helps us build a better Fluenta.</p>
                            </div>
                        ) : (
                            /* Form State */
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <p className="text-sm text-zinc-400">
                                    Found a bug? Have a feature request? Let us know!
                                </p>
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Tell us what you think..."
                                    className="w-full p-3 bg-zinc-950 border border-zinc-700 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 text-white min-h-[120px] resize-none transition-all"
                                    autoFocus
                                />
                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsOpen(false)}
                                        className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!feedback.trim() || isSending}
                                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-emerald-900/20"
                                    >
                                        {isSending ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4" />
                                        )}
                                        Send Feedback
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}