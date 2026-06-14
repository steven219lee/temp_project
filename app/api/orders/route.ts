import { NextRequest, NextResponse } from 'next/server'
import { supabase, verifyToken, addAuditLog } from '@/lib/supabase'

// 获取订单列表
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth) return NextResponse.json({ error: '未登录' }, { status: 401 })
  const payload = verifyToken(auth.replace('Bearer ', ''))
  if (!payload) return NextResponse.json({ error: 'token无效' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const role = searchParams.get('role') // user=我的派单, worker=可接单列表

  let query = supabase.from('orders').select('*, users!orders_user_id_fkey(username, phone, email)')

  if (role === 'user') {
    query = query.eq('user_id', payload.id)
  } else if (role === 'worker') {
    query = query.eq('status', 'pending')
  } else if (role === 'assigned') {
    query = query.eq('assigned_to', payload.id)
  }
  if (status) {
    const statuses = status.split(',')
    query = statuses.length === 1 ? query.eq('status', statuses[0]) : query.in('status', statuses)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // 拍平 users join 嵌套: { users: {username, phone, email} } → { username, phone, email }
  const orders = (data || []).map(({ users, ...rest }: any) => ({
    ...rest,
    ...(users || {}),
  }))
  return NextResponse.json({ orders })
}

// 创建订单
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth) return NextResponse.json({ error: '未登录' }, { status: 401 })
  const payload = verifyToken(auth.replace('Bearer ', ''))
  if (!payload) return NextResponse.json({ error: 'token无效' }, { status: 401 })

  const { title, description, location, scheduled_time } = await req.json()
  if (!title || !scheduled_time) {
    return NextResponse.json({ error: '标题和预约时间不能为空' }, { status: 400 })
  }

  const { data, error } = await supabase.from('orders').insert({
    user_id: payload.id, title, description, location, scheduled_time, status: 'pending',
  }).select().single()

  if (error) return NextResponse.json({ error: `创建失败: ${error.message}` }, { status: 500 })

  await addAuditLog({
    table_name: 'orders', record_id: data.id, action: 'create',
    new_data: { title, description, location, scheduled_time }, performed_by: payload.id,
  })

  return NextResponse.json({ order: data })
}