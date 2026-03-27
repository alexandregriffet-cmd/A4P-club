import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'A4P Diagnostic Club',
  description: 'Plateforme de diagnostic mental pour les clubs sportifs — Académie de Performances A4P',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'DM Sans', sans-serif; background: #f0f4ff; color: #1a2a4a; }
          input, button, select, textarea { font-family: 'DM Sans', sans-serif; }
          button { cursor: pointer; }
          a { text-decoration: none; }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
