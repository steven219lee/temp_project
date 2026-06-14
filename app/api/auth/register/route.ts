import { NextRequest, NextResponse } from 'next/server'
import { supabase, hashPassword, verifyPassword, createToken, addAuditLog } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { username, password, email, phone, role, district, street, address, emergency_contact, emergency_phone } = await req.json()
    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 })
    }

    // 查重
    const { data: existing } = await supabase.from('users').select('id').eq('username', username).maybeSingle()
    if (existing) {
      return NextResponse.json({ error: '用户名已存在' }, { status: 400 })
    }

    const { hash, salt } = await hashPassword(password)
    const { data, error } = await supabase.from('users').insert({
      username, email, phone, role: role || 'user',
      district, street, address, emergency_contact, emergency_phone,
      password_hash: hash, password_salt: salt, is_admin: false,
    }).select().single()

    if (error) {
      return NextResponse.json({ error: `注册失败: ${error.message}` }, { status: 500 })
    }

    await addAuditLog({
      table_name: 'users', record_id: data.id, action: 'register',
      new_data: { username, email, phone, role }, performed_by: data.id,
    })

    const token = createToken({ id: data.id, username: data.username, is_admin: false })
    return NextResponse.json({
      token,
      user: { id: data.id, username: data.username, email: data.email, phone: data.phone,
        role: data.role, district: data.district, street: data.street, address: data.address,
        emergency_contact: data.emergency_contact, emergency_phone: data.emergency_phone,
        is_admin: false, created_at: data.created_at }
    })
  } catch (e: any) {
    return NextResponse.json({ error: `服务器错误: ${e.message}` }, { status: 500 })
  }
}