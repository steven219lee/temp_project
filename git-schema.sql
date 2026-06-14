-- =============================================
-- L6 Git功能 - Supabase 建表脚本
-- 在 Supabase SQL Editor 中运行
-- =============================================

-- 1. 代码片段表
CREATE TABLE IF NOT EXISTS git_snippets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  language TEXT NOT NULL DEFAULT 'plaintext',
  code TEXT NOT NULL,
  tags TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Git仓库表
CREATE TABLE IF NOT EXISTS git_repos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  remote_url TEXT,
  local_path TEXT,
  branch TEXT DEFAULT 'main',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 索引
CREATE INDEX IF NOT EXISTS idx_git_snippets_user_id ON git_snippets(user_id);
CREATE INDEX IF NOT EXISTS idx_git_snippets_language ON git_snippets(language);
CREATE INDEX IF NOT EXISTS idx_git_snippets_public ON git_snippets(is_public);
CREATE INDEX IF NOT EXISTS idx_git_repos_user_id ON git_repos(user_id);

-- 4. 自动更新 updated_at 触发器
DROP TRIGGER IF EXISTS update_git_snippets_updated_at ON git_snippets;
CREATE TRIGGER update_git_snippets_updated_at
  BEFORE UPDATE ON git_snippets FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_git_repos_updated_at ON git_repos;
CREATE TRIGGER update_git_repos_updated_at
  BEFORE UPDATE ON git_repos FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. 禁用 RLS
ALTER TABLE git_snippets DISABLE ROW LEVEL SECURITY;
ALTER TABLE git_repos DISABLE ROW LEVEL SECURITY;