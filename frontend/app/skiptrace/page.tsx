'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

/**
 * Redirect from /skiptrace to /skip-trace
 * This ensures we have a single skip trace page
 */
export default function SkiptraceRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    // Preserve any query params when redirecting
    const params = searchParams.toString()
    const destination = params ? `/skip-trace?${params}` : '/skip-trace'
    router.replace(destination)
  }, [router, searchParams])
  
  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-foreground-muted">Redirecting to Skip Trace...</p>
      </div>
    </div>
  )
}
