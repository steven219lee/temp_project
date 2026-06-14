import { NextRequest, NextResponse } from 'next/server'
import { supabase, verifyToken } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth) return NextResponse.json({ error: '未登录' }, { status: 401 })
  const payload = verifyToken(auth.replace('Bearer ', ''))
  if (!payload?.is_admin) return NextResponse.json({ error: '需要管理员权限' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const table = searchParams.get('table')
  const limit = parseInt(searchParams.get('limit') || '50')

  let query = supabase.from('audit_logs')
    .select('*, users!audit_logs_performed_by_fkey(username)')
    .order('created_at', { ascending: false }).limit(limit)

  if (table) query = query.eq('table_name', table)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ logs: data })
}