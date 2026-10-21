import { reactive, ref } from 'vue'
import {
  EMPTY_ACTIVATION_STATUSES,
  normalizeActivationSteps,
  type ActivationStepId,
  type ActivationStepStatus,
  type ActivationStepsMap,
} from './activationSteps'

/**
 * Общий стейт статусов хаба.
 * Страница /profile в keepalive, а сам хаб грузится через async+Suspense —
 * onActivated у виджета часто не вызывается, поэтому визарды пишут статус сразу,
 * а хаб форсит refetch по nonce.
 */
export const activationStepStatuses = reactive<ActivationStepsMap>({
  ...EMPTY_ACTIVATION_STATUSES,
})

export const activationHubVisibleNonce = ref(0)

const pending = new Map<ActivationStepId, ActivationStepStatus>()
let loadGeneration = 0

export function notifyActivationHubVisible(): void {
  activationHubVisibleNonce.value += 1
}

export function markActivationStep(
  id: ActivationStepId,
  status: ActivationStepStatus,
): void {
  activationStepStatuses[id] = status
  pending.set(id, status)
  notifyActivationHubVisible()
}

export function resetActivationStatuses(): void {
  pending.clear()
  for (const id of Object.keys(EMPTY_ACTIVATION_STATUSES) as ActivationStepId[]) {
    activationStepStatuses[id] = 'empty'
  }
}

export function hasPendingActivationStatuses(): boolean {
  return pending.size > 0
}

export function beginActivationLoad(): number {
  loadGeneration += 1
  return loadGeneration
}

export function isActivationLoadCurrent(generation: number): boolean {
  return generation === loadGeneration
}

export function mergeActivationFromUser(user: unknown): ActivationStepsMap {
  const record =
    user && typeof user === 'object'
      ? (user as { activation?: { steps?: Partial<Record<string, string>> } })
      : null
  const next = normalizeActivationSteps(record?.activation?.steps)

  for (const id of Object.keys(EMPTY_ACTIVATION_STATUSES) as ActivationStepId[]) {
    const serverStatus = next[id]
    const pendingStatus = pending.get(id)

    if (pendingStatus && pendingStatus !== 'empty' && pendingStatus !== 'partial' && serverStatus === 'empty') {
      activationStepStatuses[id] = pendingStatus
      continue
    }

    activationStepStatuses[id] = serverStatus
    if (
      pendingStatus &&
      (serverStatus === pendingStatus ||
        (pendingStatus === 'review' && serverStatus === 'done') ||
        ((pendingStatus === 'empty' || pendingStatus === 'partial') &&
          (serverStatus === 'empty' || serverStatus === 'partial')))
    ) {
      pending.delete(id)
    }
  }

  return activationStepStatuses
}
