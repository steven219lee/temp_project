import { NextRequest, NextResponse } from 'next/server'
import { supabase, verifyToken, addAuditLog } from '@/lib/supabase'

// 获取单个订单
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = req.headers.get('authorization')
  if (!auth) return NextResponse.json({ error: '未登录' }, { status: 401 })
  const payload = verifyToken(auth.replace('Bearer ', ''))
  if (!payload) return NextResponse.json({ error: 'token无效' }, { status: 401 })

  const { data, error } = await supabase.from('orders')
    .select('*, users!orders_user_id_fkey(username), worker:users!orders_assigned_to_fkey(username)')
    .eq('id', params.id).single()

  if (error) return NextResponse.json({ error: '订单不存在' }, { status: 404 })
  return NextResponse.json({ order: data })
}

// 更新订单（接单/撤单/评价等）
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = req.headers.get('authorization')
  if (!auth) return NextResponse.json({ error: '未登录' }, { status: 401 })
  const payload = verifyToken(auth.replace('Bearer ', ''))
  if (!payload) return NextResponse.json({ error: 'token无效' }, { status: 401 })

  const { action, ...fields } = await req.json()
  const orderId = parseInt(params.id)

  const { data: old } = await supabase.from('orders').select('*').eq('id', orderId).single()
  if (!old) return NextResponse.json({ error: '订单不存在' }, { status: 404 })

  let updates: any = {}

  if (action === 'accept') {
    if (old.status !== 'pending') return NextResponse.json({ error: '订单状态不允许接单' }, { status: 400 })
    updates = { status: 'accepted', assigned_to: payload.id }
  } else if (action === 'cancel') {
    if (old.user_id !== payload.id) return NextResponse.json({ error: '只能撤销自己的订单' }, { status: 403 })
    updates = { status: 'cancelled' }
  } else if (action === 'complete') {
    updates = { status: 'completed', ...fields }
  } else if (action === 'rate') {
    updates = { rating: fields.rating, review: fields.review }
  } else if (action === 'notes') {
    updates = { notes: fields.notes }
    if (fields.notes_images !== undefined) updates.notes_images = fields.notes_images
  } else {
    return NextResponse.json({ error: '未知操作' }, { status: 400 })
  }

  const { data, error } = await supabase.from('orders').update(updates).eq('id', orderId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await addAuditLog({
    table_name: 'orders', record_id: orderId, action: action,
    old_data: old, new_data: data, performed_by: payload.id,
  })

  return NextResponse.json({ order: data })
}
