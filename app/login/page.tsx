'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const res = await login(username, password)
    if (res.success) {
      router.push('/dashboard')
    } else {
      setError(res.error || '登录失败')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-6 text-center">登录</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
        {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium mb-1">用户名</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)}
            className="w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">密码</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2" required />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">登录</button>
        <p className="text-sm text-center text-gray-500">
          还没有账号？<Link href="/register" className="text-blue-600 hover:underline">立即注册</Link>
        </p>
      </form>
      <div className="mt-4 text-sm text-center text-gray-400">
        测试账号: admin / admin123 (管理员)
      </div>
    </div>
  )
}