'use client'

import { useState } from 'react'

interface TutorialSection {
  title: string
  content: string
  commands?: { cmd: string; desc: string }[]
}

const TUTORIALS: TutorialSection[] = [
  {
    title: 'Git 基础概念',
    content: 'Git 是一个分布式版本控制系统，用于跟踪文件变化和协调多人协作开发。以下是 Git 的核心概念：',
    commands: [
      { cmd: '工作区 (Working Directory)', desc: '你电脑上能看到的项目目录，存放实际文件' },
      { cmd: '暂存区 (Staging Area)', desc: '用 git add 将修改加入暂存区，准备提交' },
      { cmd: '本地仓库 (Local Repo)', desc: 'git commit 后，修改保存到本地仓库' },
      { cmd: '远程仓库 (Remote Repo)', desc: '如 GitHub/GitLab 上的仓库，用于协作' },
    ],
  },
  {
    title: '初始化与配置',
    content: 'Git 的基本配置和仓库初始化命令：',
    commands: [
      { cmd: 'git init', desc: '在当前目录初始化一个新的 Git 仓库' },
      { cmd: 'git config --global user.name "你的名字"', desc: '设置全局用户名' },
      { cmd: 'git config --global user.email "你的邮箱"', desc: '设置全局邮箱' },
      { cmd: 'git clone <url>', desc: '克隆远程仓库到本地' },
      { cmd: 'git remote add origin <url>', desc: '添加远程仓库地址' },
    ],
  },
  {
    title: '基本操作',
    content: '日常开发中最常用的 Git 命令：',
    commands: [
      { cmd: 'git status', desc: '查看工作区和暂存区的状态' },
      { cmd: 'git add <file>', desc: '将文件添加到暂存区' },
      { cmd: 'git add .', desc: '将所有修改添加到暂存区' },
      { cmd: 'git commit -m "message"', desc: '提交暂存区的修改并添加说明' },
      { cmd: 'git commit -am "message"', desc: '跳过 git add，直接提交所有已跟踪文件的修改' },
      { cmd: 'git push', desc: '推送本地提交到远程仓库' },
      { cmd: 'git pull', desc: '从远程仓库拉取并合并最新代码' },
      { cmd: 'git fetch', desc: '从远程仓库获取最新信息但不合并' },
    ],
  },
  {
    title: '分支管理',
    content: '分支是 Git 的核心特性，允许并行开发不同的功能：',
    commands: [
      { cmd: 'git branch', desc: '查看所有本地分支' },
      { cmd: 'git branch -a', desc: '查看所有分支（包括远程）' },
      { cmd: 'git branch <name>', desc: '创建一个新分支' },
      { cmd: 'git checkout <branch>', desc: '切换到指定分支' },
      { cmd: 'git checkout -b <branch>', desc: '创建并切换到新分支' },
      { cmd: 'git switch <branch>', desc: '切换到指定分支（Git 2.23+）' },
      { cmd: 'git merge <branch>', desc: '将指定分支合并到当前分支' },
      { cmd: 'git branch -d <branch>', desc: '删除本地分支' },
      { cmd: 'git push origin --delete <branch>', desc: '删除远程分支' },
    ],
  },
  {
    title: '查看历史',
    content: '查看提交历史和代码变更：',
    commands: [
      { cmd: 'git log', desc: '查看提交历史' },
      { cmd: 'git log --oneline', desc: '简洁模式查看提交历史' },
      { cmd: 'git log --graph --oneline', desc: '图形化展示分支合并历史' },
      { cmd: 'git log -p <file>', desc: '查看某个文件的修改历史' },
      { cmd: 'git diff', desc: '查看工作区与暂存区的差异' },
      { cmd: 'git diff --staged', desc: '查看暂存区与最新提交的差异' },
      { cmd: 'git show <commit>', desc: '查看某次提交的详细信息' },
      { cmd: 'git blame <file>', desc: '查看文件的每行是谁修改的' },
    ],
  },
  {
    title: '撤销与回退',
    content: '出错时使用的撤销和回退命令：',
    commands: [
      { cmd: 'git restore <file>', desc: '撤销工作区的修改（Git 2.23+）' },
      { cmd: 'git restore --staged <file>', desc: '取消暂存（从暂存区移除）' },
      { cmd: 'git reset --soft HEAD~1', desc: '撤销最近一次 commit，保留修改在暂存区' },
      { cmd: 'git reset --mixed HEAD~1', desc: '撤销 commit 和暂存，保留修改在工作区' },
      { cmd: 'git reset --hard HEAD~1', desc: '彻底撤销最近一次 commit 和修改（危险）' },
      { cmd: 'git revert <commit>', desc: '创建一个新提交来撤销某次提交（安全）' },
      { cmd: 'git stash', desc: '暂存当前工作区的修改' },
      { cmd: 'git stash pop', desc: '恢复最近一次 stash 的修改' },
    ],
  },
  {
    title: '标签管理',
    content: '用于标记发布版本等里程碑：',
    commands: [
      { cmd: 'git tag', desc: '查看所有标签' },
      { cmd: 'git tag <name>', desc: '创建一个轻量标签' },
      { cmd: 'git tag -a <name> -m "message"', desc: '创建附注标签' },
      { cmd: 'git push origin <tag>', desc: '推送标签到远程' },
      { cmd: 'git push origin --tags', desc: '推送所有标签到远程' },
      { cmd: 'git tag -d <name>', desc: '删除本地标签' },
    ],
  },
  {
    title: '高级技巧',
    content: '一些实用的 Git 进阶操作：',
    commands: [
      { cmd: 'git rebase <branch>', desc: '变基：将当前分支的提交重新应用到目标分支' },
      { cmd: 'git cherry-pick <commit>', desc: '将某次提交应用到当前分支' },
      { cmd: 'git bisect start', desc: '二分查找引入 bug 的提交' },
      { cmd: 'git reflog', desc: '查看所有 HEAD 的移动记录（恢复误删分支）' },
      { cmd: 'git archive --format=zip HEAD > archive.zip', desc: '打包当前代码为 zip' },
      { cmd: 'git clean -fd', desc: '删除未跟踪的文件和目录' },
      { cmd: 'git log --author="name"', desc: '查看某个作者的提交' },
      { cmd: 'git shortlog -sn', desc: '统计每个人的提交次数' },
    ],
  },
  {
    title: '.gitignore 文件',
    content: '忽略不需要版本控制的文件，常见配置：',
    commands: [
      { cmd: 'node_modules/', desc: '忽略 npm 依赖' },
      { cmd: '.env / .env.local', desc: '忽略环境变量文件' },
      { cmd: 'dist/ / build/', desc: '忽略构建输出' },
      { cmd: '*.log', desc: '忽略日志文件' },
      { cmd: '.DS_Store', desc: '忽略 macOS 系统文件' },
      { cmd: 'Thumbs.db', desc: '忽略 Windows 缩略图文件' },
      { cmd: '.next/', desc: '忽略 Next.js 构建目录' },
    ],
  },
]

export default function TutorialPage() {
  const [expanded, setExpanded] = useState<number | null>(0)
  const [search, setSearch] = useState('')

  const filtered = TUTORIALS.filter(s =>
    !search || s.title.includes(search) ||
    s.commands?.some(c => c.cmd.includes(search) || c.desc.includes(search))
  )

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Git 学习教程</h1>

      {/* 搜索 */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="搜索 Git 命令或概念..."
        className="w-full border rounded-lg px-4 py-2.5 mb-6 text-sm"
      />

      {/* 教程内容 */}
      <div className="space-y-3">
        {filtered.map((section, i) => (
          <div key={i} className="bg-white rounded-lg shadow overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition"
            >
              <h3 className="font-semibold text-lg">{section.title}</h3>
              <span className="text-gray-400 text-xl">{expanded === i ? '−' : '+'}</span>
            </button>
            {expanded === i && (
              <div className="px-6 pb-4 border-t">
                <p className="text-gray-600 mb-3 mt-3">{section.content}</p>
                {section.commands && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="py-2 pr-4 font-medium text-gray-500 w-2/5">命令</th>
                          <th className="py-2 font-medium text-gray-500">说明</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.commands.map((c, j) => (
                          <tr key={j} className="border-b last:border-0">
                            <td className="py-2 pr-4">
                              <code className="bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded text-xs font-mono break-all">
                                {c.cmd}
                              </code>
                            </td>
                            <td className="py-2 text-gray-600">{c.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          未找到匹配 "{search}" 的内容
        </div>
      )}
    </div>
  )
}