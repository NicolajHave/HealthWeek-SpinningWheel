import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Selected Health Week',
  description: 'One spin per team. Reps banked by the whole company.',
  // The URL is public so the board can be viewed from a desk, but it has no
  // business in a search index.
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: '#EFEFEF',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Stand-in for the Selected display face. Loaded via <link> rather
            than next/font so a build never depends on reaching Google Fonts;
            the brand mono is self-hosted from /public/fonts. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
