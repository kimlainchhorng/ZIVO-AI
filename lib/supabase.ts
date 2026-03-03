import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Project = {
  id: string
  user_id: string
  name: string
  prompt: string
  files: GeneratedFile[]
  created_at: string
  updated_at: string
}

export type GeneratedFile = {
  path: string
  content: string
  action: 'create' | 'update' | 'delete'
}
