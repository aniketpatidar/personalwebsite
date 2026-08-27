'use client'

import React from 'react'

import type { Header as HeaderType } from '@/payload-types'
import { cn } from '@/utilities/ui'

import { CMSLink } from '@/components/Link'
import Link from 'next/link'
export const HeaderNav: React.FC<{ data: HeaderType; mobile?: boolean }> = ({ data, mobile }) => {
  const navItems = data?.navItems || []

  return (
    <nav className={cn(
      "flex gap-3",
      mobile 
        ? "flex-col w-full text-base items-center p-4" 
        : "items-center flex-wrap justify-center md:justify-end text-sm md:text-base"
    )}>
      {navItems.map(({ link }, i) => {
        return <CMSLink key={i} {...link} appearance="link" className={cn("font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-white hover:text-white hover:underline underline-offset-4", mobile ? "w-full py-2" : "")} />
      })}
    </nav>
  )
}
