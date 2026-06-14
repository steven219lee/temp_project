import { NextRequest, NextResponse } from 'next/server'
import { supabase, verifyToken, addAuditLog } from '@/lib/supabase'

export async function PATCH(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const payload = verifyToken(auth.replace('Bearer ', ''))
  if (!payload) return NextResponse.json({ error: 'token无效' }, { status: 401 })

  const body = await req.json()

  // 只允许更新以下字段
  const allowedFields = [
    'phone', 'email', 'district', 'street',
    'address', 'emergency_contact', 'emergency_phone',
  ]
  const updates: Record<string, string> = {}
  for (const f of allowedFields) {
    if (body[f] !== undefined) updates[f] = body[f]
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: '没有可更新的字段' }, { status: 400 })
  }

  const { data: old } = await supabase.from('users').select('*').eq('id', payload.id).single()
  if (!old) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

  const { data, error } = await supabase.from('users')
    .update(updates)
    .eq('id', payload.id)
    .select('id, username, email, phone, role, district, street, address, emergency_contact, emergency_phone, is_admin, tags, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await addAuditLog({
    table_name: 'users', record_id: payload.id, action: 'profile_update',
    old_data: { username: old.username, role: old.role, email: old.email, phone: old.phone },
    new_data: { username: data.username, role: data.role, email: data.email, phone: data.phone },
    performed_by: payload.id,
  })

  return NextResponse.json({ success: true, user: data })
}
