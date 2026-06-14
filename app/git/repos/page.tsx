'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { GitRepo } from '@/types'

export default function ReposPage() {
  const { token } = useAuth()
  const [repos, setRepos] = useState<GitRepo[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<GitRepo | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRepo, setSelectedRepo] = useState<GitRepo | null>(null)
  const [gitOutput, setGitOutput] = useState('')
  const [gitAction, setGitAction] = useState('status')
  const [customCmd, setCustomCmd] = useState('')
  const [running, setRunning] = useState(false)

  // 表单
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [remoteUrl, setRemoteUrl] = useState('')
  const [branch, setBranch] = useState('main')

  const fetchRepos = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/git/repos', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.repos) setRepos(data.repos)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { if (token) fetchRepos() }, [token])

  const resetForm = () => {
    setName('')
    setDescription('')
    setRemoteUrl('')
    setBranch('main')
    setEditing(null)
    setShowForm(false)
  }

  const openEdit = (r: GitRepo) => {
    setEditing(r)
    setName(r.name)
    setDescription(r.description || '')
    setRemoteUrl(r.remote_url || '')
    setBranch(r.branch)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = { name, description, remote_url: remoteUrl, branch }

    if (editing) {
      await fetch(`/api/git/repos/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
    } else {
      await fetch('/api/git/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
    }
    resetForm()
    fetchRepos()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确认删除此仓库记录？')) return
    await fetch(`/api/git/repos/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (selectedRepo?.id === id) { setSelectedRepo(null); setGitOutput('') }
    fetchRepos()
  }

  const runGitAction = async (repoId: number, action: string) => {
    setRunning(true)
    try {
      const res = await fetch(`/api/git/repos/${repoId}/info?action=${action}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setGitOutput(data.result || '无输出')
    } catch (e: any) {
      setGitOutput('执行失败: ' + e.message)
    }
    setRunning(false)
  }

  const runCustomCmd = async (repoId: number) => {
    if (!customCmd.trim()) return
    setRunning(true)
    try {
      const res = await fetch(`/api/git/repos/${repoId}/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ command: customCmd }),
      })
      const data = await res.json()
      setGitOutput(data.result || '无输出')
    } catch (e: any) {
      setGitOutput('执行失败: ' + e.message)
    }
    setRunning(false)
  }

  const selectRepo = (repo: GitRepo) => {
    setSelectedRepo(repo)
    setGitOutput('')
    setCustomCmd('')
  }

  const gitActions = [
    { key: 'status', label: '状态' },
    { key: 'log', label: '日志' },
    { key: 'branches', label: '分支' },
    { key: 'remotes', label: '远程' },
    { key: 'diff', label: '差异' },
    { key: 'pull', label: '拉取' },
    { key: 'push', label: '推送' },
    { key: 'clone', label: '克隆' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Git 仓库管理</h1>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm) }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? '取消' : '+ 添加仓库'}
        </button>
      </div>

      {/* 添加/编辑表单 */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6 space-y-4">
          <h3 className="font-semibold text-lg">{editing ? '编辑仓库' : '添加仓库'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">仓库名 *</label>
              <input value={name} onChange={e => setName(e.target.value)} required
                className="w-full border rounded px-3 py-2" placeholder="my-project" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">默认分支</label>
              <input value={branch} onChange={e => setBranch(e.target.value)}
                className="w-full border rounded px-3 py-2" placeholder="main" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">描述</label>
            <input value={description} onChange={e => setDescription(e.target.value)}
              className="w-full border rounded px-3 py-2" placeholder="仓库描述" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">远程地址</label>
            <input value={remoteUrl} onChange={e => setRemoteUrl(e.target.value)}
              className="w-full border rounded px-3 py-2 font-mono text-sm"
              placeholder="https://github.com/user/repo.git" />
          </div>
          <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
            {editing ? '保存修改' : '添加仓库'}
          </button>
        </form>
      )}

      {/* 仓库列表 */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">加载中...</div>
      ) : repos.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          暂无仓库记录，点击"添加仓库"开始
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* 仓库列表 */}
          <div className="lg:col-span-1 space-y-2">
            {repos.map(r => (
              <div
                key={r.id}
                onClick={() => selectRepo(r)}
                className={`bg-white rounded-lg shadow p-4 cursor-pointer border-2 transition
                  ${selectedRepo?.id === r.id ? 'border-blue-500' : 'border-transparent hover:border-gray-200'}`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{r.name}</h3>
                  <div className="flex gap-1">
                    <button onClick={e => { e.stopPropagation(); openEdit(r) }}
                      className="text-xs text-gray-500 hover:text-blue-600">编辑</button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(r.id) }}
                      className="text-xs text-red-500 hover:text-red-700">删除</button>
                  </div>
                </div>
                {r.description && <p className="text-sm text-gray-500 mt-1">{r.description}</p>}
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                  <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">{r.branch}</span>
                  {r.remote_url && <span className="truncate">{r.remote_url}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Git 操作面板 */}
          <div className="lg:col-span-2">
            {selectedRepo ? (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-4">操作仓库: {selectedRepo.name}</h3>

                {/* 快捷操作按钮 */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {gitActions.map(a => (
                    <button
                      key={a.key}
                      onClick={() => { setGitAction(a.key); runGitAction(selectedRepo.id, a.key) }}
                      disabled={running}
                      className={`px-3 py-1.5 rounded text-sm font-medium transition
                        ${gitAction === a.key ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>

                {/* 自定义命令 */}
                <div className="flex gap-2 mb-4">
                  <input
                    value={customCmd}
                    onChange={e => setCustomCmd(e.target.value)}
                    placeholder="输入自定义 git 命令，如: log --graph --oneline -10"
                    className="flex-1 border rounded px-3 py-2 font-mono text-sm"
                    onKeyDown={e => { if (e.key === 'Enter') runCustomCmd(selectedRepo.id) }}
                  />
                  <button
                    onClick={() => runCustomCmd(selectedRepo.id)}
                    disabled={running || !customCmd.trim()}
                    className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
                  >
                    执行
                  </button>
                </div>

                {/* 输出 */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-500">
                      输出: {gitAction}
                    </span>
                    {running && <span className="text-xs text-blue-500">执行中...</span>}
                  </div>
                  <pre className="bg-gray-900 text-green-400 rounded p-4 text-sm font-mono overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap">
                    {gitOutput || '点击上方按钮执行 Git 操作'}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-10 text-center text-gray-400">
                请选择一个仓库来执行 Git 操作
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}