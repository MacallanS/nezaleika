export interface Category {
  id: number
  name: string
  parent_id: number | null
  is_active: boolean
  children?: Category[]
  created_at?: string
  updated_at?: string
}
