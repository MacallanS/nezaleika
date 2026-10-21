<template>
  <section class="articles wrapper">
    <div class="articles_header"></div>
    <div class="stories-list">
      <div v-for="(group, idx) in articlesStoriesGroups" :key="group.id" class="story-block"
        :style="{ background: group.background }" @click="openGroup(idx)">
        <img class="story-img" :src="group.preview" alt="" />
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showModal" class="stories-modal-fullscreen">
        <button class="close-btn-fullscreen" @click="closeModal">×</button>
        <div class="progress-bar-fullscreen">
          <div v-for="(story, idx) in currentStories" :key="story.id" class="progress-segment"
            :class="{ active: idx === currentIndex, viewed: idx < currentIndex }"
            :style="{ width: 100 / currentStories.length + '%' }">
            <div class="progress-inner" :style="{
              width: idx === currentIndex ? progress + '%' : idx < currentIndex ? '100%' : '0%'
            }"></div>
          </div>
        </div>
        <div class="story-content-fullscreen" :key="currentIndex">
          <div class="story-nav left" @click.stop="prevStory" @mousedown.stop @mouseup.stop @mouseleave.stop
            @touchstart.stop @touchend.stop @touchcancel.stop>
            <svg class="nav-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </div>
          <div class="story-nav right" @click.stop="nextStory" @mousedown.stop @mouseup.stop @mouseleave.stop
            @touchstart.stop @touchend.stop @touchcancel.stop>
            <svg class="nav-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </div>
          <div class="story-pause-area" @mousedown="pauseStoryWithVideo" @mouseup="resumeStoryWithVideo"
            @mouseleave="resumeStoryWithVideo" @touchstart="handleTouchStart" @touchend="handleTouchEnd"
            @touchcancel="resumeStoryWithVideo" @touchmove="handleTouchMove">
            <div class="story-content-fullscreen-img-wrapper">
              <img :src="currentStory.image" alt="" v-if="currentStory.image" />
            </div>


            <button v-if="currentGroupIndex === 3" class="reports-button-overlay" @click.stop="navigateToReports"
              title="Перейти к отчётам">
            </button>
            <button v-if="currentGroupIndex === 1" class="reports-button-overlay" @click.stop="navigateToProducts"
              title="Перейти к продуктам">
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { useStories } from '@/shared/composables/useStories';
import { useStoriesData } from '@/shared/composables/useStoriesData';

const { articlesStoriesGroups } = useStoriesData();

const {
  showStoriesModal: showModal,
  currentStoriesGroupIndex: currentGroupIndex,
  currentStoriesIndex: currentIndex,
  storiesProgress: progress,
  isStoriesPaused: isPaused,
  currentStories,
  currentStory,
  openGroup,
  closeStoriesModal: closeModal,
  nextStory,
  prevStory,
  pauseStory,
  resumeStory,
} = useStories(articlesStoriesGroups);

const touchStartX = ref(0);
const touchStartY = ref(0);
const touchEndX = ref(0);
const touchEndY = ref(0);
const minSwipeDistance = 50;

const navigateToReports = () => {
  window.location.href = '/kpi';
};

const navigateToProducts = () => {
  window.location.href = '/products';
};

const pauseStoryWithVideo = () => pauseStory();
const resumeStoryWithVideo = () => resumeStory();

const handleTouchStart = (event) => {
  pauseStoryWithVideo();
  const touch = event.touches[0];
  touchStartX.value = touch.clientX;
  touchStartY.value = touch.clientY;
};

const handleTouchMove = (event) => {
  event.preventDefault();
};

const handleTouchEnd = (event) => {
  const touch = event.changedTouches[0];
  touchEndX.value = touch.clientX;
  touchEndY.value = touch.clientY;

  const deltaX = touchEndX.value - touchStartX.value;
  const deltaY = touchEndY.value - touchStartY.value;

  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
    deltaX > 0 ? prevStory() : nextStory();
  } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > minSwipeDistance) {
    closeModal();
  } else {
    resumeStoryWithVideo();
  }
};
</script>

<style scoped>
@import '@/assets/css/stories.css';

.articles_header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stories-list {
  display: flex;
  gap: 36px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  margin-top: 10px;
}

.stories-list::-webkit-scrollbar {
  display: none;
}


.story-block-title {
  font-size: 1.08rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.5rem;
  z-index: 3;
  text-shadow: 0 2px 8px #0003;
}

.story-block-subtitle {
  font-size: 1rem;
  color: #fff;
  opacity: 0.92;
  z-index: 3;
  text-shadow: 0 2px 8px #0002;
}

.story-block {
  aspect-ratio: 285/311;
}

.story-block:hover {
  filter: brightness(0.9);
}

.reports-button-overlay {
  position: absolute;
  bottom: 9%;
  left: 50%;
  transform: translateX(-50%);
  background: none;
  color: white;
  border: none;
  border-radius: 50px;
  width: 100%;
  height: 11%;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  pointer-events: auto;
  z-index: 1000;
}

.reports-button-overlay i {
  font-size: 16px;
}

.reports-button-overlay span {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

@media (max-width: 900px) {
  .stories-list {
    flex-wrap: nowrap;
    overflow-x: auto;
    gap: 18px;
    padding: 18px 0;
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .stories-list::-webkit-scrollbar {
    display: none;
  }

  .story-block {
    flex: 0 0 auto;
    max-width: 200px;
    height: auto;
    border-radius: 20px;
    margin-right: 0;
  }

  .story-img {
    border-radius: 20px;
    aspect-ratio: 9/16;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

@media (max-width: 768px) {
  .stories-list {
    gap: 16px;
    padding: 16px 0;
  }

  .story-block {
    max-width: 180px;
    min-width: 180px;
  }
}

@media (max-width: 600px) {
  .stories-list {
    gap: 14px;
    padding: 14px 0;
  }

  .story-block {
    max-width: 160px;
    min-width: 160px;
  }
}

@media (max-width: 480px) {
  .stories-list {
    gap: 12px;
    padding: 12px 0;
  }

  .story-block {
    max-width: 140px;
    min-width: 140px;
  }
}

@media (max-width: 360px) {
  .stories-list {
    gap: 10px;
    padding: 10px 0;
  }

  .story-block {
    max-width: 120px;
    min-width: 120px;
  }
}

.story-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  -webkit-perspective: 1000;
  perspective: 1000;
  will-change: auto;
}

@media (max-width: 1024px) {
  .story-video {
    -webkit-transform: translate3d(0, 0, 0);
    transform: translate3d(0, 0, 0);
    -webkit-filter: none;
    filter: none;
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }

  .stories-modal {
    -webkit-overflow-scrolling: touch;
    -webkit-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
  }

  .story-content {
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
  }

  .story-pause-area {
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
  }
}
</style>

