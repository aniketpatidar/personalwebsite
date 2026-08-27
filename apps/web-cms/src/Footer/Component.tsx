import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React from 'react'

import { CMSLink } from '@/components/Link'

export async function Footer() {
  const footerData = await getCachedGlobal('footer', 1)()

  const navItems = footerData?.navItems || []

  return (
    <footer className="mt-auto border-t-2 border-foreground bg-background text-foreground">
      <div className="container py-12 md:py-16 grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8 text-left">
        <div className="flex flex-col gap-4">
          <div className="font-sans text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Site</div>
          <Link className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] hover:underline underline-offset-4 text-foreground" href="/privacy-policy">
            Privacy Policy
          </Link>
          <Link className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] hover:underline underline-offset-4 text-foreground" href="/contact">
            Contact
          </Link>
          <Link className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] hover:underline underline-offset-4 text-foreground" href="/friends">
            Friends
          </Link>
        </div>

        <div className="flex flex-col gap-4">
          <div className="font-sans text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Connect</div>
          <nav className="flex flex-col gap-4 items-start">
            {navItems.map(({ link }, i) => {
              return <CMSLink className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] hover:underline underline-offset-4 text-foreground text-left" key={i} {...link} />
            })}
          </nav>
        </div>
      </div>
      
      <div className="bg-black text-white">
        <div className="container py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-sans text-[13px] text-white/80">
            &copy; {new Date().getFullYear()} Aniket Patidar &middot; All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}
