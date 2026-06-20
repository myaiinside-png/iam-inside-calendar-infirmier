export const metadata = {
  title: 'IAM Inside - Remplacements Infirmiers',
  description: 'Calendrier des disponibilités pour remplacements infirmiers',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', background: '#f5f5f5' }}>
        {children}
      </body>
    </html>
  )
}
