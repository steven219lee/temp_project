'use client'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold mb-4">社区服务派单系统</h1>
      <p className="text-gray-500 mb-8">连接社区居民与服务人员，让生活更便捷</p>
      {user ? (
        <Link href="/dashboard" className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-blue-700">
          进入{user.is_admin ? '管理' : user.role === 'worker' ? '接单' : '派单'}中心
        </Link>
      ) : (
        <div className="flex gap-4 justify-center">
          <Link href="/login" className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-blue-700">登录</Link>
          <Link href="/register" className="bg-green-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-green-700">注册</Link>
        </div>
      )}
    </div>
  )
}