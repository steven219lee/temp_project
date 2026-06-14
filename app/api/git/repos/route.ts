import { NextRequest, NextResponse } from 'next/server'
import { supabase, verifyToken } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const payload = verifyToken(auth.replace('Bearer ', ''))
  if (!payload) return NextResponse.json({ error: 'token无效' }, { status: 401 })

  const { data, error } = await supabase.from('git_repos')
    .select('*').eq('user_id', payload.id).order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ repos: data })
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const payload = verifyToken(auth.replace('Bearer ', ''))
  if (!payload) return NextResponse.json({ error: 'token无效' }, { status: 401 })

  const body = await req.json()
  const { name, description, remote_url, branch } = body

  if (!name) return NextResponse.json({ error: '仓库名不能为空' }, { status: 400 })

  const { data, error } = await supabase.from('git_repos').insert({
    user_id: payload.id,
    name,
    description: description || null,
    remote_url: remote_url || null,
    branch: branch || 'main',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ repo: data })
}