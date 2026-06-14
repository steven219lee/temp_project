import { NextRequest, NextResponse } from 'next/server'
import { supabase, verifyToken } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth) return NextResponse.json({ error: '未登录' }, { status: 401 })
  const payload = verifyToken(auth.replace('Bearer ', ''))
  if (!payload?.is_admin) return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  let query = supabase
    .from('orders')
    .select('*, creator:users!orders_user_id_fkey(username), worker:users!orders_assigned_to_fkey(username)')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const orderIds = (data || []).map(order => order.id)
  if (orderIds.length === 0) return NextResponse.json({ orders: data })

  const { data: acceptLogs } = await supabase
    .from('audit_logs')
    .select('record_id, created_at')
    .eq('table_name', 'orders')
    .eq('action', 'accept')
    .in('record_id', orderIds)
    .order('created_at', { ascending: true })

  const acceptedLogByOrder = new Map<number, string>()
  for (const log of acceptLogs || []) {
    if (!acceptedLogByOrder.has(log.record_id)) {
      acceptedLogByOrder.set(log.record_id, log.created_at)
    }
  }

  const orders = (data || []).map(order => ({
    ...order,
    accepted_log_at: acceptedLogByOrder.get(order.id) || null,
  }))

  return NextResponse.json({ orders })
}
