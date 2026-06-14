'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { GitSnippet } from '@/types'

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'sql', label: 'SQL' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'bash', label: 'Bash' },
  { value: 'plaintext', label: '纯文本' },
]

export default function SnippetsPage() {
  const { token } = useAuth()
  const [snippets, setSnippets] = useState<GitSnippet[]>([])
  const [filterLang, setFilterLang] = useState('')
  const [filterMine, setFilterMine] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<GitSnippet | null>(null)
  const [loading, setLoading] = useState(true)

  // 表单状态
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [code, setCode] = useState('')
  const [tags, setTags] = useState('')
  const [isPublic, setIsPublic] = useState(false)

  const fetchSnippets = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterLang) params.set('lang', filterLang)
    if (filterMine) params.set('mine', '1')
    try {
      const res = await fetch(`/api/git/snippets?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.snippets) setSnippets(data.snippets)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { if (token) fetchSnippets() }, [token, filterLang, filterMine])

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setLanguage('javascript')
    setCode('')
    setTags('')
    setIsPublic(false)
    setEditing(null)
    setShowForm(false)
  }

  const openEdit = (s: GitSnippet) => {
    setEditing(s)
    setTitle(s.title)
    setDescription(s.description || '')
    setLanguage(s.language)
    setCode(s.code)
    setTags(s.tags || '')
    setIsPublic(s.is_public)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = { title, description, language, code, tags, is_public: isPublic }

    if (editing) {
      await fetch(`/api/git/snippets/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
    } else {
      await fetch('/api/git/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
    }
    resetForm()
    fetchSnippets()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确认删除这个代码片段？')) return
    await fetch(`/api/git/snippets/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    fetchSnippets()
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    alert('已复制到剪贴板')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">代码片段管理</h1>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm) }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? '取消' : '+ 新建片段'}
        </button>
      </div>

      {/* 筛选栏 */}
      <div className="flex gap-4 mb-4">
        <select
          value={filterLang}
          onChange={e => setFilterLang(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm"
        >
          <option value="">所有语言</option>
          {LANGUAGES.map(l => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={filterMine} onChange={e => setFilterMine(e.target.checked)} />
          只看我的
        </label>
      </div>

      {/* 新建/编辑表单 */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6 space-y-4">
          <h3 className="font-semibold text-lg">{editing ? '编辑片段' : '新建片段'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">标题 *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} required
                className="w-full border rounded px-3 py-2" placeholder="片段标题" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">语言</label>
              <select value={language} onChange={e => setLanguage(e.target.value)}
                className="w-full border rounded px-3 py-2">
                {LANGUAGES.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">描述</label>
            <input value={description} onChange={e => setDescription(e.target.value)}
              className="w-full border rounded px-3 py-2" placeholder="简短描述" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">代码 *</label>
            <textarea value={code} onChange={e => setCode(e.target.value)} required rows={8}
              className="w-full border rounded px-3 py-2 font-mono text-sm"
              placeholder="粘贴你的代码..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">标签（逗号分隔）</label>
              <input value={tags} onChange={e => setTags(e.target.value)}
                className="w-full border rounded px-3 py-2" placeholder="git, commit, push" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} />
                <span className="text-sm">公开此片段</span>
              </label>
            </div>
          </div>
          <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
            {editing ? '保存修改' : '创建片段'}
          </button>
        </form>
      )}

      {/* 片段列表 */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">加载中...</div>
      ) : snippets.length === 0 ? (
        <div className="text-center py-10 text-gray-400">暂无代码片段</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {snippets.map(s => (
            <div key={s.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{s.language}</span>
                    <span>by {s.username}</span>
                    {s.is_public ? <span className="text-green-600">公开</span> : <span className="text-orange-500">私有</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => copyCode(s.code)}
                    className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1">复制</button>
                  <button onClick={() => openEdit(s)}
                    className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1">编辑</button>
                  <button onClick={() => handleDelete(s.id)}
                    className="text-xs text-red-500 hover:text-red-700 px-2 py-1">删除</button>
                </div>
              </div>
              {s.description && <p className="text-sm text-gray-600 mb-2">{s.description}</p>}
              {s.tags && (
                <div className="flex gap-1 flex-wrap mb-2">
                  {s.tags.split(',').map(t => (
                    <span key={t} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{t.trim()}</span>
                  ))}
                </div>
              )}
              <pre className="bg-gray-900 text-green-400 rounded p-3 text-xs overflow-x-auto max-h-40">
                <code>{s.code.substring(0, 300)}{s.code.length > 300 ? '...' : ''}</code>
              </pre>
              <div className="text-xs text-gray-400 mt-2">
                更新于 {new Date(s.updated_at).toLocaleString('zh-CN')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}