'use client'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SetupPage() {
  const { user, token } = useAuth()
  const router = useRouter()
  const [status, setStatus] = useState<'checking' | 'ready' | 'error'>('checking')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) { router.push('/login'); return }
    if (!user?.is_admin) { router.push('/dashboard'); return }
    checkTables()
  }, [token, user])

  const headers = { Authorization: `Bearer ${token}` }

  const checkTables = async () => {
    try {
      const res = await fetch('/api/orders?limit=1', { headers })
      if (res.ok) {
        setStatus('ready')
        setMessage('所有表已就绪！')
      } else {
        setStatus('error')
        setMessage('数据库表未创建，请在 Supabase SQL Editor 中运行建表脚本。')
      }
    } catch {
      setStatus('error')
      setMessage('无法连接数据库')
    }
  }

  const sql = `-- =============================================
-- L6 社区服务派单系统 - Supabase 建表脚本
-- 打开 https://supabase.com/dashboard 进入 SQL Editor 运行
-- =============================================

-- 1. 扩展 users 表（添加L6需要的字段）
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tags TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. 订单表
ALTER TABLE orders ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes_images TEXT;

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  scheduled_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled')),
  assigned_to INTEGER REFERENCES users(id),
  accepted_at TIMESTAMPTZ,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  notes TEXT,
  notes_images TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  old_data TEXT,
  new_data TEXT,
  performed_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 索引
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_to ON orders(assigned_to);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name);`

  return (
    <div className="max-w-3xl mx-auto mt-6">
      <h1 className="text-2xl font-bold mb-4">数据库初始化</h1>

      {status === 'checking' && <p className="text-gray-500">检查数据库状态...</p>}

      {status === 'error' && (
        <div>
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded mb-4">
            <p className="font-medium">{message}</p>
            <p className="text-sm mt-2">请执行以下步骤：</p>
            <ol className="text-sm mt-1 ml-4 list-decimal">
              <li>打开 <a href="https://supabase.com/dashboard" target="_blank" className="text-blue-600 underline">Supabase Dashboard</a></li>
              <li>进入 SQL Editor</li>
              <li>粘贴下面的 SQL 并运行</li>
              <li>刷新本页面</li>
            </ol>
          </div>

          <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96">
            <pre className="text-xs whitespace-pre-wrap">{sql}</pre>
          </div>
          <button onClick={() => { navigator.clipboard.writeText(sql); alert('已复制！'); }}
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
            复制 SQL
          </button>
          <button onClick={checkTables}
            className="mt-2 ml-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm">
            检查状态
          </button>
        </div>
      )}

      {status === 'ready' && (
        <div className="bg-green-50 text-green-700 p-4 rounded">
          ✅ 数据库已就绪！<a href="/dashboard" className="underline ml-2">进入系统</a>
        </div>
      )}
    </div>
  )
}