<template>
  <div class="profile-agent-type-choice">
    <ProfileStepShell
      :current="1"
      :total="1"
      title="Выберите формат сотрудничества"
      hide-progress
      @back="onBack"
    >
      <div class="patc-stage">
        <div
          ref="carouselRef"
          class="patc-carousel"
          tabindex="0"
          role="region"
          aria-roledescription="карусель"
          aria-label="Тип оформления"
          @keydown="onCarouselKeydown"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
        >
          <div class="patc-track">
            <article
              v-for="(plan, index) in plans"
              :key="plan.id"
              class="patc-slide"
              :class="{ 'patc-slide--active': activeIndex === index }"
              :data-index="index"
              @click="onSlideClick(index, $event)"
            >
              <div class="patc-plan" :class="`patc-plan--${plan.tone}`">
                <div class="patc-plan__hero">
                  <h2 class="patc-plan__title">{{ plan.title }}</h2>
                  <div class="patc-plan__badges">
                    <span
                      v-for="badge in plan.badges"
                      :key="badge.text"
                      class="patc-badge"
                      :class="`patc-badge--${badge.tone}`"
                    >
                      {{ badge.text }}
                    </span>
                  </div>
                  <img
                    class="patc-plan__illust"
                    :src="plan.illust"
                    alt=""
                    width="168"
                    height="140"
                    aria-hidden="true"
                    draggable="false"
                  />
                </div>

                <div class="patc-plan__panel">
                  <ul class="patc-features">
                    <li v-for="(feature, fi) in plan.features" :key="fi" class="patc-feature">
                      <span class="patc-feature__check" aria-hidden="true">
                        <img
                          class="patc-feature__check-icon"
                          :src="checkIcon"
                          alt=""
                          width="16"
                          height="16"
                          draggable="false"
                        />
                      </span>
                      <span class="patc-feature__text">
                        <template v-for="(part, pi) in feature.parts" :key="pi">
                          <span v-if="part.accent" class="patc-feature__accent">{{ part.text }}</span>
                          <template v-else>{{ part.text }}</template>
                        </template>
                      </span>
                    </li>
                  </ul>

                  <p class="patc-note">{{ plan.note }}</p>

                  <button
                    type="button"
                    class="patc-cta"
                    :disabled="choiceLocked || busy"
                    :aria-busy="busy && selected === plan.id ? 'true' : undefined"
                    @click.stop="onChoose(plan.id)"
                  >
                    <span
                      v-if="busy && selected === plan.id"
                      class="patc-cta__spinner"
                      aria-hidden="true"
                    />
                    <span :class="{ 'patc-cta__label--hidden': busy && selected === plan.id }">
                      Выбрать
                    </span>
                  </button>
                </div>
              </div>
            </article>
            <!-- Real flex child: end padding/margin on flex scrollers is ignored on mobile WebKit -->
            <div class="patc-track-end" aria-hidden="true"></div>
          </div>
        </div>
      </div>

      <template #footer>
        <p v-if="choiceLocked" class="patc-error" role="alert">
          Тип оформления уже отправлен. Изменение недоступно.
        </p>
        <p v-else-if="formError" class="patc-error" role="alert">{{ formError }}</p>
      </template>
    </ProfileStepShell>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useProfileApi, useProfileNavigate } from '../composables/useProfileServices'
import { parseApiErrorDetail } from 'bibli/widgets/Profile/lib/parseApiError'
import {
  AGENT_TYPE_IE,
  AGENT_TYPE_SELF_EMPLOYED,
  IE_WIZARD_TOTAL,
  SE_WIZARD_TOTAL,
  ieWizardPath,
  seWizardPath,
} from './lib/agentTypeWizard'
import { isActivationStepLocked } from './lib/activationSteps'
import { activationStepStatuses } from './lib/activationStatusSync'
import { readActivationReturnPath } from './lib/activationReturnPath'
import ProfileStepShell from './personal/ProfileStepShell.vue'
import illustFolder from './assets/activation/agent-type-examples/illust-self-employed.png'
import illustBriefcase from './assets/activation/agent-type-examples/illust-ie.png'
import checkIcon from './assets/activation/check.svg'

const api = useProfileApi()
const navigateTo = useProfileNavigate()
const { setAgentType, getUserData } = api

const selected = ref('')
const busy = ref(false)
const formError = ref('')
/** Принято / на проверке — выбор типа недоступен. */
const choiceLocked = ref(isActivationStepLocked(activationStepStatuses['agent-type']))
const activeIndex = ref(0)
const carouselRef = ref(null)

const plans = [
  {
    id: 'self-employed',
    tone: 'se',
    title: 'Самозанятый',
    illust: illustBriefcase,
    badges: [
      { text: 'До 2,4 млн ₽ в год', tone: 'dark' },
      { text: 'Самый простой', tone: 'dark' },
    ],
    features: [
      { parts: [{ text: 'Выплаты на банковскую карту' }] },
      {
        parts: [
          { text: 'Налог 6%', accent: true },
          { text: ' с выплат от компании' },
        ],
      },
      { parts: [{ text: 'Не нужен расчётный счёт' }] },
      { parts: [{ text: 'Нет страховых взносов' }] },
    ],
    note: 'Важно: учитывается весь доход по СМЗ за год, а\u00a0не только выплаты здесь',
  },
  {
    id: 'ie',
    tone: 'ie',
    title: 'Индивидуальный предприниматель',
    illust: illustFolder,
    badges: [
      { text: 'Без лимита', tone: 'dark' },
      { text: 'Расчётный счёт', tone: 'dark' },
    ],
    features: [
      { parts: [{ text: 'Выплаты на расчётный счёт' }] },
      {
        parts: [
          { text: 'Подходит при доходе ' },
          { text: '> 2,4 млн ₽', accent: true },
        ],
      },
      { parts: [{ text: 'Можно нанимать сотрудников' }] },
      { parts: [{ text: 'Налог зависит от вашего режима' }] },
    ],
    note: 'Важно: могут быть обязательные страховые взносы и отчётность',
  },
]

let drag = null
let suppressClick = false
let hintTimer = 0
let resizeObserver = null

const SIDE_PAD = 16
const PEEK = 48
const GAP = 8
const MAX_CARD = 360

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
}

function slides() {
  return [...(carouselRef.value?.querySelectorAll('.patc-slide') ?? [])]
}

function layoutCarousel() {
  const root = carouselRef.value
  if (!root) return

  const viewport = root.clientWidth
  if (viewport <= 0) return

  const side = SIDE_PAD
  const peek = Math.min(PEEK, Math.round(viewport * 0.12))
  const cardW = Math.min(MAX_CARD, Math.max(240, viewport - side - peek))
  // Enough trailing space so the last card can sit with `side` inset from the left
  // (same as the first) and leave a visible gap on the right.
  const end = Math.max(side, viewport - side - cardW)

  root.style.setProperty('--patc-side', `${side}px`)
  root.style.setProperty('--patc-gap', `${GAP}px`)
  root.style.setProperty('--patc-card-w', `${cardW}px`)
  root.style.setProperty('--patc-end', `${end}px`)
  applyTrackX(translateForIndex(activeIndex.value), false)
}

function snapPadding() {
  const root = carouselRef.value
  if (!root) return SIDE_PAD
  const value = getComputedStyle(root).getPropertyValue('--patc-side')
  return Number.parseFloat(value) || SIDE_PAD
}

function translateForIndex(index) {
  const slide = slides()[index]
  if (!slide) return 0
  return -(slide.offsetLeft - snapPadding())
}

function applyTrackX(x, animate) {
  const track = carouselRef.value?.querySelector('.patc-track')
  if (!track) return
  track.style.transition = animate && !prefersReducedMotion() ? 'transform 0.35s ease' : 'none'
  track.style.transform = `translate3d(${x}px, 0, 0)`
}

function scrollToIndex(index) {
  const next = Math.max(0, Math.min(index, plans.length - 1))
  activeIndex.value = next
  applyTrackX(translateForIndex(next), true)
}

function onCarouselKeydown(event) {
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    scrollToIndex(activeIndex.value + 1)
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    scrollToIndex(activeIndex.value - 1)
  }
}

function onPointerDown(event) {
  if (event.button !== 0) return
  if (event.target.closest('.patc-cta')) return
  drag = {
    id: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startTranslate: translateForIndex(activeIndex.value),
    axis: null,
    moved: false,
  }
}

function onPointerMove(event) {
  if (!drag || event.pointerId !== drag.id) return
  const dx = event.clientX - drag.startX
  const dy = event.clientY - drag.startY
  if (!drag.axis) {
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return
    drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
    if (drag.axis === 'x') {
      event.currentTarget?.setPointerCapture?.(event.pointerId)
    }
  }
  if (drag.axis !== 'x') return
  event.preventDefault()
  drag.moved = true
  applyTrackX(drag.startTranslate + dx, false)
}

function onPointerUp(event) {
  if (!drag || event.pointerId !== drag.id) return
  const axis = drag.axis
  const dx = event.clientX - drag.startX
  const moved = drag.moved
  drag = null
  if (axis !== 'x') return
  if (moved) {
    suppressClick = true
    window.setTimeout(() => {
      suppressClick = false
    }, 80)
    if (dx < -40) scrollToIndex(activeIndex.value + 1)
    else if (dx > 40) scrollToIndex(activeIndex.value - 1)
    else scrollToIndex(activeIndex.value)
  }
}

function onSlideClick(index, event) {
  if (suppressClick) return
  if (event.target.closest('.patc-cta')) return
  if (index !== activeIndex.value) scrollToIndex(index)
}

function onBack() {
  void navigateTo(readActivationReturnPath())
}

async function redirectIfLocked() {
  try {
    const userRes = await getUserData()
    const user = userRes?.data ?? userRes
    const status =
      user?.activation?.steps?.['agent-type'] || activationStepStatuses['agent-type']
    if (!isActivationStepLocked(status)) {
      choiceLocked.value = false
      return
    }

    choiceLocked.value = true
    const accountType = Number(user?.account_type)
    if (accountType === AGENT_TYPE_SELF_EMPLOYED) {
      void navigateTo(seWizardPath(SE_WIZARD_TOTAL), { replace: true })
      return
    }
    if (accountType === AGENT_TYPE_IE) {
      void navigateTo(ieWizardPath(IE_WIZARD_TOTAL), { replace: true })
      return
    }
    void navigateTo('/profile', { replace: true })
  } catch (err) {
    console.error('[agent-type-choice] failed to check lock', err)
    if (isActivationStepLocked(activationStepStatuses['agent-type'])) {
      choiceLocked.value = true
      void navigateTo('/profile', { replace: true })
    }
  }
}

async function onChoose(id) {
  if (choiceLocked.value || !id || busy.value) return
  selected.value = id
  formError.value = ''
  busy.value = true
  try {
    const accountType = id === 'self-employed' ? AGENT_TYPE_SELF_EMPLOYED : AGENT_TYPE_IE
    await setAgentType(String(accountType))
    if (id === 'self-employed') {
      await navigateTo(seWizardPath(1))
    } else {
      await navigateTo(ieWizardPath(1))
    }
  } catch (err) {
    formError.value =
      parseApiErrorDetail(err, 'Не удалось сохранить тип оформления') ||
      'Не удалось сохранить тип оформления'
  } finally {
    busy.value = false
  }
}

function playSwipeHint() {
  if (prefersReducedMotion()) return
  const peek = 36
  applyTrackX(-peek, true)
  hintTimer = window.setTimeout(() => {
    applyTrackX(0, true)
  }, 520)
}

onMounted(() => {
  void redirectIfLocked()
  void nextTick(() => {
    const root = carouselRef.value
    if (!root) return
    resizeObserver = new ResizeObserver(() => {
      layoutCarousel()
    })
    resizeObserver.observe(root)
    layoutCarousel()
    playSwipeHint()
  })
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  if (hintTimer) window.clearTimeout(hintTimer)
})
</script>

<style scoped>
.profile-agent-type-choice,
.profile-agent-type-choice *,
.profile-agent-type-choice *::before,
.profile-agent-type-choice *::after {
  box-sizing: border-box;
}

.profile-agent-type-choice {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  flex: 1 1 0;
  overflow: hidden;
  color: var(--rr-labels-neutral-primary);
}

.profile-agent-type-choice :deep(.profile-step-shell__title) {
  max-width: 16.5rem;
  line-height: var(--rr-line-height-line-height-2xl);
}

.profile-agent-type-choice :deep(.profile-step-shell__footer) {
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-m);
}

/* Карусель на всю ширину shell (контент иначе с gutter). */
.patc-stage {
  position: relative;
  flex: 0 0 auto;
  min-height: 0;
  display: flex;
  align-items: flex-start;
  margin-inline: calc(-1 * var(--app-page-rr-gutter, var(--rr-spacing-padding-xl)));
}

.patc-carousel {
  --patc-side: 16px;
  --patc-gap: 8px;
  --patc-card-w: 300px;
  --patc-end: 16px;
  width: 100%;
  min-width: 0;
  height: auto;
  overflow: visible;
  touch-action: pan-y;
  cursor: grab;
  outline: none;
}

.patc-carousel:active {
  cursor: grabbing;
}

.patc-track {
  display: flex;
  align-items: flex-start;
  width: max-content;
  min-width: 100%;
  gap: var(--patc-gap);
  padding-inline-start: var(--patc-side);
  box-sizing: border-box;
  will-change: transform;
}

.patc-slide {
  flex: 0 0 var(--patc-card-w);
  width: var(--patc-card-w);
  min-width: var(--patc-card-w);
  max-width: var(--patc-card-w);
  box-sizing: border-box;
}

.patc-track-end {
  flex: 0 0 var(--patc-end);
  width: var(--patc-end);
  min-width: var(--patc-end);
  height: 1px;
  pointer-events: none;
}

.patc-plan {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: fit-content;
  overflow: hidden;
  border-radius: var(--rr-radius-3-xl);
}

.patc-plan--se {
  background: #e4e8ff;
}

.patc-plan--ie {
  background: #d7eef8;
}

.patc-plan__hero {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 0 0 auto;
  min-height: 0;
  height: calc(150px + 2 * var(--rr-spacing-padding-xl));
  max-height: calc(150px + 2 * var(--rr-spacing-padding-xl));
  padding: var(--rr-spacing-padding-xl);
}

.patc-plan__title {
  margin: 0;
  max-width: 58%;
  font-size: var(--rr-font-size-font-size-xl);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.patc-plan__badges {
  display: flex;
  flex-wrap: nowrap;
  gap: var(--rr-spacing-padding-s);
  margin-top: 0;
  position: relative;
  z-index: 2;
}

.patc-badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: var(--rr-radius-full);
  font-size: var(--rr-font-size-font-size-xs);
  font-weight: 600;
  line-height: 1.25;
  white-space: nowrap;
}

.patc-badge--dark {
  background: var(--rr-button-neutral-primary-background-default, #242426);
  color: var(--rr-button-neutral-primary-text-default, #fff);
}

.patc-badge--light {
  background: #fff;
  color: var(--rr-labels-neutral-primary, #101012);
}

.patc-plan__illust {
  position: absolute;
  right: -4px;
  bottom: -12px;
  z-index: 1;
  display: block;
  width: auto;
  max-width: 168px;
  max-height: 150px;
  height: auto;
  pointer-events: none;
  user-select: none;
}

.patc-plan--ie .patc-plan__illust {
  max-width: 150px;
  right: 0;
  bottom: -10px;
}

.patc-plan__panel {
  position: relative;
  z-index: 2;
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  width: 100%;
  min-height: 0;
  margin: 0;
  padding: 0;
  border-radius: var(--rr-radius-3-xl);
  background: #fff;
  overflow: hidden;
}

.patc-features {
  display: flex;
  flex-direction: column;
  gap: 11px;
  margin: 0;
  padding: var(--rr-spacing-padding-xl) var(--rr-spacing-padding-xl) 0;
  list-style: none;
}

.patc-feature {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.patc-feature__check {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 24px;
}

.patc-feature__check-icon {
  display: block;
  width: 16px;
  height: 16px;
}

.patc-feature__text {
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 400;
  font-style: normal;
  font-size: var(--rr-font-size-font-size-m);
  line-height: var(--rr-line-height-line-height-m);
  letter-spacing: var(--rr-tracking-tracking-m);
  color: #000;
}

.patc-feature__accent {
  color: var(--rr-labels-brand-primary, #1c4ae5);
  font-weight: 700;
}

.patc-note {
  margin: var(--rr-spacing-padding-m) var(--rr-spacing-padding-xl) 0;
  padding: 0;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 400;
  font-style: normal;
  font-size: var(--rr-font-size-font-size-xs);
  line-height: var(--rr-line-height-line-height-xs);
  letter-spacing: var(--rr-tracking-tracking-s);
  color: var(--rr-labels-neutral-secondary, #3c3c43b8);
}

.patc-cta {
  appearance: none;
  -webkit-appearance: none;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: auto;
  margin: var(--rr-spacing-padding-xl) var(--rr-spacing-padding-l) var(--rr-spacing-padding-l);
  padding: var(--rr-spacing-padding-l);
  border: none;
  border-radius: var(--rr-radius-l);
  background: var(--rr-button-neutral-primary-background-default, #242426);
  color: var(--rr-button-neutral-primary-text-default, #fff);
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 600;
  font-style: normal;
  font-size: var(--rr-font-size-font-size-m);
  line-height: var(--rr-line-height-line-height-m);
  letter-spacing: var(--rr-tracking-tracking-m);
  text-align: center;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

@media (hover: hover) and (pointer: fine) {
  .patc-cta:hover:not(:disabled) {
    background: var(--rr-button-neutral-primary-background-hover, #3c3c43);
  }
}

.patc-cta:active:not(:disabled) {
  background: var(--rr-button-neutral-primary-background-active, #595961);
}

.patc-cta:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.patc-cta__label--hidden {
  visibility: hidden;
}

.patc-cta__spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  margin: -10px 0 0 -10px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: patc-spin 0.7s linear infinite;
}

@keyframes patc-spin {
  to {
    transform: rotate(360deg);
  }
}

.patc-error {
  margin: 0;
  color: var(--rr-labels-danger-primary);
  font-size: var(--rr-font-size-font-size-s);
  text-align: center;
}
</style>
