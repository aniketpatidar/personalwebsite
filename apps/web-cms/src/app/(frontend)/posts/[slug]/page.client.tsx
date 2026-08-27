'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import React, { useEffect } from 'react'

const PageClient: React.FC<{ hasHeroImage?: boolean }> = ({ hasHeroImage }) => {
  /* Force the header to be dark mode if we have an image behind it */
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme(hasHeroImage ? 'dark' : null)
  }, [setHeaderTheme, hasHeroImage])
  return <React.Fragment />
}

export default PageClient
