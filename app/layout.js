import './globals.css'

export const metadata = {
  title: 'Chalet Booking',
  description: 'Collaborative chalet night booking',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
