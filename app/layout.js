import './globals.css'
import Header from './components/Header'

export const metadata = {
  title: 'Unconfigure - Reorder it',
  description: 'A game where you guess the correct order of items'
}

export default function RootLayout ({ children }) {
  return (
    <html lang='en'>
      <body className={`antialiased overflow-auto h-[100svh]`}>
        <Header />
        <div className='flex flex-col px-4'>{children}</div>
      </body>
    </html>
  )
}
