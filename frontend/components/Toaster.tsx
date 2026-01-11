'use client';

import { Toaster as HotToaster } from 'react-hot-toast';

export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--card)',
          color: 'var(--foreground)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '12px 16px',
          fontSize: '0.875rem',
          boxShadow: 'var(--shadow-lg)',
        },
        success: {
          iconTheme: {
            primary: 'var(--success)',
            secondary: 'var(--card)',
          },
          style: {
            borderLeft: '3px solid var(--success)',
          },
        },
        error: {
          iconTheme: {
            primary: 'var(--destructive)',
            secondary: 'var(--card)',
          },
          style: {
            borderLeft: '3px solid var(--destructive)',
          },
        },
        loading: {
          iconTheme: {
            primary: 'var(--primary)',
            secondary: 'var(--card)',
          },
        },
      }}
    />
  );
}
