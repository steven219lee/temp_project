-- =============================================
-- L6 禁用 RLS（因为使用自定义JWT认证，代码中已做权限校验）
-- 在 Supabase SQL Editor 中运行
-- =============================================

-- 禁用 orders 表的 RLS
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- 禁用 audit_logs 表的 RLS
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- 确保 users 表的 RLS 也禁用（L5可能已启用）
ALTER TABLE users DISABLE ROW LEVEL SECURITY;