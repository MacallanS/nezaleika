<template>
  <section class="staff-other" aria-label="Другое">
    <article class="staff-other-card">
      <h2 class="staff-other-card__title">Документы агента</h2>

      <div v-if="documents.length" class="staff-other-images">
        <div
          v-for="doc in documents"
          :key="doc.key"
          class="staff-other-images__item"
        >
          <StaffDocImageCard
            :url="doc.url"
            :label="doc.label"
            :show-caption="false"
            @preview="onPreviewDocument"
          />
          <p class="staff-other-images__label">{{ doc.label }}</p>
        </div>
      </div>
      <p v-else class="staff-other-card__empty">Документов пока нет</p>
    </article>

    <StaffDocPreviewOverlay
      :open="preview.open"
      :url="activePreview?.url ?? ''"
      :title="activePreview?.label"
      :index="preview.index"
      :total="preview.items.length"
      @close="closePreview"
      @prev="showPrev"
      @next="showNext"
    />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { listStaffProfileAllDocumentFiles } from '../../lib/staffProfileDocumentsDownload'
import type { StaffProfileModel } from '../../composables/useStaffProfile'
import { useStaffProfileDocPreview } from '../../composables/useStaffProfileDocPreview'
import StaffDocImageCard from '../documents/StaffDocImageCard.vue'
import StaffDocPreviewOverlay from '../documents/StaffDocPreviewOverlay.vue'

const props = defineProps<{
  profile: StaffProfileModel
  getFileUrl: (file: string | null | undefined) => string
}>()

const { preview, openGallery, closePreview, showPrev, showNext } = useStaffProfileDocPreview()

const documents = computed(() =>
  listStaffProfileAllDocumentFiles(props.profile)
    .map((item) => ({
      key: item.key,
      label: item.label,
      url: props.getFileUrl(item.path),
    }))
    .filter((item) => Boolean(item.url)),
)

const galleryItems = computed(() =>
  documents.value.map((doc) => ({ url: doc.url, label: doc.label })),
)

const activePreview = computed(() => preview.items[preview.index] ?? null)

function onPreviewDocument(url: string) {
  openGallery(galleryItems.value, url)
}
</script>

<style scoped>
.staff-other {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  width: 100%;
  min-width: 0;
}

.staff-other-card {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  padding: 20px;
  border-radius: 20px;
  background: #fff;
}

.staff-other-card__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 24px;
  color: #101012;
}

.staff-other-card__empty {
  margin: 0;
  font-size: 14px;
  color: rgba(60, 60, 67, 0.72);
}

.staff-other-images {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
}

.staff-other-images__item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 120px;
  min-width: 0;
}

.staff-other-images__label {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  line-height: 18px;
  color: #101012;
  word-break: break-word;
}

@media (max-width: 900px) {
  .staff-other {
    grid-template-columns: 1fr;
  }
}
</style>
