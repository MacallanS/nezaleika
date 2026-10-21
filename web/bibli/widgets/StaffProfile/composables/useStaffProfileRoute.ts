import { computed, watch } from 'vue'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'
import type { ActivationStepId } from 'bibli/widgets/Profile/rr/lib/activationSteps'
import { registerRrChildBack } from 'bibli/widgets/Layout/rr/composables/useRrChildBack'
import {
  defaultStaffProfileTab,
  isDocumentsLikeTab,
  isStaffProfileDocId,
  isStaffProfileTabId,
  resolveStaffProfileTabId,
  STAFF_PROFILE_DOC_VALUES,
  STAFF_PROFILE_LEGACY_TAB_ALIASES,
  type StaffProfileFrom,
  type StaffProfileTabId,
} from '../lib/staffProfileTabs'
import { resolveStaffProfileBack } from '../lib/staffProfileNavigation'

export function useStaffProfileRoute() {
  const route = useRoute()
  const router = useRouter()

  const userId = computed(() => {
    const raw = Number(route.params.id)
    return Number.isFinite(raw) && raw > 0 ? raw : null
  })

  const fromSource = computed<StaffProfileFrom>(() => {
    const raw = String(route.query.from || 'agents')
    if (raw === 'onec' || raw === 'onboarding' || raw === 'agents') {
      return raw
    }
    return 'agents'
  })

  const backTarget = computed(() => resolveStaffProfileBack(fromSource.value))

  const activeTab = computed<StaffProfileTabId>(() => {
    const fallback = defaultStaffProfileTab(fromSource.value)
    const raw = String(route.query.tab || fallback)
    return resolveStaffProfileTabId(raw, fromSource.value)
  })

  const activeDoc = computed<ActivationStepId>(() => {
    const raw = String(route.query.doc || 'passport')
    return isStaffProfileDocId(raw) ? raw : 'passport'
  })

  async function setActiveTab(tab: StaffProfileTabId) {
    const canonical = resolveStaffProfileTabId(tab, fromSource.value)
    const query: LocationQueryRaw = { ...route.query, tab: canonical }
    if (!isDocumentsLikeTab(canonical)) {
      delete query.doc
    } else if (!query.doc) {
      query.doc = 'passport'
    }
    await router.replace({ query })
  }

  async function setActiveDoc(doc: ActivationStepId) {
    if (!STAFF_PROFILE_DOC_VALUES.includes(doc)) return
    const documentsTab: StaffProfileTabId = isDocumentsLikeTab(activeTab.value)
      ? resolveStaffProfileTabId(activeTab.value, fromSource.value)
      : 'documents'
    await router.replace({
      query: {
        ...route.query,
        tab: documentsTab,
        doc,
      },
    })
  }

  async function goBack() {
    await router.push(backTarget.value.path)
  }

  registerRrChildBack(() => {
    void goBack()
  })

  watch(
    () => [route.query.tab, fromSource.value] as const,
    ([tab]) => {
      const fallback = defaultStaffProfileTab(fromSource.value)
      const raw = tab == null || tab === '' ? '' : String(tab)
      if (!raw) {
        void router.replace({
          query: {
            ...route.query,
            tab: fallback,
          },
        })
        return
      }
      if (!isStaffProfileTabId(raw)) {
        void router.replace({
          query: {
            ...route.query,
            tab: fallback,
          },
        })
        return
      }
      const aliased = STAFF_PROFILE_LEGACY_TAB_ALIASES[raw]
      if (aliased && aliased !== raw) {
        void router.replace({
          query: {
            ...route.query,
            tab: aliased,
          },
        })
      }
    },
    { immediate: true },
  )

  watch(
    () => route.query.doc,
    (doc) => {
      if (isDocumentsLikeTab(activeTab.value) && doc && !isStaffProfileDocId(String(doc))) {
        void router.replace({
          query: {
            ...route.query,
            doc: 'passport',
          },
        })
      }
    },
    { immediate: true },
  )

  return {
    userId,
    fromSource,
    backTarget,
    activeTab,
    activeDoc,
    setActiveTab,
    setActiveDoc,
    goBack,
  }
}
