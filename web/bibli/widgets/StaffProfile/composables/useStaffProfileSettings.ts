import { ref, watch, type Ref } from 'vue'
import { GetStaffSettings, UpdateStaffSettings } from '@/pages/agents/api'

const HR_COMPANION_ROLE_ID = 14

export function useStaffProfileSettings(
  userId: Ref<number | null>,
  targetRoleId?: Ref<number | null>,
) {
  const checkinEnabled = ref(false)
  const checkinPhotoEnabled = ref(false)
  const hrRegistrationPiiVisible = ref(false)
  const loading = ref(false)
  const saving = ref(false)

  const showRecruiterPiiSetting = () =>
    targetRoleId?.value != null && targetRoleId.value === HR_COMPANION_ROLE_ID

  async function load() {
    const id = userId.value
    if (!id) {
      checkinEnabled.value = false
      checkinPhotoEnabled.value = false
      hrRegistrationPiiVisible.value = false
      return
    }
    loading.value = true
    try {
      const settings = await GetStaffSettings(id)
      checkinEnabled.value = settings.checkin_enabled === '1'
      checkinPhotoEnabled.value = settings.checkin_photo === '1'
      hrRegistrationPiiVisible.value =
        settings.hr_registration_pii_visible === '1' ||
        settings.hr_registration_pii_visible === true
    } catch {
      checkinEnabled.value = false
      checkinPhotoEnabled.value = false
      hrRegistrationPiiVisible.value = false
    } finally {
      loading.value = false
    }
  }

  async function save(patch?: {
    checkin_enabled?: boolean
    checkin_photo?: boolean
    hr_registration_pii_visible?: boolean
  }) {
    const id = userId.value
    if (!id || saving.value) return false
    saving.value = true
    try {
      await UpdateStaffSettings(id, {
        checkin_enabled: patch?.checkin_enabled ?? checkinEnabled.value,
        checkin_photo: patch?.checkin_photo ?? checkinPhotoEnabled.value,
        hr_registration_pii_visible:
          patch?.hr_registration_pii_visible ?? hrRegistrationPiiVisible.value,
      })
      return true
    } catch {
      return false
    } finally {
      saving.value = false
    }
  }

  async function toggleCheckinEnabled() {
    checkinEnabled.value = !checkinEnabled.value
    const ok = await save()
    if (!ok) checkinEnabled.value = !checkinEnabled.value
    return ok
  }

  async function toggleCheckinPhotoEnabled() {
    checkinPhotoEnabled.value = !checkinPhotoEnabled.value
    const ok = await save()
    if (!ok) checkinPhotoEnabled.value = !checkinPhotoEnabled.value
    return ok
  }

  async function toggleHrRegistrationPiiVisible() {
    hrRegistrationPiiVisible.value = !hrRegistrationPiiVisible.value
    const ok = await save()
    if (!ok) hrRegistrationPiiVisible.value = !hrRegistrationPiiVisible.value
    return ok
  }

  watch(userId, () => void load(), { immediate: true })

  return {
    checkinEnabled,
    checkinPhotoEnabled,
    hrRegistrationPiiVisible,
    showRecruiterPiiSetting,
    loading,
    saving,
    load,
    toggleCheckinEnabled,
    toggleCheckinPhotoEnabled,
    toggleHrRegistrationPiiVisible,
  }
}
