'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import type { Header } from '@/payload-types'

import { HeaderNav } from './Nav'

interface HeaderClientProps {
  data: Header
}

import { Menu, X } from 'lucide-react'

import { ThemeSelector } from '@/providers/Theme/ThemeSelector'

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  const [theme, setTheme] = useState<string | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()

  useEffect(() => {
    setHeaderTheme(null)
    setIsMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (headerTheme !== theme) setTheme(headerTheme || null)
  }, [headerTheme, theme])

  return (
    <header className="bg-black text-white relative z-20" {...(theme ? { 'data-theme': theme } : {})}>
      <div className="container py-8 flex items-center justify-between">
        <Link href="/">
          <span className="font-mono font-bold text-[18px] tracking-tight text-white hover:text-white">Aniket Patidar</span>
        </Link>
        
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden md:block">
            <HeaderNav data={data} />
          </div>

          <ThemeSelector />

          <button 
            className="md:hidden p-2 -mr-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-black text-white border-b border-border p-4 flex flex-col z-50">
          <HeaderNav data={data} mobile />
        </div>
      )}
    </header>
  )
}
