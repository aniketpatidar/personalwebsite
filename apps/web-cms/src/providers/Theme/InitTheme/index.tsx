import React from 'react'
import Script from 'next/script'



export const InitTheme: React.FC = () => {
  return <Script src="/theme.js" strategy="beforeInteractive" />
}
