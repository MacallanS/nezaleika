import { computed, ref, type Ref } from 'vue'
import { useToast } from 'bibli/shared/ui'
import { fetchRoles } from '@/pages/agents/api'
import { updateStaffRole } from '@/pages/onboarding/api'
import { fetchPointsAPI, fetchProjectsLightAPI } from '@/shared/api'
import { getStaffProfileActionErrorMessage } from '../lib/staffProfileActionError'
import {
  buildFieldRoleOptions,
  buildHirePrefill,
  buildHireRoleOptions,
  filterProjectsForFieldRole,
  findAgentRoleId,
  getReferalPointName,
  parseFieldRoleSelection,
  roleNeedsPoints,
  roleNeedsProject,
  type HireProject,
  type HireSystemRole,
} from '../lib/staffHire'
import type { StaffProfileModel } from './useStaffProfile'

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function readId(value: unknown): number | null {
  const id = Number(value)
  return Number.isFinite(id) && id > 0 ? id : null
}

export function useStaffHire(options: {
  profile: Ref<StaffProfileModel | null>
  reload: () => Promise<void>
}) {
  const toast = useToast()

  const visible = ref(false)
  const modalLoading = ref(false)
  const submitting = ref(false)

  const roles = ref<HireSystemRole[]>([])
  const projects = ref<HireProject[]>([])
  const projectPoints = ref<Array<{ id: string | number; name: string }>>([])

  const hireRoleSelection = ref('')
  const projectId = ref('')
  const pointIds = ref<string[]>([])
  const fieldRolesOnly = ref(false)
  const purpose = ref<'hire' | 'role'>('hire')

  const selectedFieldRole = computed(() => parseFieldRoleSelection(hireRoleSelection.value))

  const hireRoleOptions = computed(() =>
    buildHireRoleOptions({
      roles: roles.value,
      projects: projects.value,
      fieldRolesOnly: fieldRolesOnly.value,
    }),
  )

  const projectOptions = computed(() =>
    filterProjectsForFieldRole(projects.value, selectedFieldRole.value),
  )

  const showProjectSelection = computed(() =>
    roleNeedsProject(roles.value, hireRoleSelection.value),
  )

  const showPointSelection = computed(() =>
    roleNeedsPoints(roles.value, hireRoleSelection.value),
  )

  const canSubmit = computed(() => {
    if (!hireRoleSelection.value || submitting.value || modalLoading.value) return false
    if (showProjectSelection.value && !projectId.value) return false
    if (showPointSelection.value && pointIds.value.length === 0) return false
    if (selectedFieldRole.value && !findAgentRoleId(roles.value)) return false
    return true
  })

  function registrationRecord() {
    return asRecord(options.profile.value?.rawRegistration)
  }

  function resolveApiUserId(): number | null {
    const reg = registrationRecord()
    return (
      readId(reg?.user_id) ||
      options.profile.value?.id ||
      readId(asRecord(options.profile.value?.rawStaffDetails?.data)?.id) ||
      null
    )
  }

  async function loadPointsForProject(pid: string, preferPointIds: string[] = []) {
    projectPoints.value = []
    if (!pid || !showPointSelection.value) return
    try {
      const resp = await fetchPointsAPI(Number(pid))
      const list = (resp?.data || []) as Array<{ id: number | string; name: string }>
      projectPoints.value = list.map((p) => ({ id: p.id, name: p.name }))

      const referal = asRecord(registrationRecord()?.referal) as Parameters<
        typeof getReferalPointName
      >[0]
      for (const pointId of preferPointIds) {
        const exists = projectPoints.value.some((p) => String(p.id) === String(pointId))
        if (!exists) {
          projectPoints.value = [
            ...projectPoints.value,
            { id: pointId, name: getReferalPointName(referal) },
          ]
        }
      }
    } catch {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: 'Не удалось загрузить точки проекта',
        life: 4000,
      })
    }
  }

  async function open(nextPurpose: 'hire' | 'role' = 'hire') {
    const profile = options.profile.value
    const userId = resolveApiUserId()
    if (!profile || !userId) {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: 'Не найден идентификатор сотрудника',
        life: 4000,
      })
      return
    }

    purpose.value = nextPurpose
    visible.value = true
    modalLoading.value = true
    hireRoleSelection.value = ''
    projectId.value = ''
    pointIds.value = []
    projectPoints.value = []
    fieldRolesOnly.value = false
    roles.value = []
    projects.value = []

    try {
      const [rolesList, projectsResp] = await Promise.all([
        fetchRoles(),
        fetchProjectsLightAPI(),
      ])
      roles.value = Array.isArray(rolesList) ? rolesList : []
      const projectsData = projectsResp as { status?: boolean; data?: HireProject[] }
      projects.value = projectsData?.status ? projectsData.data || [] : []

      const referal = (registrationRecord()?.referal ?? null) as Parameters<
        typeof buildHirePrefill
      >[0]['referal']
      const prefill = buildHirePrefill({
        referal,
        roles: roles.value,
        projects: projects.value,
      })

      fieldRolesOnly.value = prefill.fieldRolesOnly
      hireRoleSelection.value = prefill.roleSelection
      projectId.value = prefill.projectId
      pointIds.value = prefill.pointIds

      if (prefill.projectId && roleNeedsPoints(roles.value, hireRoleSelection.value)) {
        await loadPointsForProject(prefill.projectId, prefill.pointIds)
      } else if (selectedFieldRole.value) {
        const opts = projectOptions.value
        if (!projectId.value && opts.length === 1) {
          projectId.value = String(opts[0].id)
        }
      }
    } catch (err) {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: getStaffProfileActionErrorMessage(err) || 'Не удалось открыть форму найма',
        life: 5000,
      })
      visible.value = false
    } finally {
      modalLoading.value = false
    }
  }

  function close() {
    visible.value = false
    modalLoading.value = false
    submitting.value = false
    hireRoleSelection.value = ''
    projectId.value = ''
    pointIds.value = []
    projectPoints.value = []
    fieldRolesOnly.value = false
  }

  async function handleRoleChange() {
    pointIds.value = []
    const fieldRole = parseFieldRoleSelection(hireRoleSelection.value)
    if (fieldRole) {
      const opts = projectOptions.value
      if (
        projectId.value &&
        !opts.some((p) => String(p.id) === String(projectId.value))
      ) {
        projectId.value = ''
      }
      if (!projectId.value && opts.length === 1) {
        projectId.value = String(opts[0].id)
      }
      projectPoints.value = []
      return
    }
    if (projectId.value && roleNeedsPoints(roles.value, hireRoleSelection.value)) {
      await loadPointsForProject(projectId.value, pointIds.value)
    } else {
      projectPoints.value = []
      pointIds.value = []
    }
  }

  async function handleProjectChange() {
    pointIds.value = []
    if (projectId.value && showPointSelection.value) {
      await loadPointsForProject(projectId.value)
    } else {
      projectPoints.value = []
    }
  }

  async function confirm() {
    const userId = resolveApiUserId()
    if (!userId || !canSubmit.value) return

    const fieldRole = parseFieldRoleSelection(hireRoleSelection.value)
    const agentRoleId = findAgentRoleId(roles.value)
    if (fieldRole && !agentRoleId) {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: 'Не найдена системная роль «Агент» для складского найма',
        life: 5000,
      })
      return
    }

    submitting.value = true
    try {
      await updateStaffRole(userId, {
        user_id: String(userId),
        role_id: fieldRole ? String(agentRoleId) : String(hireRoleSelection.value),
        project_id: showProjectSelection.value ? projectId.value || undefined : undefined,
        point_id: fieldRole ? undefined : pointIds.value.length ? pointIds.value : undefined,
        core_project_role: fieldRole || undefined,
      })
      await options.reload()
      toast.add({
        severity: 'success',
        summary: 'Готово',
        detail: purpose.value === 'role' ? 'Роль пользователя изменена' : 'Сотрудник принят на работу',
        life: 3000,
      })
      close()
    } catch (err) {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: getStaffProfileActionErrorMessage(err) || 'Не удалось принять на работу',
        life: 5000,
      })
    } finally {
      submitting.value = false
    }
  }

  return {
    visible,
    modalLoading,
    submitting,
    hireRoleSelection,
    projectId,
    pointIds,
    projectPoints,
    hireRoleOptions,
    projectOptions,
    showProjectSelection,
    showPointSelection,
    selectedFieldRole,
    fieldRoleOptions: computed(() => buildFieldRoleOptions(projects.value)),
    canSubmit,
    open,
    close,
    confirm,
    handleRoleChange,
    handleProjectChange,
  }
}
