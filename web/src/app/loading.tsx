export default function Loading() {
    return (
        <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-4 bg-night-950 font-body">
            <div className="relative h-16 w-16">
                <span className="absolute inset-0 rounded-full bg-glow/15 animate-ping" />
                <span className="absolute inset-2 rounded-full bg-glow/40 blur-[2px]" />
                <span className="absolute inset-4 rounded-full bg-glow shadow-[0_0_28px_rgba(255,200,87,0.8)]" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cream/40">Ecla</p>
        </div>
    )
}