'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { User, AuditLog, Order } from '@/types'

export default function AdminUsersPage() {
  const { user, token } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [tab, setTab] = useState<'users' | 'logs' | 'orders'>('users')
  const [orderFilter, setOrderFilter] = useState<string>('')
  const [msg, setMsg] = useState('')
  const [modal, setModal] = useState<{ userId: number; action: 'reset_password' | 'tag'; defaultValue: string } | null>(null)
  const [inputVal, setInputVal] = useState('')

  useEffect(() => {
    if (!token) { router.push('/login'); return }
    if (!user?.is_admin) { router.push('/dashboard'); return }
    loadData()
  }, [token, user, tab, orderFilter])

  const headers = { Authorization: `Bearer ${token}` }

  const loadData = async () => {
    if (tab === 'users') {
      const res = await fetch('/api/admin/users', { headers })
      const d = await res.json()
      if (d.users) setUsers(d.users)
    } else if (tab === 'orders') {
      const url = orderFilter ? `/api/admin/orders?status=${orderFilter}` : '/api/admin/orders'
      const res = await fetch(url, { headers })
      const d = await res.json()
      if (d.orders) setOrders(d.orders)
    } else {
      const res = await fetch('/api/admin/audit-log?limit=100', { headers })
      const d = await res.json()
      if (d.logs) setLogs(d.logs)
    }
  }

  const handleAdminAction = async (userId: number, action: string, value?: string) => {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, action, value }),
    })
    const d = await res.json()
    if (d.success) { setMsg('操作成功'); loadData() }
    else setMsg(d.error || '操作失败')
  }

  const formatTime = (value?: string | null) => {
    if (!value) return '-'
    return value.replace('T', ' ').slice(0, 16)
  }

  const getAcceptedTime = (order: Order) => {
    const acceptedLogAt = (order as any).accepted_log_at as string | undefined
    const fallbackUpdatedAt = order.assigned_to && ['accepted', 'completed'].includes(order.status)
      ? order.updated_at
      : undefined
    return order.accepted_at || acceptedLogAt || fallbackUpdatedAt
  }

  const statusLabel: Record<string, string> = {
    pending: '待接单', accepted: '已接单', completed: '已完成', cancelled: '已撤销',
  }
  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    accepted: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-500',
  }

  if (!user) return null

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">管理后台</h1>

      {msg && <div className="bg-green-50 text-green-700 p-3 rounded mb-4 text-sm">{msg}</div>}

      <div className="flex gap-1 mb-4 border-b">
        <button onClick={() => setTab('users')}
          className={`px-4 py-2 ${tab === 'users' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500'}`}>
          用户管理
        </button>
        <button onClick={() => setTab('orders')}
          className={`px-4 py-2 ${tab === 'orders' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500'}`}>
          订单管理
        </button>
        <button onClick={() => setTab('logs')}
          className={`px-4 py-2 ${tab === 'logs' ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500'}`}>
          操作日志
        </button>
      </div>

      {tab === 'users' ? (
        <div className="space-y-3">
          {users.map(u => (
            <div key={u.id} className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{u.username}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      u.role === 'worker' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>{u.role === 'worker' ? '接单员' : '用户'}</span>
                    {u.is_admin && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">管理员</span>}
                    {u.tags && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{u.tags}</span>}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {u.phone} · {u.email} · {u.district}{u.street}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                <button onClick={() => { setInputVal(''); setModal({ userId: u.id, action: 'reset_password', defaultValue: '123456' }) }}
                  className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200">重置密码</button>
                <button onClick={() => { setInputVal(u.tags || ''); setModal({ userId: u.id, action: 'tag', defaultValue: '' }) }}
                  className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200">标注</button>
                <button onClick={() => {
                  const role = u.role === 'worker' ? 'user' : 'worker'
                  handleAdminAction(u.id, 'set_role', role)
                }} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200">
                  切换为{u.role === 'worker' ? '用户' : '接单员'}
                </button>
                {!u.is_admin && (
                  <button onClick={() => handleAdminAction(u.id, 'set_admin', 'true')}
                    className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">设为管理员</button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : tab === 'orders' ? (
        <div>
          <div className="flex gap-2 mb-4">
            {['', 'pending', 'accepted', 'completed', 'cancelled'].map(s => (
              <button key={s} onClick={() => setOrderFilter(s)}
                className={`px-3 py-1.5 text-sm rounded ${orderFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {s ? statusLabel[s] : '全部'}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm bg-white rounded-lg shadow-sm border">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-3 py-2 font-medium">ID</th>
                  <th className="text-left px-3 py-2 font-medium">派单人</th>
                  <th className="text-left px-3 py-2 font-medium">派单内容</th>
                  <th className="text-left px-3 py-2 font-medium">接单人</th>
                  <th className="text-left px-3 py-2 font-medium">状态</th>
                  <th className="text-left px-3 py-2 font-medium">派单时间</th>
                  <th className="text-left px-3 py-2 font-medium">接单时间</th>
                  <th className="text-left px-3 py-2 font-medium">预约时间</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-3 text-gray-500">#{o.id}</td>
                    <td className="px-3 py-3 font-medium">{(o as any).creator?.username || `用户#${o.user_id}`}</td>
                    <td className="px-3 py-3 max-w-xs">
                      <div className="font-medium">{o.title}</div>
                      {o.description && <div className="text-gray-500 truncate">{o.description}</div>}
                    </td>
                    <td className="px-3 py-3">{(o as any).worker?.username || (o.assigned_to ? `接单员#${o.assigned_to}` : '-')}</td>
                    <td className="px-3 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${statusColor[o.status] || ''}`}>
                        {statusLabel[o.status] || o.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-xs">{formatTime(o.created_at)}</td>
                    <td className="px-3 py-3 text-gray-500 text-xs">{formatTime(getAcceptedTime(o))}</td>
                    <td className="px-3 py-3 text-gray-500 text-xs">{formatTime(o.scheduled_time)}</td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={8} className="text-center text-gray-400 py-8">暂无订单</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(l => (
            <div key={l.id} className="bg-white p-3 rounded border text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{l.table_name}</span>
                <span className="font-medium text-gray-700">{l.action}</span>
                <span>记录 #{l.record_id}</span>
                <span className="text-gray-400">{formatTime(l.created_at)}</span>
                <span className="text-gray-400">操作人 {(l as any).users?.username || l.performed_by}</span>
              </div>
            </div>
          ))}
          {logs.length === 0 && <p className="text-center text-gray-400 py-8">暂无操作日志</p>}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setModal(null)}>
          <div className="bg-white p-6 rounded-lg shadow-xl w-80" onClick={e => e.stopPropagation()}>
            <h3 className="font-medium mb-3">{modal.action === 'reset_password' ? '重置密码' : '标注'}</h3>
            <input type="text" value={inputVal} autoFocus
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { handleAdminAction(modal.userId, modal.action, inputVal || modal.defaultValue); setModal(null) } }}
              placeholder={modal.action === 'reset_password' ? '留空默认 123456' : '输入标签'}
              className="w-full border rounded px-3 py-2 text-sm mb-3" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setModal(null)} className="px-3 py-1.5 text-sm bg-gray-100 rounded hover:bg-gray-200">取消</button>
              <button onClick={() => { handleAdminAction(modal.userId, modal.action, inputVal || modal.defaultValue); setModal(null) }}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">确定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
