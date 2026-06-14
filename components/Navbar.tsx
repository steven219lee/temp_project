'use client'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-blue-600">社区服务</Link>
        <div className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              <Link href="/dashboard" className="hover:text-blue-600">
                {user.is_admin ? '管理后台' : user.role === 'worker' ? '接单中心' : '我的派单'}
              </Link>
              {user.is_admin && <Link href="/admin/users" className="hover:text-blue-600">用户管理</Link>}
              <span className="text-gray-300">|</span>
              <Link href="/git/tutorial" className="hover:text-blue-600">Git教程</Link>
              <Link href="/git/snippets" className="hover:text-blue-600">代码片段</Link>
              <Link href="/git/repos" className="hover:text-blue-600">仓库管理</Link>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">{user.username}</span>
              <button onClick={logout} className="text-red-500 hover:text-red-700">退出</button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-blue-600">登录</Link>
              <Link href="/register" className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">注册</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}