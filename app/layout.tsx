import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import Navbar from '@/components/Navbar'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50">
        <AuthProvider>
          <Navbar />
          <main className="max-w-6xl mx-auto p-4">{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}