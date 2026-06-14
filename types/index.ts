export type UserRole = 'user' | 'worker'

export interface User {
  id: number
  username: string
  email: string
  phone: string
  role: UserRole
  district: string
  street: string
  address: string
  emergency_contact: string
  emergency_phone: string
  is_admin: boolean
  tags?: string
  created_at: string
}

export interface Order {
  id: number
  user_id: number
  title: string
  description: string
  location: string
  scheduled_time: string
  status: 'pending' | 'accepted' | 'completed' | 'cancelled'
  assigned_to?: number
  accepted_at?: string
  rating?: number
  review?: string
  notes?: string
  notes_images?: string
  created_at: string
  updated_at: string
  // joined fields
  username?: string
  worker_name?: string
}

export interface AuditLog {
  id: number
  table_name: string
  record_id: number
  action: string
  old_data?: any
  new_data?: any
  performed_by: number
  created_at: string
}

// ========== Git 相关类型 ==========

export interface GitSnippet {
  id: number
  user_id: number
  title: string
  description?: string
  language: string
  code: string
  tags?: string
  is_public: boolean
  created_at: string
  updated_at: string
  username?: string
}

export interface GitRepo {
  id: number
  user_id: number
  name: string
  description?: string
  remote_url?: string
  local_path?: string
  branch: string
  status: string
  created_at: string
  updated_at: string
}

export interface GitRepoInfo {
  status: string
  branches: string[]
  currentBranch: string
  logs: GitLogEntry[]
  remotes: string[]
}

export interface GitLogEntry {
  hash: string
  author: string
  date: string
  message: string
}