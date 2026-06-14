import { NextRequest, NextResponse } from 'next/server'
import { supabase, verifyToken } from '@/lib/supabase'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = req.headers.get('authorization')
  if (!auth) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const payload = verifyToken(auth.replace('Bearer ', ''))
  if (!payload) return NextResponse.json({ error: 'token无效' }, { status: 401 })

  const { data, error } = await supabase.from('git_snippets')
    .select('*, users!inner(username)')
    .eq('id', params.id).maybeSingle()

  if (error || !data) return NextResponse.json({ error: '片段不存在' }, { status: 404 })

  return NextResponse.json({
    snippet: { ...data, username: data.users?.username, users: undefined }
  })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = req.headers.get('authorization')
  if (!auth) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const payload = verifyToken(auth.replace('Bearer ', ''))
  if (!payload) return NextResponse.json({ error: 'token无效' }, { status: 401 })

  // 检查所有权
  const { data: existing } = await supabase.from('git_snippets')
    .select('user_id').eq('id', params.id).maybeSingle()
  if (!existing) return NextResponse.json({ error: '片段不存在' }, { status: 404 })
  if (existing.user_id !== payload.id && !payload.is_admin) {
    return NextResponse.json({ error: '无权修改' }, { status: 403 })
  }

  const body = await req.json()
  const { data, error } = await supabase.from('git_snippets')
    .update(body).eq('id', params.id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ snippet: data })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = req.headers.get('authorization')
  if (!auth) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const payload = verifyToken(auth.replace('Bearer ', ''))
  if (!payload) return NextResponse.json({ error: 'token无效' }, { status: 401 })

  const { data: existing } = await supabase.from('git_snippets')
    .select('user_id').eq('id', params.id).maybeSingle()
  if (!existing) return NextResponse.json({ error: '片段不存在' }, { status: 404 })
  if (existing.user_id !== payload.id && !payload.is_admin) {
    return NextResponse.json({ error: '无权删除' }, { status: 403 })
  }

  const { error } = await supabase.from('git_snippets').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}