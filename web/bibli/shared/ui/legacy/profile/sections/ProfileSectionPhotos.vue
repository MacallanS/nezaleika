<template>
  <div class="profile-section-card">
    <div class="photos-grid">
      <div v-for="(file, label) in photoFiles" :key="label" class="photo-block">
        <div class="photo-label">{{ label }}</div>
        <div 
          class="photo-preview-wrapper"
          @click="file && typeof file === 'string' && file.trim() !== '' ? handlePhotoClick($event, file, label) : null"
        >
          <a
            v-if="file && typeof file === 'string' && file.trim() !== ''"
            :href="getFileUrl(file)"
            :data-fancybox="`profile-photos`"
            :data-caption="label"
            class="photo-link"
          >
            <img
              :src="getFileUrl(file)"
              class="photo-img"
            />
          </a>
          <div v-else class="photo-placeholder">—</div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";

const props = defineProps(['photoFiles', 'getFileUrl']);

function handlePhotoClick(event, file, label) {
  event.preventDefault();
  
  const groupElements = document.querySelectorAll(`[data-fancybox="profile-photos"]`);
  const files = Array.from(groupElements).map(el => ({
    src: el.getAttribute('href') || '',
    type: "image",
    caption: el.getAttribute('data-caption') || ''
  }));

  const currentFileUrl = props.getFileUrl(file);
  const currentIndex = files.findIndex(f => f.src === currentFileUrl);

  Fancybox.show(files, { 
    startIndex: currentIndex >= 0 ? currentIndex : 0,
    Toolbar: {
      display: {
        left: ["infobar"],
        middle: ["zoomIn", "zoomOut", "toggle1to1", "rotateCCW", "rotateCW", "flipX", "flipY"],
        right: ["slideshow", "thumbs", "close"]
      }
    }
  });
}
</script>
<style scoped>
.profile-section-card {
  background: none;
  padding: 0;
}
.photos-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1.2rem;
}
.photo-block {
  flex: 0 0 180px;
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  justify-content: space-between;
}
.photo-label {
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: var(--russ-text-secondary);
}
.photo-preview-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--russ-bg-tertiary);
  border: 1px solid var(--russ-border);
  border-radius: 12px;
  box-shadow: 0 1px 4px var(--russ-shadow-color);
  overflow: hidden;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.photo-preview-wrapper:hover {
  transform: scale(1.02);
  box-shadow: 0 2px 12px var(--russ-shadow-color);
}
.photo-link {
  display: block;
  width: 100%;
  height: 100%;
  text-decoration: none;
}
.photo-img {
  max-width: 100%;
  max-height: 100%;
  border-radius: 8px;
  transition: transform 0.2s;
  display: block;
}
.photo-placeholder {
  color: var(--russ-text-muted);
  font-size: 2.2rem;
  text-align: center;
}
@media (max-width: 600px) {
  .profile-section-card {
    padding: 0;
  }
  .photos-grid {
    gap: 0.5rem;
  }
  .photo-block {
    flex: 0 0 90px;
  }
  .photo-label {
    font-size: 0.89rem;
    margin-bottom: 0.2rem;
  }
  .photo-preview-wrapper {
    width: 60px;
    height: 60px;
    border-radius: 6px;
  }
  .photo-img {
    border-radius: 6px;
  }
  .photo-placeholder {
    font-size: 1.2rem;
  }
}
</style> 