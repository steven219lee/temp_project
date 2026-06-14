import { NextRequest, NextResponse } from 'next/server'
import { supabase, verifyToken } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const payload = verifyToken(auth.replace('Bearer ', ''))
  if (!payload) return NextResponse.json({ error: 'token无效' }, { status: 401 })

  const { data, error } = await supabase.from('users')
    .select('id, username, email, phone, role, district, street, address, emergency_contact, emergency_phone, is_admin, tags, created_at')
    .eq('id', payload.id).maybeSingle()

  if (error || !data) return NextResponse.json({ error: '用户不存在' }, { status: 404 })
  return NextResponse.json({ user: data })
}