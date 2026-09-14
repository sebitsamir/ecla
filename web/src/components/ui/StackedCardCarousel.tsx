'use client'

import { useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react'

type StackStyle = CSSProperties & Record<'--stack-x' | '--stack-y' | '--stack-scale' | '--stack-opacity' | '--stack-z' | '--stack-rotate', string | number>
type TrackStyle = CSSProperties & Record<'--stack-height' | '--stack-card-height', string>

export type StackedCardCarouselProps<T> = {
  items: readonly T[]
  getKey: (item: T) => string
  getLabel: (item: T) => string
  renderCard: (item: T, index: number) => ReactNode
  label: string
  desktopColumnsClassName: string
  mobileHeight: string
  cardHeight: string
  onActiveChange?: (index: number) => void
}

export function StackedCardCarousel<T>({ items, getKey, getLabel, renderCard, label, desktopColumnsClassName, mobileHeight, cardHeight, onActiveChange }: StackedCardCarouselProps<T>) {
  const [active, setActiveState] = useState(0)
  const [drag, setDrag] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startX = useRef<number | null>(null)
  const setActive = (index: number) => {
    const next = Math.max(0, Math.min(items.length - 1, index))
    setActiveState(next); onActiveChange?.(next)
  }
  const finish = () => {
    if (drag < -55) setActive(active + 1)
    else if (drag > 55) setActive(active - 1)
    startX.current = null; setDragging(false); setDrag(0)
  }
  const down = (event: PointerEvent<HTMLDivElement>) => {
    if (window.innerWidth >= 640) return
    startX.current = event.clientX; setDragging(true); event.currentTarget.setPointerCapture(event.pointerId)
  }
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (startX.current != null) setDrag(Math.max(-130, Math.min(130, event.clientX - startX.current)))
  }
  const trackStyle: TrackStyle = { '--stack-height': mobileHeight, '--stack-card-height': cardHeight }

  return <>
    <div style={trackStyle} onPointerDown={down} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} className={`ecla-card-stack relative touch-pan-y select-none sm:grid sm:gap-3 sm:select-auto ${desktopColumnsClassName} ${dragging ? 'is-dragging' : ''}`} aria-roledescription="carousel" aria-label={label}>
      {items.map((item, index) => {
        const relative = index - active
        const style: StackStyle = {
          '--stack-x': relative === 0 ? `${drag}px` : `${relative * 22}px`, '--stack-y': relative === 0 ? '0px' : '12px', '--stack-scale': relative === 0 ? 1 : .94,
          '--stack-opacity': Math.abs(relative) <= 1 ? (relative === 0 ? 1 : .64) : 0, '--stack-z': relative === 0 ? 20 : 10 - Math.abs(relative), '--stack-rotate': relative === 0 ? `${drag * .018}deg` : '0deg',
        }
        return <article key={getKey(item)} style={style} className="ecla-stack-card absolute inset-x-6 top-0 overflow-hidden rounded-[24px] border border-line bg-ink shadow-glow-md sm:relative sm:inset-auto">{renderCard(item, index)}</article>
      })}
    </div>
    <div className="mt-3 flex items-center justify-center gap-2 sm:hidden" aria-label={`${label}: ${active + 1} of ${items.length}`}>{items.map((item, index) => <button key={getKey(item)} type="button" onClick={() => setActive(index)} aria-label={`Show ${getLabel(item)}`} aria-current={active === index ? 'true' : undefined} className={`ecla-control h-2 rounded-full ${active === index ? 'w-7 bg-ember' : 'w-2 bg-line-strong'}`} />)}</div>
    <p className="mt-3 text-center text-xs text-ash sm:hidden">Swipe to explore · {active + 1} of {items.length}</p>
  </>
}
