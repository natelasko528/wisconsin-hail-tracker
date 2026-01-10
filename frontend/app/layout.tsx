import type { Metadata } from 'next'
import { Providers } from '@/components/Providers'
import './globals.css'

// Using system fonts to avoid build-time Google Fonts fetching issues
// Fonts will be loaded via CSS @import in globals.css for better compatibility

export const metadata: Metadata = {
  title: 'Wisconsin Hail CRM | Lead Generation & Marketing',
  description: 'Complete CRM for hail storm lead generation with skip tracing, marketing automation, and GoHighLevel integration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Oxanium:wght@400;600;700;800&family=Source+Code+Pro:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
