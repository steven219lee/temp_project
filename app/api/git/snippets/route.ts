import { NextRequest, NextResponse } from 'next/server'
import { supabase, verifyToken } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const payload = verifyToken(auth.replace('Bearer ', ''))
  if (!payload) return NextResponse.json({ error: 'token无效' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const lang = searchParams.get('lang')
  const mine = searchParams.get('mine')

  let query = supabase.from('git_snippets').select('*, users!inner(username)')
    .order('updated_at', { ascending: false })

  if (mine === '1') {
    query = query.eq('user_id', payload.id)
  } else {
    query = query.or(`is_public.eq.true,user_id.eq.${payload.id}`)
  }

  if (lang) query = query.eq('language', lang)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const snippets = data.map((s: any) => ({
    ...s,
    username: s.users?.username,
    users: undefined,
  }))

  return NextResponse.json({ snippets })
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const payload = verifyToken(auth.replace('Bearer ', ''))
  if (!payload) return NextResponse.json({ error: 'token无效' }, { status: 401 })

  const body = await req.json()
  const { title, description, language, code, tags, is_public } = body

  if (!title || !code) {
    return NextResponse.json({ error: '标题和代码不能为空' }, { status: 400 })
  }

  const { data, error } = await supabase.from('git_snippets').insert({
    user_id: payload.id,
    title,
    description,
    language: language || 'plaintext',
    code,
    tags: tags || null,
    is_public: is_public || false,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ snippet: data })
}