import { NextRequest, NextResponse } from 'next/server'
import { supabase, verifyToken } from '@/lib/supabase'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'

const execAsync = promisify(exec)

// 在指定目录执行 git 命令
async function gitExec(dir: string, cmd: string): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(`git ${cmd}`, { cwd: dir })
    return stdout || stderr
  } catch (e: any) {
    return e.stderr || e.message || '命令执行失败'
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = req.headers.get('authorization')
  if (!auth) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const payload = verifyToken(auth.replace('Bearer ', ''))
  if (!payload) return NextResponse.json({ error: 'token无效' }, { status: 401 })

  const { data: repo, error } = await supabase.from('git_repos')
    .select('*').eq('id', params.id).eq('user_id', payload.id).maybeSingle()

  if (error || !repo) return NextResponse.json({ error: '仓库不存在' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action') || 'status'

  // 确定工作目录
  let workDir = repo.local_path
  if (!workDir || !fs.existsSync(workDir)) {
    // 默认使用 L6 目录
    workDir = path.join(process.cwd())
  }

  let result = ''

  switch (action) {
    case 'status':
      result = await gitExec(workDir, 'status --short')
      break
    case 'log':
      const limit = searchParams.get('limit') || '20'
      result = await gitExec(workDir, `log --oneline -${limit}`)
      break
    case 'branches':
      result = await gitExec(workDir, 'branch -a')
      break
    case 'remotes':
      result = await gitExec(workDir, 'remote -v')
      break
    case 'diff':
      result = await gitExec(workDir, 'diff --stat')
      break
    case 'pull':
      result = await gitExec(workDir, `pull ${repo.remote_url || 'origin'} ${repo.branch || 'main'}`)
      break
    case 'push':
      result = await gitExec(workDir, `push ${repo.remote_url || 'origin'} ${repo.branch || 'main'}`)
      break
    case 'clone':
      if (repo.remote_url) {
        const cloneDir = path.join(process.cwd(), '..', repo.name)
        if (!fs.existsSync(cloneDir)) {
          result = await gitExec(path.join(process.cwd(), '..'), `clone ${repo.remote_url} ${repo.name}`)
          // 更新 local_path
          await supabase.from('git_repos').update({ local_path: cloneDir }).eq('id', params.id)
        } else {
          result = '目录已存在，跳过克隆'
        }
      } else {
        result = '未设置远程仓库地址'
      }
      break
    default:
      result = '未知操作'
  }

  return NextResponse.json({ action, result })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = req.headers.get('authorization')
  if (!auth) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const payload = verifyToken(auth.replace('Bearer ', ''))
  if (!payload) return NextResponse.json({ error: 'token无效' }, { status: 401 })

  const { data: repo } = await supabase.from('git_repos')
    .select('*').eq('id', params.id).eq('user_id', payload.id).maybeSingle()

  if (!repo) return NextResponse.json({ error: '仓库不存在' }, { status: 404 })

  const body = await req.json()
  const { command } = body

  let workDir = repo.local_path || process.cwd()
  if (!fs.existsSync(workDir)) workDir = process.cwd()

  const result = await gitExec(workDir, command)
  return NextResponse.json({ command, result })
}