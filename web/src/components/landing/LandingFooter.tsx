import Link from 'next/link'
import { Logo } from '@/components/BrandLogo'

const links = [
  { href: '#method', label: 'Method' },
  { href: '#curriculum', label: 'Curriculum' },
  { href: '#progress', label: 'Progress' },
  { href: '#system', label: 'System' },
  { href: '#about', label: 'About' },
]

export default function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06]">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-8 px-5 py-10 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-10 lg:py-12">
        <div>
          <Link href="/" aria-label="ECLA home">
            <Logo className="text-[1.4rem]" fireflySize={22} />
          </Link>
          <p className="mt-3 max-w-xs text-xs leading-5 text-cream/[35%]">
            Curriculum-driven language learning designed around what you can actually understand, remember, and use.
          </p>
        </div>

        <div className="flex flex-col gap-5 lg:items-end">
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-2">
            {links.map((item) => (
              <Link key={item.href} href={item.href} className="text-xs font-bold text-cream/[42%] transition-colors hover:text-cream">
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="text-[11px] text-cream/[28%]">© {new Date().getFullYear()} ECLA. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
