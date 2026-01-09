import type { Metadata } from 'next'
import { Oxanium, Source_Code_Pro } from 'next/font/google'
import { Providers } from '@/components/Providers'
import './globals.css'

const oxanium = Oxanium({ 
  weight: ['400', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const sourceCodePro = Source_Code_Pro({ 
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

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
      <body className={`${oxanium.variable} ${sourceCodePro.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
