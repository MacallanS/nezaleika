import { requireAuthenticated } from '@/shared/auth/session/accessToken'
import { http } from '@/shared/api/http/http'

export type StaffProfileHistoryActorRole = 'agent' | 'support' | 'system'

export type StaffProfileHistoryKind =
  | 'agent_submit'
  | 'agent_resubmit'
  | 'support_accept'
  | 'support_reject'
  | 'support_unaccept'
  | 'support_onec_start'
  | 'system_status'
  | 'system_onec_result'

export interface StaffProfileHistoryItem {
  id: number
  kind: StaffProfileHistoryKind | string
  actor_role: StaffProfileHistoryActorRole | string
  actor: {
    id: number | null
    name: string
    initials: string
    /** Код документа фото (file_agent_with_passport), если есть */
    avatar?: string | null
  }
  verb: string
  step: string | null
  step_label: string | null
  status_name: string | null
  target: string | null
  target_kind: string | null
  success: boolean | null
  created_at: string
  time_label: string
  message: string
}

export async function fetchStaffActivationHistory(
  id: number | string,
  limit = 100,
): Promise<StaffProfileHistoryItem[]> {
  requireAuthenticated()
  const response = await http.get(`/api/staff/registration/${id}/activation-history`, {
    headers: { Accept: 'application/json' },
    params: { limit },
    skipGlobalAuthHandler: true,
  })
  const items = response.data?.data?.items
  return Array.isArray(items) ? items : []
}

export async function unacceptStaffActivationStep(
  id: number | string,
  payload: { step: string },
) {
  requireAuthenticated()
  const response = await http.post(
    `/api/staff/registration/${id}/activation/unaccept`,
    { step: payload.step },
    {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    },
  )
  return response.data
}
