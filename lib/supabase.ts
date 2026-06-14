import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Helper: password hashing (server-side only)
export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const { webcrypto } = await import('crypto')
  const salt = Array.from(webcrypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0')).join('')
  const encoder = new TextEncoder()
  const key = await webcrypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  )
  const bits = await webcrypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: 100000, hash: 'SHA-256' },
    key, 256
  )
  const hash = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('')
  return { hash, salt }
}

export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const { webcrypto } = await import('crypto')
  const encoder = new TextEncoder()
  const key = await webcrypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  )
  const bits = await webcrypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: 100000, hash: 'SHA-256' },
    key, 256
  )
  const computed = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('')
  return computed === hash
}

// Audit log helper
export async function addAuditLog(params: {
  table_name: string
  record_id: number
  action: string
  old_data?: any
  new_data?: any
  performed_by: number
}) {
  const { error } = await supabase.from('audit_logs').insert({
    table_name: params.table_name,
    record_id: params.record_id,
    action: params.action,
    old_data: params.old_data ? JSON.stringify(params.old_data) : null,
    new_data: params.new_data ? JSON.stringify(params.new_data) : null,
    performed_by: params.performed_by,
  })
  if (error) console.error('审计日志写入失败:', error)
}

// JWT helpers (simple token for demo)
import { createHash } from 'crypto'

const SECRET = process.env.JWT_SECRET || 'l6-jwt-secret-key-2024'

export function createToken(user: { id: number; username: string; is_admin: boolean }): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({
    id: user.id,
    username: user.username,
    is_admin: user.is_admin,
    exp: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days
  }))
  const signature = createHash('sha256').update(`${header}.${payload}.${SECRET}`).digest('hex')
  return `${header}.${payload}.${signature}`
}

export function verifyToken(token: string): any {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const signature = createHash('sha256').update(`${parts[0]}.${parts[1]}.${SECRET}`).digest('hex')
    if (signature !== parts[2]) return null
    const payload = JSON.parse(atob(parts[1]))
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch { return null }
}