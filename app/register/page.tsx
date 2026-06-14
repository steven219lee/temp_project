'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: '', password: '', email: '', phone: '',
    role: 'user' as 'user' | 'worker',
    district: '', street: '', address: '',
    emergency_contact: '', emergency_phone: '',
  })
  const [error, setError] = useState('')
  const { register } = useAuth()
  const router = useRouter()

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) {
      setError('密码至少6位')
      return
    }
    const res = await register(form)
    if (res.success) {
      router.push('/dashboard')
    } else {
      setError(res.error || '注册失败')
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-6">
      <h1 className="text-2xl font-bold mb-6 text-center">注册</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
        {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm">{error}</div>}

        {/* 身份选择 */}
        <div>
          <label className="block text-sm font-medium mb-1">注册身份</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="role" checked={form.role === 'user'}
                onChange={() => update('role', 'user')} className="accent-blue-600" />
              <span className={form.role === 'user' ? 'font-medium text-blue-600' : ''}>用户 - 我要派单</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="role" checked={form.role === 'worker'}
                onChange={() => update('role', 'worker')} className="accent-green-600" />
              <span className={form.role === 'worker' ? 'font-medium text-green-600' : ''}>接单员 - 我要接单</span>
            </label>
          </div>
        </div>

        {/* 账号信息 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">用户名 *</label>
            <input type="text" value={form.username} onChange={e => update('username', e.target.value)}
              className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">密码 *</label>
            <input type="password" value={form.password} onChange={e => update('password', e.target.value)}
              className="w-full border rounded px-3 py-2" required minLength={6} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">邮箱</label>
            <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">联系电话 *</label>
            <input type="text" value={form.phone} onChange={e => update('phone', e.target.value)}
              className="w-full border rounded px-3 py-2" required />
          </div>
        </div>

        {/* 地址信息 */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">地址信息</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">区 *</label>
              <input type="text" value={form.district} onChange={e => update('district', e.target.value)}
                placeholder="如：福田区" className="w-full border rounded px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">街道 *</label>
              <input type="text" value={form.street} onChange={e => update('street', e.target.value)}
                placeholder="如：华强北街道" className="w-full border rounded px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">详细地址 *</label>
              <input type="text" value={form.address} onChange={e => update('address', e.target.value)}
                placeholder="如：XX小区X栋X号" className="w-full border rounded px-3 py-2" required />
            </div>
          </div>
        </div>

        {/* 紧急联系人 */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">紧急联系人</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">联系人 *</label>
              <input type="text" value={form.emergency_contact} onChange={e => update('emergency_contact', e.target.value)}
                className="w-full border rounded px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">联系电话 *</label>
              <input type="text" value={form.emergency_phone} onChange={e => update('emergency_phone', e.target.value)}
                className="w-full border rounded px-3 py-2" required />
            </div>
          </div>
        </div>

        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 text-lg">
          注册
        </button>
        <p className="text-sm text-center text-gray-500">
          已有账号？<Link href="/login" className="text-blue-600 hover:underline">去登录</Link>
        </p>
      </form>
    </div>
  )
}