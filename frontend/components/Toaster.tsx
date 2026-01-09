'use client';

import { Toaster as HotToaster } from 'react-hot-toast';

export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--card-bg)',
          color: 'var(--text)',
          border: '2px solid var(--border)',
          borderRadius: '0px',
          padding: '16px',
        },
        success: {
          iconTheme: {
            primary: 'var(--primary)',
            secondary: 'var(--card-bg)',
          },
        },
        error: {
          iconTheme: {
            primary: 'var(--danger)',
            secondary: 'var(--card-bg)',
          },
        },
      }}
    />
  );
}
