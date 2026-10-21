import { reactive } from 'vue'

export interface StaffDocPreviewItem {
  url: string
  label: string
}

const previewState = reactive({
  open: false,
  items: [] as StaffDocPreviewItem[],
  index: 0,
})

export function useStaffProfileDocPreview() {
  function openGallery(items: StaffDocPreviewItem[], startUrl: string) {
    const normalized = items.filter((item) => Boolean(item.url))
    if (!normalized.length) return

    const index = normalized.findIndex((item) => item.url === startUrl)
    previewState.items = normalized
    previewState.index = index >= 0 ? index : 0
    previewState.open = true
  }

  function closePreview() {
    previewState.open = false
    previewState.items = []
    previewState.index = 0
  }

  function showPrev() {
    if (previewState.items.length <= 1) return
    previewState.index =
      (previewState.index - 1 + previewState.items.length) % previewState.items.length
  }

  function showNext() {
    if (previewState.items.length <= 1) return
    previewState.index = (previewState.index + 1) % previewState.items.length
  }

  return {
    preview: previewState,
    openGallery,
    closePreview,
    showPrev,
    showNext,
  }
}
