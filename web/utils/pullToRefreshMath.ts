export const PTR_THRESHOLD_PX = 64
export const PTR_MAX_PULL_PX = 128
export const PTR_INDICATOR_HEIGHT_PX = 56
export const PTR_REFRESH_HOLD_PX = 56
export const PTR_DAMPING = 0.48

export type PullToRefreshPhase = 'idle' | 'pulling' | 'ready' | 'refreshing'

export function dampPullDistance(rawDeltaY: number, maxPull = PTR_MAX_PULL_PX): number {
  if (rawDeltaY <= 0) return 0
  return Math.min(maxPull, rawDeltaY * PTR_DAMPING)
}

export function resolvePullPhase(
  distance: number,
  threshold = PTR_THRESHOLD_PX,
): PullToRefreshPhase {
  if (distance <= 0) return 'idle'
  if (distance >= threshold) return 'ready'
  return 'pulling'
}

export function indicatorOffsetInGap(contentOffset: number, blockHeight: number): number {
  if (contentOffset <= 0) return -blockHeight
  return Math.max(0, (contentOffset - blockHeight) / 2)
}
