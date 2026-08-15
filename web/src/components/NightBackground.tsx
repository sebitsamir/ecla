'use client'

const STARS = [
    { top: '6%', left: '12%', s: 2, d: '0s' }, { top: '14%', left: '78%', s: 3, d: '.7s' },
    { top: '22%', left: '34%', s: 2, d: '1.4s' }, { top: '9%', left: '55%', s: 2, d: '2.1s' },
    { top: '31%', left: '88%', s: 2, d: '.4s' }, { top: '42%', left: '8%', s: 3, d: '1.8s' },
    { top: '55%', left: '70%', s: 2, d: '.9s' }, { top: '63%', left: '24%', s: 2, d: '2.6s' },
    { top: '71%', left: '52%', s: 3, d: '1.1s' }, { top: '80%', left: '84%', s: 2, d: '.2s' },
    { top: '86%', left: '16%', s: 2, d: '1.9s' }, { top: '48%', left: '44%', s: 2, d: '3s' },
]

const FLIES = [
    { left: '8%', dur: '16s', d: '0s' }, { left: '26%', dur: '19s', d: '4s' },
    { left: '47%', dur: '14s', d: '8s' }, { left: '66%', dur: '21s', d: '2s' },
    { left: '83%', dur: '17s', d: '6s' }, { left: '93%', dur: '15s', d: '10s' },
]

export default function NightBackground() {
    return (
        <div className="ecla-night" aria-hidden="true">
            {STARS.map((st, i) => (
                <span key={`s${i}`} className="ecla-star" style={{ top: st.top, left: st.left, width: st.s, height: st.s, animationDelay: st.d }} />
            ))}
            {FLIES.map((f, i) => (
                <span key={`f${i}`} className="ecla-fly" style={{ left: f.left, animationDuration: f.dur, animationDelay: f.d }} />
            ))}
        </div>
    )
}