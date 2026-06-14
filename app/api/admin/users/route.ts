import { NextRequest, NextResponse } from 'next/server'
import { supabase, verifyToken, hashPassword, addAuditLog } from '@/lib/supabase'

function requireAdmin(payload: any) {
  if (!payload?.is_admin) return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })
  return null
}

// 获取所有用户
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth) return NextResponse.json({ error: '未登录' }, { status: 401 })
  const payload = verifyToken(auth.replace('Bearer ', ''))
  const err = requireAdmin(payload); if (err) return err

  const { data, error } = await supabase.from('users')
    .select('id, username, email, phone, role, district, street, address, is_admin, tags, created_at')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ users: data })
}

// 修改用户 (重置密码/标注等)
export async function PATCH(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth) return NextResponse.json({ error: '未登录' }, { status: 401 })
  const payload = verifyToken(auth.replace('Bearer ', ''))
  const err = requireAdmin(payload); if (err) return err

  const { user_id, action, value } = await req.json()
  if (!user_id) return NextResponse.json({ error: '缺少用户ID' }, { status: 400 })

  const { data: old } = await supabase.from('users').select('*').eq('id', user_id).single()
  if (!old) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

  let updates: any = {}

  if (action === 'reset_password') {
    const { hash, salt } = await hashPassword(value || '123456')
    updates = { password_hash: hash, password_salt: salt }
  } else if (action === 'tag') {
    updates = { tags: value }
  } else if (action === 'set_role') {
    updates = { role: value }
  } else if (action === 'set_admin') {
    updates = { is_admin: value }
  } else {
    return NextResponse.json({ error: '未知操作' }, { status: 400 })
  }

  const { data, error } = await supabase.from('users').update(updates).eq('id', user_id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await addAuditLog({
    table_name: 'users', record_id: user_id, action: action,
    old_data: { username: old.username, role: old.role, is_admin: old.is_admin, tags: old.tags, email: old.email },
    new_data: { username: data.username, role: data.role, is_admin: data.is_admin, tags: data.tags, email: data.email },
    performed_by: payload.id,
  })

  return NextResponse.json({ success: true, user: data })
}