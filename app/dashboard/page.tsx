'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Order } from '@/types'

export default function DashboardPage() {
  const { user, token } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [tab, setTab] = useState<'my' | 'available' | 'history'>('my')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', location: '', scheduled_time: '' })
  const [msg, setMsg] = useState('')
  // 备注弹窗
  const [notesModal, setNotesModal] = useState<{ orderId: number; text: string; images: string[] } | null>(null)
  // 个人信息弹窗
  const [showProfile, setShowProfile] = useState(false)
  const [profile, setProfile] = useState({ phone: '', email: '', district: '', street: '', address: '', emergency_contact: '', emergency_phone: '' })

  useEffect(() => {
    if (!token) { router.push('/login'); return }
    if (user?.is_admin) { router.push('/admin/users'); return }
    loadOrders()
  }, [token, user, tab])

  const headers = { Authorization: `Bearer ${token}` }

  const loadOrders = async () => {
    let url = '/api/orders?'
    if (tab === 'my') {
      url += user?.role === 'worker' ? 'role=assigned&status=accepted' : 'role=user'
    } else if (tab === 'available') {
      url += 'role=worker&status=pending'
    } else {
      url += user?.role === 'worker' ? 'role=assigned&status=completed,cancelled' : 'role=user&status=completed,cancelled'
    }
    const res = await fetch(url, { headers })
    const data = await res.json()
    if (data.orders) setOrders(data.orders)
  }

  const createOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    const res = await fetch('/api/orders', {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.order) {
      setShowForm(false)
      setForm({ title: '', description: '', location: '', scheduled_time: '' })
      setMsg('派单成功！')
      loadOrders()
    } else {
      setMsg(data.error || '派单失败')
    }
  }

  const handleAction = async (orderId: number, action: string, extra?: any) => {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    })
    const data = await res.json()
    if (data.order) { setMsg('操作成功'); loadOrders() }
    else setMsg(data.error || '操作失败')
  }

  const handleSaveNotes = async () => {
    if (!notesModal) return
    const imagesJson = JSON.stringify(notesModal.images)
    const res = await fetch(`/api/orders/${notesModal.orderId}`, {
      method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'notes', notes: notesModal.text, notes_images: imagesJson }),
    })
    const data = await res.json()
    if (data.error) {
      setMsg(data.error)
      return
    }
    setMsg('备注已保存')
    setNotesModal(null)
    loadOrders()
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !notesModal || notesModal.images.length >= 6) return
    if (file.size > 2 * 1024 * 1024) { setMsg('图片不能超过 2MB'); return }
    const reader = new FileReader()
    reader.onloadend = () => {
      setNotesModal(prev => prev ? { ...prev, images: [...prev.images, reader.result as string] } : null)
    }
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = async () => {
    const res = await fetch('/api/profile', {
      method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
    const data = await res.json()
    if (data.error) { setMsg(data.error); return }
    setMsg('个人信息已更新')
    setShowProfile(false)
    window.location.reload()
  }

  if (!user) return null

  const isWorker = user.role === 'worker'
  const myOrders = orders.filter(o => o.user_id === user.id)
  const availableOrders = orders.filter(o => o.status === 'pending')
  const myAccepted = orders.filter(o => o.assigned_to === user.id)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{isWorker ? '接单中心' : '我的派单'}</h1>
        <div className="flex gap-2">
          <button onClick={() => {
            setProfile({
              phone: user.phone || '', email: user.email || '',
              district: user.district || '', street: user.street || '',
              address: user.address || '',
              emergency_contact: user.emergency_contact || '',
              emergency_phone: user.emergency_phone || '',
            })
            setShowProfile(true)
          }} className="text-sm bg-gray-100 px-3 py-2 rounded hover:bg-gray-200">个人信息</button>
          {!isWorker && <button onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ 新派单</button>}
        </div>
      </div>

      {msg && <div className="bg-green-50 text-green-700 p-3 rounded mb-4 text-sm">{msg}</div>}

      {/* 派单表单 */}
      {showForm && !isWorker && (
        <form onSubmit={createOrder} className="bg-white p-4 rounded-lg shadow mb-6 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">标题 *</label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full border rounded px-3 py-2" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">地点</label>
              <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">预约时间 *</label>
              <input type="datetime-local" value={form.scheduled_time}
                onChange={e => setForm(f => ({ ...f, scheduled_time: e.target.value }))}
                className="w-full border rounded px-3 py-2" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">事项描述</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full border rounded px-3 py-2" rows={3} />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">发布</button>
            <button type="button" onClick={() => setShowForm(false)}
              className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">取消</button>
          </div>
        </form>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b">
        {!isWorker && (
          <button onClick={() => setTab('my')}
            className={`px-4 py-2 ${tab === 'my' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500'}`}>
            我的派单
          </button>
        )}
        {isWorker && (
          <button onClick={() => setTab('available')}
            className={`px-4 py-2 ${tab === 'available' ? 'border-b-2 border-green-600 text-green-600 font-medium' : 'text-gray-500'}`}>
            可接单 {availableOrders.length > 0 && `(${availableOrders.length})`}
          </button>
        )}
        {isWorker && (
          <button onClick={() => setTab('my')}
            className={`px-4 py-2 ${tab === 'my' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500'}`}>
            已接单 {myAccepted.length > 0 && `(${myAccepted.length})`}
          </button>
        )}
        <button onClick={() => setTab('history')}
          className={`px-4 py-2 ${tab === 'history' ? 'border-b-2 border-gray-600 text-gray-600 font-medium' : 'text-gray-500'}`}>
          历史记录
        </button>
      </div>

      {/* 订单列表 */}
      <div className="space-y-3">
        {orders.map(o => (
          <div key={o.id} className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">{o.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {o.location && `${o.location} · `}{o.scheduled_time?.replace('T', ' ')}
                </p>
                {o.description && <p className="text-sm text-gray-600 mt-1">{o.description}</p>}
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                o.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                o.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                o.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {o.status === 'pending' ? '待接单' : o.status === 'accepted' ? '已接单' :
                 o.status === 'completed' ? '已完成' : '已撤销'}
              </span>
            </div>
            {(tab !== 'available') && o.username && (
              <div className="text-xs text-gray-500 mt-1 bg-gray-50 rounded p-2 space-y-0.5">
                <p>派单人: {o.username}</p>
                {o.phone && <p>电话: {o.phone}</p>}
                {o.email && <p>邮箱: {o.email}</p>}
              </div>
            )}
            {o.notes && <p className="text-xs text-gray-400 mt-1">备注: {o.notes}</p>}
            {o.notes_images && (() => {
              try {
                const imgs: string[] = JSON.parse(o.notes_images)
                if (imgs.length > 0) return (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {imgs.map((img, i) => (
                      <img key={i} src={img} alt={`附件${i + 1}`}
                        className="w-10 h-10 object-cover rounded border cursor-pointer hover:opacity-80"
                        onClick={() => window.open(img, '_blank')} />
                    ))}
                  </div>)
              } catch { return null }
            })()}
            <div className="flex gap-2 mt-3">
              {!isWorker && o.status === 'pending' && o.user_id === user.id && (
                <button onClick={() => handleAction(o.id, 'cancel')}
                  className="text-sm text-red-500 hover:text-red-700">撤销</button>
              )}
              {isWorker && o.status === 'pending' && (
                <button onClick={() => handleAction(o.id, 'accept')}
                  className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">接单</button>
              )}
              {o.status === 'accepted' && (o.assigned_to === user.id || o.user_id === user.id) && (
                <button onClick={() => handleAction(o.id, 'complete')}
                  className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">完成</button>
              )}
              {o.status === 'completed' && o.user_id === user.id && !o.rating && (
                <button onClick={() => {
                  const r = prompt('评分 (1-5):', '5')
                  if (r) handleAction(o.id, 'rate', { rating: parseInt(r), review: prompt('评价:') || '' })
                }} className="text-sm text-yellow-600 hover:text-yellow-800">评价</button>
              )}
              {(o.user_id === user.id || o.assigned_to === user.id) && (
                <button onClick={() => {
                  const existing: string[] = o.notes_images ? JSON.parse(o.notes_images) : []
                  setNotesModal({ orderId: o.id, text: o.notes || '', images: existing })
                }} className="text-sm text-gray-500 hover:text-gray-700">备注</button>
              )}
            </div>
            {o.rating && <p className="text-xs text-yellow-600 mt-2">评分: {'★'.repeat(o.rating)}{o.review && ` · ${o.review}`}</p>}
          </div>
        ))}
        {orders.length === 0 && <p className="text-center text-gray-400 py-8">暂无订单</p>}
      </div>

      {/* 备注弹窗 */}
      {notesModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setNotesModal(null)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">编辑备注</h2>
            <textarea
              value={notesModal.text}
              onChange={e => setNotesModal(prev => prev ? { ...prev, text: e.target.value } : null)}
              placeholder="输入备注文字..."
              className="w-full border rounded px-3 py-2 mb-3 text-sm" rows={4}
            />
            {notesModal.images.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3">
                {notesModal.images.map((img, i) => (
                  <div key={i} className="relative group">
                    <img src={img} className="w-16 h-16 object-cover rounded border" />
                    <button
                      onClick={() => setNotesModal(prev => prev ? {
                        ...prev, images: prev.images.filter((_, j) => j !== i)
                      } : null)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >x</button>
                  </div>
                ))}
              </div>
            )}
            {notesModal.images.length < 6 && (
              <label className="inline-block text-sm text-blue-600 cursor-pointer hover:text-blue-800 mb-4">
                + 添加图片附件 ({notesModal.images.length}/6)
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setNotesModal(null)} className="px-4 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200">取消</button>
              <button onClick={handleSaveNotes} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">保存</button>
            </div>
          </div>
        </div>
      )}

      {/* 个人信息弹窗 */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowProfile(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">编辑个人信息</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">电话</label>
                <input type="text" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">邮箱</label>
                <input type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">区域</label>
                  <input type="text" value={profile.district} onChange={e => setProfile(p => ({ ...p, district: e.target.value }))}
                    className="w-full border rounded px-3 py-2 text-sm" placeholder="如: 朝阳区" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">街道</label>
                  <input type="text" value={profile.street} onChange={e => setProfile(p => ({ ...p, street: e.target.value }))}
                    className="w-full border rounded px-3 py-2 text-sm" placeholder="如: 望京街道" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">详细地址</label>
                <input type="text" value={profile.address} onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">紧急联系人</label>
                  <input type="text" value={profile.emergency_contact} onChange={e => setProfile(p => ({ ...p, emergency_contact: e.target.value }))}
                    className="w-full border rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">紧急联系电话</label>
                  <input type="text" value={profile.emergency_phone} onChange={e => setProfile(p => ({ ...p, emergency_phone: e.target.value }))}
                    className="w-full border rounded px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button onClick={() => setShowProfile(false)} className="px-4 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200">取消</button>
              <button onClick={handleSaveProfile} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">保存</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
