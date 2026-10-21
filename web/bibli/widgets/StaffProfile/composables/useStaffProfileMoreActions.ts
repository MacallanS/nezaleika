import { computed, onMounted, ref, watch, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'bibli/shared/ui'
import { useRoles } from '@/shared/composables'
import {
  ExtendAgentTest,
  GetAgentTest,
  GetSuggestAttachment,
  GrantAgentTest,
  RevokeAgentTest,
  type TraineeInfo,
} from '@/pages/agents/api'
import { useStaffHire } from './useStaffHire'
import {
  deleteStaffRegistration,
  moveToSigning,
  reOnboardAgent,
  isOnecResyncTimeoutError,
  resyncOnecCounterparty,
  unblockStaffRegistration,
} from '@/pages/onboarding/api'
import { humanizeOnecErrorMessage } from 'bibli/widgets/Onboarding/lib/onecSyncUtils'
import { getStaffProfileActionErrorMessage } from '../lib/staffProfileActionError'
import { resolveStaffProfileBack } from '../lib/staffProfileNavigation'
import {
  areAllActivationStepsAccepted,
  isOnecReadyForHire,
} from '../lib/staffProfileOverview'
import { canStaffResyncOnec, isStaffHiredAgent } from '../lib/staffProfileOnec'
import { resolveOnecResyncLabel } from '../lib/staffProfileProjects'
import type { StaffProfileModel } from './useStaffProfile'

export interface StaffProfileMoreMenuItem {
  label: string
  command?: () => void
}

export type StaffTraineeGrantPayload = {
  days: number
  project_id: number
  points_id?: number[]
  core_project_role?: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function readId(value: unknown): number | null {
  const id = Number(value)
  return Number.isFinite(id) && id > 0 ? id : null
}

export function useStaffProfileMoreActions(options: {
  profile: Ref<StaffProfileModel | null>
  from: Ref<string | null | undefined>
  reload: () => Promise<void>
}) {
  const toast = useToast()
  const router = useRouter()
  const { canManageTrainee, isSupportOrAdmin, isAdmin, isOnboardingReadOnly } = useRoles()

  const passwordChangeVisible = ref(false)
  const confirmVisible = ref(false)
  const confirmLoading = ref(false)
  const confirmMessage = ref('')
  const confirmAction = ref<null | (() => Promise<void>)>(null)
  const traineeInfo = ref<TraineeInfo | null>(null)
  const onecBusy = ref(false)
  const traineeBusy = ref(false)

  const registration = computed(() => options.profile.value?.rawRegistration ?? null)
  const staffData = computed(() => asRecord(options.profile.value?.rawStaffDetails?.data))

  // API /staff/registration/{id}/* и onec/resync ждут users.id (не registration.id).
  const userId = computed(
    () =>
      readId(registration.value?.user_id) ||
      options.profile.value?.id ||
      readId(staffData.value?.id) ||
      null,
  )

  function resolveProjectOnecBaseKey(): string | null {
    const fromReferal = asRecord(asRecord(registration.value?.referal)?.project)?.onec_base_key
    if (typeof fromReferal === 'string' && fromReferal.trim()) return fromReferal.trim()

    const attached = options.profile.value?.attached
    const attachedProject = asRecord(attached?.project)
    const fromAttached = attachedProject?.onec_base_key
    if (typeof fromAttached === 'string' && fromAttached.trim()) return fromAttached.trim()

    const projects = attached?.projects
    if (Array.isArray(projects)) {
      for (const row of projects) {
        const key = asRecord(row)?.onec_base_key
        if (typeof key === 'string' && key.trim()) return key.trim()
      }
    }
    return null
  }

  const isBlocked = computed(() => {
    const disabled = registration.value?.disabled ?? staffData.value?.disabled
    return Number(disabled) === 1 || disabled === true
  })

  const onSigning = computed(() => options.profile.value?.onSigning === true)
  const activationComplete = computed(() => options.profile.value?.activationComplete === true)
  const canResyncOnec = computed(() => {
    const profile = options.profile.value
    return profile ? canStaffResyncOnec(profile) : false
  })
  const allStepsAccepted = computed(() =>
    areAllActivationStepsAccepted(options.profile.value?.activationSteps),
  )
  const onecReadyForHire = computed(() => {
    const profile = options.profile.value
    return profile ? isOnecReadyForHire(profile) : false
  })
  const isTraineeActive = computed(() => traineeInfo.value?.active === true)
  const passwordLabel = computed(() => options.profile.value?.fullName || '')
  const isHiredAgent = computed(() => {
    const profile = options.profile.value
    return profile ? isStaffHiredAgent(profile) : false
  })

  function apiError(err: unknown, fallback: string) {
    return getStaffProfileActionErrorMessage(err, fallback)
  }

  function openConfirm(message: string, action: () => Promise<void>) {
    confirmMessage.value = message
    confirmAction.value = action
    confirmVisible.value = true
  }

  function closeConfirm() {
    if (confirmLoading.value) return
    confirmVisible.value = false
    confirmAction.value = null
  }

  async function submitConfirm() {
    if (!confirmAction.value) return
    confirmLoading.value = true
    try {
      await confirmAction.value()
      confirmVisible.value = false
      confirmAction.value = null
    } finally {
      confirmLoading.value = false
    }
  }

  async function loadTrainee() {
    const id = userId.value
    if (!canManageTrainee.value || !id) {
      traineeInfo.value = asRecord(registration.value?.trainee) as TraineeInfo | null
      return
    }
    try {
      traineeInfo.value = await GetAgentTest(id)
    } catch {
      traineeInfo.value = (asRecord(registration.value?.trainee) as TraineeInfo | null) ?? null
    }
  }

  async function handleChangePassword() {
    passwordChangeVisible.value = true
  }

  async function handleBlockOrUnblock() {
    const id = userId.value
    if (!id) return
    const blocked = isBlocked.value
    openConfirm(
      blocked
        ? 'Вы уверены, что хотите разблокировать этого сотрудника?'
        : 'Вы уверены, что хотите заблокировать этого сотрудника?',
      async () => {
        try {
          if (blocked) {
            await unblockStaffRegistration(id)
          } else {
            await deleteStaffRegistration(id)
          }
          toast.add({
            severity: 'success',
            summary: 'Успех',
            detail: blocked ? 'Сотрудник разблокирован' : 'Сотрудник заблокирован',
            life: 3000,
          })
          const back = resolveStaffProfileBack(options.from.value)
          await router.push(back.path)
        } catch (err) {
          toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: apiError(
              err,
              blocked ? 'Не удалось разблокировать сотрудника' : 'Не удалось заблокировать сотрудника',
            ),
            life: 4000,
          })
        }
      },
    )
  }

  async function handleGrantTrainee(payload?: StaffTraineeGrantPayload) {
    const id = userId.value
    if (!id) {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: 'Не найден идентификатор сотрудника',
        life: 4000,
      })
      return
    }
    if (traineeBusy.value) return
    traineeBusy.value = true
    try {
      await runGrantTrainee(id, payload)
    } finally {
      traineeBusy.value = false
    }
  }

  async function runGrantTrainee(id: number, payload?: StaffTraineeGrantPayload) {
    if (payload?.project_id) {
      try {
        const snapshot = await GrantAgentTest(id, {
          days: Math.max(1, Math.min(90, Number(payload.days) || 3)),
          project_id: payload.project_id,
          ...(payload.core_project_role
            ? { core_project_role: payload.core_project_role }
            : { points_id: payload.points_id ?? [] }),
        })
        traineeInfo.value = snapshot
        await options.reload()
        toast.add({
          severity: 'success',
          summary: 'Готово',
          detail:
            snapshot?.days_left != null
              ? `Тестовый период открыт на ${snapshot.days_left} дн.`
              : 'Тестовый период открыт',
          life: 3000,
        })
      } catch (err) {
        toast.add({
          severity: 'error',
          summary: 'Ошибка',
          detail: apiError(err, 'Не удалось открыть тестовый период'),
          life: 5000,
        })
      }
      return
    }

    let projectId = 0
    let pointIds: number[] = []
    let fieldRole: string | null = null

    const attached = asRecord(options.profile.value?.attached)
    const project = asRecord(attached?.project)
    projectId = readId(project?.id) || 0

    const points = attached?.points
    if (Array.isArray(points)) {
      pointIds = points.map((item) => readId(asRecord(item)?.id)).filter((value): value is number => value != null)
    }
    if (!pointIds.length) {
      const singlePoint = asRecord(attached?.point)
      const pointId = readId(singlePoint?.id)
      if (pointId) pointIds = [pointId]
    }

    try {
      const suggest = await GetSuggestAttachment(id)
      const projectsList = (suggest?.projects ?? []) as Array<{
        id: number
        core_field_roles?: string[]
      }>
      if (projectId) {
        const matched = projectsList.find((item) => Number(item.id) === Number(projectId))
        const roles = matched?.core_field_roles || []
        if (roles.length > 0) {
          fieldRole = roles.includes('promoter') ? 'promoter' : roles[0]
        }
      }
    } catch (err) {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: apiError(err, 'Не удалось определить привязку'),
        life: 5000,
      })
      return
    }

    if (!projectId || (!fieldRole && pointIds.length === 0)) {
      toast.add({
        severity: 'warn',
        summary: 'Нужна привязка',
        detail: 'Сначала привяжите проект и точку',
        life: 5000,
      })
      return
    }

    try {
      const snapshot = await GrantAgentTest(id, {
        days: 3,
        project_id: projectId,
        ...(fieldRole ? { core_project_role: fieldRole } : { points_id: pointIds }),
      })
      traineeInfo.value = snapshot
      await options.reload()
      toast.add({
        severity: 'success',
        summary: 'Готово',
        detail:
          snapshot?.days_left != null
            ? `Тестовый период открыт на ${snapshot.days_left} дн.`
            : 'Тестовый период открыт',
        life: 3000,
      })
    } catch (err) {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: apiError(err, 'Не удалось открыть тестовый период'),
        life: 5000,
      })
    }
  }

  async function handleExtendTrainee(days = 3) {
    const id = userId.value
    if (!id) {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: 'Не найден идентификатор сотрудника',
        life: 4000,
      })
      return
    }
    if (traineeBusy.value) return
    traineeBusy.value = true
    try {
      const snapshot = await ExtendAgentTest(id, Math.max(1, Math.min(90, Number(days) || 3)))
      traineeInfo.value = snapshot
      await options.reload()
      toast.add({
        severity: 'success',
        summary: 'Готово',
        detail:
          snapshot?.days_left != null
            ? `Стажировка продлена — осталось ${snapshot.days_left} дн.`
            : 'Стажировка продлена',
        life: 3000,
      })
    } catch (err) {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: apiError(err, 'Не удалось продлить'),
        life: 5000,
      })
    } finally {
      traineeBusy.value = false
    }
  }

  async function handleRevokeTrainee() {
    const id = userId.value
    if (!id) {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: 'Не найден идентификатор сотрудника',
        life: 4000,
      })
      return
    }
    if (!isAdmin.value) {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: 'Удалить тестовый доступ может только администратор',
        life: 4000,
      })
      return
    }
    openConfirm('Удалить тестовый доступ у этого сотрудника?', async () => {
      if (traineeBusy.value) return
      traineeBusy.value = true
      try {
        const snapshot = await RevokeAgentTest(id)
        traineeInfo.value = snapshot
        await options.reload()
        toast.add({
          severity: 'success',
          summary: 'Готово',
          detail: 'Тестовый доступ удалён',
          life: 3000,
        })
      } catch (err) {
        toast.add({
          severity: 'error',
          summary: 'Ошибка',
          detail: apiError(err, 'Не удалось удалить тестовый доступ'),
          life: 5000,
        })
      } finally {
        traineeBusy.value = false
      }
    })
  }

  async function handleResyncOnec() {
    const id = userId.value
    if (!id) {
      toast.add({
        severity: 'error',
        summary: '1С',
        detail: 'Не найден идентификатор сотрудника',
        life: 4000,
      })
      return
    }
    if (onecBusy.value) return
    if (!activationComplete.value) {
      toast.add({
        severity: 'warn',
        summary: '1С',
        detail: 'Сначала заполните все данные агента',
        life: 5000,
      })
      return
    }
    if (!resolveProjectOnecBaseKey()) {
      toast.add({
        severity: 'error',
        summary: '1С',
        detail: 'У проекта не настроена база 1С. Настройте базу 1С в карточке проекта.',
        life: 7000,
      })
      return
    }
    onecBusy.value = true
    toast.add({
      severity: 'info',
      summary: '1С',
      detail: 'Выгрузка в 1С запущена',
      life: 4000,
    })
    try {
      await resyncOnecCounterparty(id)
    } catch (err) {
      if (!isOnecResyncTimeoutError(err)) {
        toast.add({
          severity: 'error',
          summary: '1С',
          detail:
            humanizeOnecErrorMessage(apiError(err, '')) ||
            apiError(err, 'Не удалось синхронизировать с 1С'),
          life: 8000,
        })
      }
    } finally {
      onecBusy.value = false
      await options.reload()
    }
  }

  async function handleMoveToSigning() {
    const id = userId.value
    if (!id) return
    if (!allStepsAccepted.value) {
      toast.add({
        severity: 'warn',
        summary: 'Подписание',
        detail: 'Сначала примите все разделы анкеты',
        life: 5000,
      })
      return
    }
    try {
      await moveToSigning(id)
      await options.reload()
      toast.add({
        severity: 'success',
        summary: 'Успех',
        detail: 'Пользователь перенесён на подписание',
        life: 3000,
      })
    } catch (err) {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: apiError(err, 'Ошибка при переносе на подписание'),
        life: 5000,
      })
    }
  }

  async function handleReOnboard() {
    const id = userId.value
    if (!id) return
    openConfirm(
      'Перенести агента на оформление? Роль станет как у нового пользователя, документы сбросятся, точки снимутся. Выдадим тестовый доступ на 3 дня. История смен сохранится.',
      async () => {
        try {
          const result = await reOnboardAgent(id)
          await options.reload()
          await loadTrainee()
          const payload = (result as { data?: { trainee_granted?: boolean } } | null)?.data
          const granted = payload?.trainee_granted !== false
          toast.add({
            severity: granted ? 'success' : 'warn',
            summary: 'Готово',
            detail: granted
              ? 'Агент перенесён на оформление, тестовый доступ на 3 дня'
              : 'Агент перенесён на оформление. Тестовый доступ не выдан — выдайте вручную на вкладке «Проекты»',
            life: 5000,
          })
        } catch (err) {
          toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: apiError(err, 'Не удалось перенести на оформление'),
            life: 6000,
          })
        }
      },
    )
  }

  const hire = useStaffHire({
    profile: options.profile,
    reload: options.reload,
  })

  async function handleHirePermanent() {
    if (!userId.value) return
    if (!onecReadyForHire.value) {
      toast.add({
        severity: 'warn',
        summary: '1С',
        detail: 'Сначала успешно выгрузите данные в 1С',
        life: 5000,
      })
      return
    }
    await hire.open('hire')
  }

  async function handleChangeRole() {
    if (!userId.value) return
    await hire.open('role')
  }

  const onecResyncLabel = computed(() => {
    const status = asRecord(registration.value?.onec_sync_status)?.status
    return resolveOnecResyncLabel(typeof status === 'string' ? status : null)
  })

  const moreItems = computed<StaffProfileMoreMenuItem[]>(() => {
    if (isOnboardingReadOnly.value) {
      return []
    }

    const items: StaffProfileMoreMenuItem[] = []

    if (isSupportOrAdmin.value && userId.value) {
      items.push({ label: 'Сменить пароль', command: () => void handleChangePassword() })
      if (!isBlocked.value) {
        items.push({ label: 'Сменить роль', command: () => void handleChangeRole() })
      }
    }

    items.push({
      label: isBlocked.value ? 'Разблокировать' : 'Заблокировать',
      command: () => void handleBlockOrUnblock(),
    })

    if (!isBlocked.value) {
      if (isSupportOrAdmin.value && isHiredAgent.value && userId.value) {
        items.push({
          label: 'Перенести на оформление',
          command: () => void handleReOnboard(),
        })
      }

      if (canResyncOnec.value) {
        items.push({
          label: onecResyncLabel.value,
          command: () => void handleResyncOnec(),
        })
      }

      if (!onSigning.value && allStepsAccepted.value) {
        items.push({
          label: 'Перенести на подписание',
          command: () => void handleMoveToSigning(),
        })
      }

      if (onSigning.value && onecReadyForHire.value) {
        items.push({
          label: 'Принять на работу',
          command: () => void handleHirePermanent(),
        })
      }

      if (isAdmin.value && isTraineeActive.value && userId.value) {
        items.push({
          label: 'Удалить тестовый доступ',
          command: () => void handleRevokeTrainee(),
        })
      }
    }

    return items
  })

  watch(
    () => options.profile.value?.id,
    () => {
      void loadTrainee()
    },
  )

  onMounted(() => {
    void loadTrainee()
  })

  return {
    moreItems,
    moveToSigning: handleMoveToSigning,
    passwordChangeVisible,
    passwordLabel,
    passwordUserId: userId,
    confirmVisible,
    confirmLoading,
    confirmMessage,
    closeConfirm,
    submitConfirm,
    handleGrantTrainee,
    handleExtendTrainee,
    handleRevokeTrainee,
    handleHirePermanent,
    handleResyncOnec,
    onecBusy,
    traineeBusy,
    hire,
  }
}
