import { NextRequest, NextResponse } from 'next/server'
import { supabase, verifyPassword, createToken } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()
    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 })
    }

    const { data, error } = await supabase.from('users')
      .select('*').eq('username', username).maybeSingle()

    if (error || !data) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    const valid = await verifyPassword(password, data.password_hash, data.password_salt)
    if (!valid) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    const token = createToken({ id: data.id, username: data.username, is_admin: data.is_admin })
    return NextResponse.json({
      token,
      user: {
        id: data.id, username: data.username, email: data.email, phone: data.phone,
        role: data.role, district: data.district, street: data.street, address: data.address,
        emergency_contact: data.emergency_contact, emergency_phone: data.emergency_phone,
        is_admin: data.is_admin, tags: data.tags, created_at: data.created_at,
      }
    })
  } catch (e: any) {
    return NextResponse.json({ error: `服务器错误: ${e.message}` }, { status: 500 })
  }
}