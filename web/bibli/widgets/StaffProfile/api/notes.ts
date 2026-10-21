import { requireAuthenticated } from '@/shared/auth/session/accessToken'
import { http } from '@/shared/api/http/http'

export interface StaffProfileNoteItem {
  id: number
  text: string
  created_at: string
  actor: {
    id: number | null
    name: string
    initials: string
    avatar?: string | null
  }
}

export async function fetchStaffNotes(
  id: number | string,
  limit = 100,
): Promise<{ items: StaffProfileNoteItem[]; total: number }> {
  requireAuthenticated()
  const response = await http.get(`/api/staff/registration/${id}/notes`, {
    headers: { Accept: 'application/json' },
    params: { limit },
    skipGlobalAuthHandler: true,
  })
  const data = response.data?.data
  const items = Array.isArray(data?.items) ? data.items : []
  const total = Number(data?.total)
  return {
    items,
    total: Number.isFinite(total) ? total : items.length,
  }
}

export async function createStaffNote(
  id: number | string,
  text: string,
): Promise<StaffProfileNoteItem> {
  requireAuthenticated()
  const response = await http.post(
    `/api/staff/registration/${id}/notes`,
    { text },
    {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    },
  )
  return response.data?.data
}

export async function deleteStaffNote(id: number | string, noteId: number): Promise<void> {
  requireAuthenticated()
  await http.delete(`/api/staff/registration/${id}/notes/${noteId}`, {
    headers: { Accept: 'application/json' },
  })
}

export async function fetchStaffLabelCatalog(): Promise<
  Array<{ id: number; name: string; color?: string | null }>
> {
  requireAuthenticated()
  const response = await http.get('/api/staff/registration/new/type', {
    headers: { Accept: 'application/json' },
    skipGlobalAuthHandler: true,
  })
  const data = response.data?.data
  return Array.isArray(data) ? data : []
}
