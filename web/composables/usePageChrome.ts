import {
  APP_RR_HEADER_ACTIONS_ID,
  registerRrChildBack,
  useRrHeaderActionsTeleport,
} from 'bibli/widgets/Layout/rr'
import type { MaybeRefOrGetter } from 'vue'

export interface PageChrome {
  title: string
  description?: string
  childPage?: boolean
  parentTitle?: string
  parentTo?: string
}

const DEFAULT_CHROME: PageChrome = {
  title: 'Незалейка',
  description: '',
  childPage: false,
  parentTitle: '',
  parentTo: '',
}

/** Shared RR header state for AppShellRR / AppPageHeaderRR. */
export function usePageChromeState() {
  return useState<PageChrome>('nz-page-chrome', () => ({ ...DEFAULT_CHROME }))
}

/**
 * Bind the current page to the RR shell header.
 * Optional `onBack` registers a custom child back handler.
 */
export function usePageChrome(
  source: MaybeRefOrGetter<PageChrome>,
  opts?: { onBack?: () => void | Promise<void> },
) {
  const chrome = usePageChromeState()
  const actions = useRrHeaderActionsTeleport()

  watch(
    () => toValue(source),
    (next) => {
      chrome.value = {
        title: next.title || DEFAULT_CHROME.title,
        description: next.description || '',
        childPage: Boolean(next.childPage),
        parentTitle: next.parentTitle || '',
        parentTo: next.parentTo || '',
      }
    },
    { immediate: true, deep: true },
  )

  if (opts?.onBack) registerRrChildBack(opts.onBack)

  return {
    chrome,
    headerActionsId: APP_RR_HEADER_ACTIONS_ID,
    ...actions,
  }
}
