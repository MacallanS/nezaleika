<template>
  <section class="staff-projects" aria-label="Проекты">
    <div class="staff-projects__grid">
      <!-- Текущий проект -->
      <article
        class="staff-projects-card staff-projects-card--project staff-projects-card--clickable"
        role="button"
        tabindex="0"
        aria-label="Открыть проект"
        @click="openProjectView"
        @keydown.enter.prevent="openProjectView"
        @keydown.space.prevent="openProjectView"
      >
        <div class="staff-projects-card__top">
          <div class="staff-projects-card__copy">
            <h2 class="staff-projects-card__title">{{ view.projectName }}</h2>
            <p class="staff-projects-card__subtitle">текущий проект</p>
          </div>
          <button
            v-if="!readOnly"
            type="button"
            class="staff-projects-card__icon-btn"
            :aria-label="
              canAttachFromPrimaryReferal
                ? 'Прикрепить по первичному рефу'
                : 'Прикрепить проект'
            "
            :disabled="attachSaving"
            @click.stop="startAttachFlow"
          >
            <img :src="iconEdit" alt="" width="20" height="20" />
          </button>
        </div>
        <div class="staff-projects-card__bottom">
          <div class="staff-projects-card__pills">
            <div class="staff-projects-card__pill">
              <img
                class="staff-projects-card__pin"
                :src="iconPin"
                alt=""
                width="16"
                height="16"
                aria-hidden="true"
              />
              <span class="staff-projects-card__pill-text">{{ view.pointName }}</span>
            </div>
            <span
              v-if="view.pointExtraCount > 0"
              class="staff-projects-card__pill staff-projects-card__pill-extra"
            >
              +{{ view.pointExtraCount }}
            </span>
          </div>
          <img
            class="staff-projects-card__art"
            :src="iconProjects"
            alt=""
            width="88"
            height="88"
            decoding="async"
          />
        </div>
      </article>

      <!-- Реферальная информация (смена рефа не трогает прикреплённый проект/точки) -->
      <article class="staff-projects-card staff-projects-card--referal">
        <div class="staff-projects-card__top">
          <h2 class="staff-projects-card__title">Реферальная информация</h2>
          <button
            v-if="!readOnly"
            type="button"
            class="staff-projects-card__icon-btn"
            aria-label="Изменить реферал"
            :disabled="attachSaving"
            @click.stop="startReferalEditFlow"
          >
            <img :src="iconEdit" alt="" width="20" height="20" />
          </button>
        </div>
        <dl class="staff-projects-meta">
          <div class="staff-projects-meta__cell">
            <dt>Проект</dt>
            <dd :title="view.referalProjectName !== '—' ? view.referalProjectName : undefined">
              {{ view.referalProjectName }}
            </dd>
          </div>
          <div class="staff-projects-meta__cell">
            <dt>Точка</dt>
            <dd :title="view.referalPointName !== '—' ? view.referalPointName : undefined">
              {{ view.referalPointName }}
            </dd>
          </div>
          <div class="staff-projects-meta__cell">
            <dt>Присоединился</dt>
            <dd :title="view.joinedLabel !== '—' ? view.joinedLabel : undefined">
              {{ view.joinedLabel }}
            </dd>
          </div>
          <div class="staff-projects-meta__cell">
            <dt>Ссылка создана</dt>
            <dd
              :title="
                view.linkCreatedBy ? view.linkCreatedBy : undefined
              "
            >
              {{ view.linkCreatedBy || '—' }}
            </dd>
          </div>
        </dl>
      </article>

      <!-- Тестовый доступ -->
      <article class="staff-projects-card staff-projects-card--trainee">
        <div class="staff-projects-card__top">
          <h2 class="staff-projects-card__title">Тестовый доступ</h2>
          <div v-if="!readOnly" class="staff-projects-card__actions">
            <button
              v-if="canManageTrainee && view.traineeActionLabel"
              type="button"
              class="staff-projects-card__action"
              :class="
                view.traineeState === 'empty' || view.traineeState === 'expired'
                  ? 'staff-projects-card__action--brand'
                  : 'staff-projects-card__action--neutral'
              "
              :disabled="traineeBusy"
              @click="onTraineeAction"
            >
              {{ traineeBusy ? 'Сохранение…' : view.traineeActionLabel }}
            </button>
            <button
              v-if="isAdmin && view.traineeState === 'active'"
              type="button"
              class="staff-projects-card__action staff-projects-card__action--danger"
              :disabled="traineeBusy"
              @click="emit('revoke-trainee')"
            >
              {{ traineeBusy ? 'Удаление…' : 'Удалить' }}
            </button>
          </div>
        </div>

        <template v-if="view.traineeState === 'active'">
          <div class="staff-projects-trainee__row">
            <div class="staff-projects-trainee__metric">
              <p class="staff-projects-trainee__days">{{ view.traineeDaysLeft ?? '—' }}</p>
              <p class="staff-projects-trainee__days-label">осталось дней</p>
            </div>
            <p v-if="view.traineeUntilLabel" class="staff-projects-trainee__until">
              {{ view.traineeUntilLabel }}
            </p>
          </div>
        </template>

        <template v-else-if="view.traineeState === 'expired'">
          <div class="staff-projects-trainee__expired">
            <p class="staff-projects-trainee__expired-title">Истёк</p>
            <div class="staff-projects-trainee__row">
              <p v-if="view.traineeEndedLabel" class="staff-projects-trainee__ended">
                {{ view.traineeEndedLabel }}
              </p>
              <p class="staff-projects-trainee__no-access">Нет доступа</p>
            </div>
          </div>
        </template>

        <p v-else class="staff-projects-card__status">Еще не был выдан</p>
      </article>

      <!-- Синхронизация с 1С -->
      <article class="staff-projects-card">
        <div class="staff-projects-card__top">
          <h2 class="staff-projects-card__title">Синхронизация с 1С</h2>
          <button
            v-if="!readOnly"
            type="button"
            class="staff-projects-card__action staff-projects-card__action--brand"
            :disabled="!view.canResyncOnec || onecBusy"
            @click="onResyncOnec"
          >
            {{ onecBusy ? 'Выгрузка…' : view.onecResyncLabel }}
          </button>
        </div>
        <dl class="staff-projects-onec">
          <div class="staff-projects-onec__cell">
            <dt>Статус</dt>
            <dd>
              <RrStatusBadge
                class="rr-grid-list__badge"
                kind="onec"
                :id="view.onec?.status || undefined"
                :label="view.onecStatusLabel"
                size="sm"
              />
            </dd>
          </div>
          <div class="staff-projects-onec__cell">
            <dt>Причина</dt>
            <dd>{{ view.onecReason }}</dd>
          </div>
          <div class="staff-projects-onec__cell">
            <dt>Попытки</dt>
            <dd>{{ view.onecAttempts }}</dd>
          </div>
        </dl>
      </article>
    </div>

    <!-- Модалка: выбрать проект -->
    <div
      v-if="step === 'project'"
      class="staff-projects-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="staff-projects-pick-title"
      @click.self="closeModals"
    >
      <div class="staff-projects-modal__panel staff-projects-modal__panel--list">
        <button type="button" class="staff-projects-modal__close" aria-label="Закрыть" @click="closeModals">
          <img :src="iconClose" alt="" width="24" height="24" aria-hidden="true" />
        </button>
        <div class="staff-projects-modal__head">
          <h3 id="staff-projects-pick-title" class="staff-projects-modal__title">
            {{ projectModalTitle }}
          </h3>
        </div>
        <label class="staff-projects-modal__search">
          <img
            class="staff-projects-modal__search-icon"
            :src="iconSearch"
            alt=""
            width="24"
            height="24"
            aria-hidden="true"
          />
          <input v-model="projectQuery" type="search" placeholder="Поиск по названию" />
        </label>
        <ul class="staff-projects-modal__list" role="listbox">
          <li v-for="p in filteredProjects" :key="p.id">
            <button
              type="button"
              class="staff-projects-modal__option"
              :class="{ 'staff-projects-modal__option--active': String(p.id) === selectedProjectId }"
              @click="onProjectOptionClick(String(p.id))"
            >
              <span class="staff-projects-modal__option-mark" aria-hidden="true">{{
                (p.name || '?').slice(0, 1)
              }}</span>
              <span class="staff-projects-modal__option-name">{{ p.name }}</span>
              <svg
                v-if="String(p.id) === selectedProjectId"
                class="staff-projects-modal__check"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M3.33594 8.3974L6.6026 11.6641L12.6693 4.66406"
                  stroke="currentColor"
                  stroke-width="1.14"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </li>
          <li v-if="!targetsLoading && !filteredProjects.length" class="staff-projects-modal__empty">
            Проекты не найдены
          </li>
        </ul>
        <p v-if="modalError" class="staff-projects-modal__error" role="alert">{{ modalError }}</p>
        <button
          type="button"
          class="staff-projects-modal__primary"
          :disabled="!selectedProjectId || targetsLoading || continuing"
          @click="goToPointPickerAfterProject"
        >
          {{ continuing ? 'Загрузка…' : 'Продолжить' }}
        </button>
      </div>
    </div>

    <!-- Модалка: выбрать точки (можно несколько или все) -->
    <div
      v-if="step === 'points'"
      class="staff-projects-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="staff-projects-points-title"
      @click.self="closePointsPicker"
    >
      <div class="staff-projects-modal__panel staff-projects-modal__panel--list">
        <button type="button" class="staff-projects-modal__close" aria-label="Закрыть" @click="closePointsPicker">
          <img :src="iconClose" alt="" width="24" height="24" aria-hidden="true" />
        </button>
        <div class="staff-projects-modal__head">
          <h3 id="staff-projects-points-title" class="staff-projects-modal__title">
            {{ pointsModalTitle }}
          </h3>
          <button
            v-if="filteredPoints.length && flow !== 'referal-edit'"
            type="button"
            class="staff-projects-modal__select-all"
            @click="toggleSelectAllPoints"
          >
            {{ allFilteredPointsSelected ? 'Снять все' : 'Выбрать все' }}
          </button>
        </div>
        <label class="staff-projects-modal__search">
          <img
            class="staff-projects-modal__search-icon"
            :src="iconSearch"
            alt=""
            width="24"
            height="24"
            aria-hidden="true"
          />
          <input
            v-model="pointQuery"
            type="search"
            placeholder="Поиск по названию или адресу"
          />
        </label>
        <ul
          class="staff-projects-modal__list"
          role="listbox"
          :aria-multiselectable="flow === 'referal-edit' ? 'false' : 'true'"
        >
          <li v-for="pt in filteredPoints" :key="pt.id">
            <button
              type="button"
              class="staff-projects-modal__option staff-projects-modal__option--point"
              :class="{ 'staff-projects-modal__option--selected': isPointSelected(pt.id) }"
              role="option"
              :aria-selected="isPointSelected(pt.id) ? 'true' : 'false'"
              @click="onPointOptionClick(String(pt.id))"
            >
              <span
                class="staff-projects-modal__checkbox"
                :class="{ 'staff-projects-modal__checkbox--checked': isPointSelected(pt.id) }"
                aria-hidden="true"
              >
                <svg
                  v-if="isPointSelected(pt.id)"
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.33594 8.3974L6.6026 11.6641L12.6693 4.66406"
                    stroke="currentColor"
                    stroke-width="1.14"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
              <span class="staff-projects-modal__option-body">
                <span class="staff-projects-modal__pin-wrap" aria-hidden="true">
                  <img
                    class="staff-projects-modal__pin-img"
                    :src="iconPin"
                    alt=""
                    width="16"
                    height="16"
                  />
                </span>
                <span class="staff-projects-modal__option-text">
                  <span class="staff-projects-modal__option-name">{{ pt.name }}</span>
                  <span v-if="pt.address" class="staff-projects-modal__option-sub">{{ pt.address }}</span>
                </span>
              </span>
            </button>
          </li>
          <li v-if="!filteredPoints.length" class="staff-projects-modal__empty">Точки не найдены</li>
        </ul>
        <p v-if="modalError" class="staff-projects-modal__error" role="alert">{{ modalError }}</p>
        <button
          type="button"
          class="staff-projects-modal__primary"
          :disabled="!selectedPointIds.length || attachSaving"
          @click="confirmAttachPoint"
        >
          {{ pointsConfirmLabel }}
        </button>
      </div>
    </div>

    <!-- Просмотр / редактирование точек проекта -->
    <div
      v-if="step === 'project-view'"
      class="staff-projects-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="staff-projects-attach-title"
      @click.self="closeModals"
    >
      <div class="staff-projects-modal__panel staff-projects-modal__panel--attach">
        <button type="button" class="staff-projects-modal__close" aria-label="Закрыть" @click="closeModals">
          <img :src="iconClose" alt="" width="24" height="24" aria-hidden="true" />
        </button>
        <div class="staff-projects-modal__head staff-projects-modal__head--attach">
          <div class="staff-projects-attach__project-btn staff-projects-attach__project-btn--static">
            <span class="staff-projects-modal__option-mark" aria-hidden="true">{{
              (view.projectName || '?').slice(0, 1)
            }}</span>
            <h3 id="staff-projects-attach-title" class="staff-projects-modal__title staff-projects-modal__title--sm">
              {{ view.projectName || 'Проект' }}
            </h3>
          </div>
        </div>

        <div class="staff-projects-attach staff-projects-attach--points-only">
          <section class="staff-projects-attach__col">
            <div class="staff-projects-attach__col-head">
              <div>
                <h4 class="staff-projects-attach__col-title">Точки агента</h4>
                <p class="staff-projects-attach__col-sub">к которому прикреплен</p>
              </div>
              <button type="button" class="staff-projects-attach__add" @click="openAddPointsFromView">
                + Добавить
              </button>
            </div>
            <ul class="staff-projects-attach__list">
              <li
                v-for="pt in draftPoints"
                :key="pt.id"
                class="staff-projects-attach__point"
              >
                <span class="staff-projects-modal__pin-wrap" aria-hidden="true">
                  <img :src="iconPin" alt="" width="16" height="16" />
                </span>
                <span class="staff-projects-modal__option-text">
                  <span class="staff-projects-modal__option-name">{{ pt.name }}</span>
                  <span v-if="pt.address" class="staff-projects-modal__option-sub">{{ pt.address }}</span>
                </span>
                <button
                  type="button"
                  class="staff-projects-attach__remove"
                  aria-label="Убрать точку"
                  @click="removeDraftPoint(String(pt.id))"
                >
                  <img :src="iconClose" alt="" width="16" height="16" />
                </button>
              </li>
              <li v-if="!draftPoints.length" class="staff-projects-modal__empty">
                Точки не выбраны
              </li>
            </ul>
          </section>
        </div>

        <p v-if="modalError" class="staff-projects-modal__error" role="alert">{{ modalError }}</p>

        <div class="staff-projects-attach__footer">
          <div class="staff-projects-attach__status">
            <p class="staff-projects-attach__status-label">Подключён</p>
            <p class="staff-projects-attach__status-date">{{ view.joinedLabel }}</p>
          </div>
          <div class="staff-projects-modal__actions staff-projects-attach__actions">
            <button type="button" class="staff-projects-modal__btn" @click="closeModals">
              Отменить
            </button>
            <button
              type="button"
              class="staff-projects-modal__btn staff-projects-modal__btn--primary"
              :disabled="attachSaving || !draftPointIds.length || !pointsDraftDirty"
              @click="savePointsFromView"
            >
              {{ attachSaving ? 'Сохранение…' : 'Сохранить изменения' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Продлить / Выдать доступ: дни + календарь -->
    <div
      v-if="step === 'days'"
      class="staff-projects-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="staff-projects-days-title"
      @click.self="closeModals"
    >
      <div class="staff-projects-modal__panel staff-projects-modal__panel--days">
        <button type="button" class="staff-projects-modal__close" aria-label="Закрыть" @click="closeModals">
          <img :src="iconClose" alt="" width="24" height="24" aria-hidden="true" />
        </button>
        <div class="staff-projects-modal__head">
          <h3 id="staff-projects-days-title" class="staff-projects-modal__title">
            {{ daysModalTitle }}
          </h3>
        </div>

        <div class="staff-projects-days">
          <div class="staff-projects-days__left">
            <label class="staff-projects-days__field">
              <span class="staff-projects-days__label">Укажите количество дней</span>
              <input
                class="staff-projects-days__input"
                :class="{ 'staff-projects-days__input--invalid': Boolean(daysError && daysErrorField === 'days') }"
                type="number"
                min="1"
                max="90"
                inputmode="numeric"
                :value="accessDays"
                @input="onDaysInput"
              />
            </label>
            <label class="staff-projects-days__field">
              <span class="staff-projects-days__label">Срок доступа до</span>
              <span
                class="staff-projects-days__until-wrap"
                :class="{ 'staff-projects-days__until-wrap--invalid': Boolean(daysError && daysErrorField === 'until') }"
              >
                <input
                  v-model="untilInput"
                  class="staff-projects-days__input staff-projects-days__input--until"
                  type="text"
                  placeholder="дд.мм.гггг"
                  maxlength="10"
                  @input="onUntilInputTyping"
                  @change="onUntilInputChange"
                  @blur="onUntilInputChange"
                />
                <span class="staff-projects-days__cal-icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.5" />
                    <path d="M3 9h18" stroke="currentColor" stroke-width="1.5" />
                    <path d="M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                  </svg>
                </span>
              </span>
            </label>
          </div>

          <div class="staff-projects-cal" aria-label="Выбор даты">
            <div class="staff-projects-cal__nav">
              <button
                type="button"
                class="staff-projects-cal__nav-btn"
                aria-label="Предыдущий месяц"
                @click="shiftCalendarMonth(-1)"
              >
                ‹
              </button>
              <p class="staff-projects-cal__month">{{ calendarMonthLabel }}</p>
              <button
                type="button"
                class="staff-projects-cal__nav-btn"
                aria-label="Следующий месяц"
                @click="shiftCalendarMonth(1)"
              >
                ›
              </button>
            </div>
            <div class="staff-projects-cal__weekdays">
              <span v-for="wd in weekdays" :key="wd">{{ wd }}</span>
            </div>
            <div class="staff-projects-cal__grid">
              <button
                v-for="cell in calendarDays"
                :key="cell.key"
                type="button"
                class="staff-projects-cal__day"
                :class="{
                  'staff-projects-cal__day--other': cell.isOtherMonth,
                  'staff-projects-cal__day--today': cell.isToday,
                  'staff-projects-cal__day--start': cell.isEnd,
                  'staff-projects-cal__day--end': cell.isEnd,
                  'staff-projects-cal__day--disabled': cell.isDisabled,
                }"
                :disabled="cell.isDisabled"
                @click="selectCalendarDay(cell.date)"
              >
                {{ cell.day }}
              </button>
            </div>
          </div>
        </div>

        <p v-if="modalError || daysError" class="staff-projects-modal__error" role="alert">
          {{ modalError || daysError }}
        </p>

        <div class="staff-projects-modal__actions">
          <button type="button" class="staff-projects-modal__btn" @click="closeModals">Отмена</button>
          <button
            type="button"
            class="staff-projects-modal__btn staff-projects-modal__btn--primary"
            :disabled="traineeBusy || !isDaysValid"
            @click="confirmDaysModal"
          >
            {{ daysConfirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useToast } from 'bibli/shared/ui'
import { useRoles } from '@/shared/composables'
import {
  GetSuggestAttachment,
  UpdateStaffAttachment,
} from '@/pages/agents/api'
import { fetchReferalTargets, updateStaffRegistrationReferal } from '@/pages/onboarding/api'
import { getStaffProfileActionErrorMessage } from '../../lib/staffProfileActionError'
import {
  addCalendarDays,
  buildStaffCalendarDays,
  clampStaffCalendarDate,
  diffCalendarDays,
  formatStaffDateInput,
  parseStaffDateInput,
  staffCalendarMonthLabel,
  staffCalendarWeekdays,
  startOfDay,
} from '../../lib/staffProfileCalendar'
import { buildStaffProjectsView } from '../../lib/staffProfileProjects'
import type { StaffProfileModel } from '../../composables/useStaffProfile'
import RrStatusBadge from 'bibli/shared/ui/rr/list/RrStatusBadge.vue'
import iconClose from '../../assets/icons/close.svg'
import iconEdit from '../../assets/icons/edit.svg'
import iconPin from '../../assets/icons/pin.svg'
import iconSearch from '../../assets/icons/search.svg'
import iconProjects from '../../assets/projects-tab.webp'

type ModalStep = null | 'project' | 'points' | 'project-view' | 'days'
type FlowMode = 'attach' | 'points-edit' | 'grant' | 'referal-edit' | null

type TargetPoint = { id: number; name: string; address?: string | null }
type TargetProject = { id: number; name: string; points: TargetPoint[] }

export type StaffTraineeGrantEmitPayload = {
  days: number
  project_id: number
  points_id?: number[]
  core_project_role?: string
}

const props = withDefaults(
  defineProps<{
    profile: StaffProfileModel
    traineeBusy?: boolean
    onecBusy?: boolean
    readOnly?: boolean
  }>(),
  {
    traineeBusy: false,
    onecBusy: false,
    readOnly: false,
  },
)

const emit = defineEmits<{
  reload: []
  'grant-trainee': [payload: StaffTraineeGrantEmitPayload]
  'extend-trainee': [days: number]
  'revoke-trainee': []
  'resync-onec': []
}>()

const toast = useToast()
const { canManageTrainee, isAdmin } = useRoles()

const view = computed(() => buildStaffProjectsView(props.profile))

/** REGISTERED = 2, AGENT = 3 — как RoleEnum на бэке. */
const profileRoleId = computed(() => {
  const fromStaff = Number(props.profile.rawStaffDetails?.data?.role_id)
  if (Number.isFinite(fromStaff) && fromStaff > 0) return fromStaff
  const fromReg = Number(props.profile.rawRegistration?.role_id)
  return Number.isFinite(fromReg) && fromReg > 0 ? fromReg : null
})

const canAttachFromPrimaryReferal = computed(
  () =>
    profileRoleId.value === 2 &&
    view.value.referalPointId != null &&
    view.value.referalProjectName !== '—' &&
    !view.value.projectId,
)

const hasAttachedProject = computed(() => view.value.projectId != null)

const hasReferalLink = computed(
  () =>
    view.value.referalProjectId != null ||
    view.value.referalPointId != null ||
    (view.value.referalProjectName !== '—' && Boolean(view.value.referalProjectName)),
)

function notifyNeedsProjectAttachment(reason: 'open' | 'grant' | 'attach-ref') {
  const noReferal = !hasReferalLink.value
  const detail =
    reason === 'grant'
      ? noReferal
        ? 'У сотрудника нет проекта и реферальной ссылки. Сначала прикрепите проект.'
        : 'У сотрудника нет проекта. Сначала прикрепите проект.'
      : reason === 'attach-ref'
        ? 'Реферальной ссылки нет — выберите проект и точку вручную.'
        : noReferal
          ? 'У сотрудника нет проекта и реферальной ссылки. Прикрепите проект кнопкой справа.'
          : 'У сотрудника нет проекта. Прикрепите проект кнопкой справа.'
  toast.add({
    severity: 'warn',
    summary: 'Нет проекта',
    detail,
    life: 4500,
  })
}

const step = ref<ModalStep>(null)
const flow = ref<FlowMode>(null)
const attachSaving = ref(false)
const targetsLoading = ref(false)
const continuing = ref(false)
const modalError = ref('')
const projectTargets = ref<TargetProject[]>([])
const selectedProjectId = ref('')
const selectedPointIds = ref<string[]>([])
const draftPointIds = ref<string[]>([])
const projectQuery = ref('')
const pointQuery = ref('')
const grantCoreRole = ref<string | null>(null)

const accessDays = ref(3)
const untilInput = ref('')
const rangeFrom = ref<Date | null>(null)
const rangeTo = ref<Date | null>(null)
const daysError = ref('')
const daysErrorField = ref<'days' | 'until' | null>(null)
const calendarCursor = ref(startOfDay(new Date()))
const weekdays = staffCalendarWeekdays()

const filteredProjects = computed(() => {
  const q = projectQuery.value.trim().toLowerCase()
  if (!q) return projectTargets.value
  return projectTargets.value.filter((p) => p.name.toLowerCase().includes(q))
})

const selectedProjectPoints = computed((): TargetPoint[] => {
  const projectId = Number(selectedProjectId.value)
  return projectTargets.value.find((p) => Number(p.id) === projectId)?.points ?? []
})

const filteredPoints = computed(() => {
  const q = pointQuery.value.trim().toLowerCase()
  if (!q) return selectedProjectPoints.value
  return selectedProjectPoints.value.filter((pt) => {
    const name = pt.name.toLowerCase()
    const address = (pt.address || '').toLowerCase()
    return name.includes(q) || address.includes(q)
  })
})

const draftPoints = computed((): TargetPoint[] => {
  const byId = new Map<string, TargetPoint>()
  for (const pt of selectedProjectPoints.value) byId.set(String(pt.id), pt)
  for (const pt of view.value.points) {
    if (pt.id != null) byId.set(String(pt.id), { id: pt.id, name: pt.name, address: pt.address })
  }
  return draftPointIds.value
    .map((id) => byId.get(id))
    .filter((pt): pt is TargetPoint => Boolean(pt))
})

const initialPointIdsKey = computed(() =>
  view.value.points
    .map((pt) => (pt.id != null ? String(pt.id) : ''))
    .filter(Boolean)
    .sort()
    .join(','),
)

const pointsDraftDirty = computed(() => {
  const next = [...draftPointIds.value].sort().join(',')
  return next !== initialPointIdsKey.value
})

const pointsConfirmLabel = computed(() => {
  if (attachSaving.value) return 'Сохранение…'
  if (flow.value === 'referal-edit') return 'Сохранить'
  if (flow.value === 'points-edit') {
    return selectedPointIds.value.length > 1
      ? `Добавить (${selectedPointIds.value.length})`
      : 'Добавить'
  }
  return selectedPointIds.value.length > 1
    ? `Прикрепить (${selectedPointIds.value.length})`
    : 'Прикрепить'
})

const projectModalTitle = computed(() =>
  flow.value === 'referal-edit' ? 'Реферальный проект' : 'Выберите проект',
)

const pointsModalTitle = computed(() =>
  flow.value === 'referal-edit' ? 'Выберите точку' : 'Выберите точки',
)

const daysModalTitle = computed(() =>
  flow.value === 'grant' ? 'Выдать доступ' : 'Продлить доступ',
)

const daysConfirmLabel = computed(() => {
  if (props.traineeBusy) return 'Сохранение…'
  return flow.value === 'grant' ? 'Выдать' : 'Продлить'
})

const isDaysValid = computed(() => {
  const days = Number(accessDays.value)
  return (
    Number.isFinite(days) &&
    days >= 1 &&
    days <= 90 &&
    rangeFrom.value != null &&
    rangeTo.value != null
  )
})

const calendarMonthLabel = computed(() =>
  staffCalendarMonthLabel(calendarCursor.value.getFullYear(), calendarCursor.value.getMonth()),
)

const daysBaseDate = computed(() => {
  const now = startOfDay(new Date())
  if (flow.value === 'grant') return now
  const expiresRaw = view.value.trainee?.expires_at
  if (!expiresRaw) return now
  const expires = startOfDay(new Date(expiresRaw))
  if (Number.isNaN(expires.getTime())) return now
  return expires.getTime() > now.getTime() ? expires : now
})

const calendarMinDate = computed(() => addCalendarDays(daysBaseDate.value, 1))
const calendarMaxDate = computed(() => addCalendarDays(daysBaseDate.value, 90))

const calendarDays = computed(() =>
  buildStaffCalendarDays({
    viewYear: calendarCursor.value.getFullYear(),
    viewMonth: calendarCursor.value.getMonth(),
    rangeFrom: rangeTo.value,
    rangeTo: rangeTo.value,
    minDate: calendarMinDate.value,
    maxDate: calendarMaxDate.value,
  }),
)

function clampDays(value: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.max(1, Math.min(90, Math.round(value)))
}

function clearDaysError() {
  daysError.value = ''
  daysErrorField.value = null
}

function setDaysError(message: string, field: 'days' | 'until' | null = null) {
  daysError.value = message
  daysErrorField.value = field
}

function untilOutOfBoundsMessage(date: Date): string | null {
  const min = calendarMinDate.value
  const max = calendarMaxDate.value
  const t = startOfDay(date).getTime()
  if (t < min.getTime() || t > max.getTime()) {
    return `Дата должна быть с ${formatStaffDateInput(min)} по ${formatStaffDateInput(max)}`
  }
  return null
}

function applyEndDate(to: Date) {
  const nextTo = clampStaffCalendarDate(to, calendarMinDate.value, calendarMaxDate.value)
  rangeFrom.value = calendarMinDate.value
  rangeTo.value = nextTo
  untilInput.value = formatStaffDateInput(nextTo)
  accessDays.value = clampDays(diffCalendarDays(daysBaseDate.value, nextTo))
  calendarCursor.value = new Date(nextTo.getFullYear(), nextTo.getMonth(), 1)
}

function syncRangeFromDays() {
  const days = clampDays(Number(accessDays.value))
  accessDays.value = days
  applyEndDate(addCalendarDays(daysBaseDate.value, days))
}

function onDaysInput(event: Event) {
  const raw = Number((event.target as HTMLInputElement).value)
  if (!Number.isFinite(raw) || raw < 1 || raw > 90) {
    setDaysError('Количество дней — от 1 до 90', 'days')
  } else {
    clearDaysError()
  }
  accessDays.value = clampDays(raw)
  syncRangeFromDays()
}

function onUntilInputTyping() {
  const raw = untilInput.value.trim()
  if (!raw) {
    clearDaysError()
    return
  }
  const parsed = parseStaffDateInput(raw)
  if (!parsed) return
  const boundsError = untilOutOfBoundsMessage(parsed)
  if (boundsError) {
    setDaysError(boundsError, 'until')
  } else {
    clearDaysError()
  }
  applyEndDate(parsed)
}

function onUntilInputChange() {
  const raw = untilInput.value.trim()
  if (!raw) {
    setDaysError('Укажите срок доступа', 'until')
    untilInput.value = rangeTo.value ? formatStaffDateInput(rangeTo.value) : ''
    if (rangeTo.value) clearDaysError()
    return
  }
  const parsed = parseStaffDateInput(raw)
  if (!parsed) {
    setDaysError('Укажите дату в формате дд.мм.гггг', 'until')
    untilInput.value = rangeTo.value ? formatStaffDateInput(rangeTo.value) : ''
    return
  }
  const boundsError = untilOutOfBoundsMessage(parsed)
  if (boundsError) {
    setDaysError(boundsError, 'until')
    applyEndDate(parsed)
    return
  }
  clearDaysError()
  applyEndDate(parsed)
}

function selectCalendarDay(date: Date) {
  clearDaysError()
  applyEndDate(date)
}

function shiftCalendarMonth(delta: number) {
  const cur = calendarCursor.value
  calendarCursor.value = new Date(cur.getFullYear(), cur.getMonth() + delta, 1)
}

function clearPointSelection() {
  selectedPointIds.value = []
}

function isPointSelected(id: number | string): boolean {
  return selectedPointIds.value.includes(String(id))
}

function onProjectOptionClick(id: string) {
  const next = String(id)
  if (selectedProjectId.value === next) return
  selectedProjectId.value = next
  clearPointSelection()
}

function togglePoint(id: string) {
  const key = String(id)
  if (selectedPointIds.value.includes(key)) {
    selectedPointIds.value = selectedPointIds.value.filter((x) => x !== key)
    return
  }
  selectedPointIds.value = [...selectedPointIds.value, key]
}

function onPointOptionClick(id: string) {
  if (flow.value === 'referal-edit') {
    selectedPointIds.value = [String(id)]
    return
  }
  togglePoint(id)
}

const allFilteredPointsSelected = computed(() => {
  const list = filteredPoints.value
  if (!list.length) return false
  return list.every((pt) => selectedPointIds.value.includes(String(pt.id)))
})

function toggleSelectAllPoints() {
  const list = filteredPoints.value
  if (!list.length) return
  if (allFilteredPointsSelected.value) {
    const filteredIds = new Set(list.map((pt) => String(pt.id)))
    selectedPointIds.value = selectedPointIds.value.filter((id) => !filteredIds.has(id))
    return
  }
  const next = new Set(selectedPointIds.value)
  for (const pt of list) next.add(String(pt.id))
  selectedPointIds.value = [...next]
}

async function ensureTargets() {
  if (projectTargets.value.length) return
  targetsLoading.value = true
  modalError.value = ''
  try {
    const data = await fetchReferalTargets()
    projectTargets.value = (Array.isArray(data) ? data : []).map((project) => ({
      id: Number(project.id),
      name: String(project.name || ''),
      points: (Array.isArray(project.points) ? project.points : []).map((pt) => ({
        id: Number(pt.id),
        name: String(pt.name || ''),
        address:
          pt && typeof pt === 'object' && 'address' in pt
            ? typeof (pt as { address?: unknown }).address === 'string'
              ? (pt as { address: string }).address
              : null
            : null,
      })),
    }))
  } catch (err) {
    modalError.value = getStaffProfileActionErrorMessage(err, 'Не удалось загрузить проекты')
  } finally {
    targetsLoading.value = false
  }
}

function initDraftPointsFromView() {
  draftPointIds.value = view.value.points
    .map((pt) => (pt.id != null ? String(pt.id) : ''))
    .filter(Boolean)
  selectedProjectId.value = view.value.projectId ? String(view.value.projectId) : ''
}

function removeDraftPoint(id: string) {
  draftPointIds.value = draftPointIds.value.filter((item) => item !== id)
}

async function openProjectView() {
  if (attachSaving.value || continuing.value) return
  if (!hasAttachedProject.value) {
    notifyNeedsProjectAttachment('open')
    return
  }
  flow.value = null
  modalError.value = ''
  initDraftPointsFromView()
  step.value = 'project-view'
  void ensureTargets()
}

async function openAddPointsFromView() {
  if (!view.value.projectId && !selectedProjectId.value) {
    modalError.value = 'Сначала прикрепите проект'
    return
  }
  flow.value = 'points-edit'
  modalError.value = ''
  pointQuery.value = ''
  selectedProjectId.value = view.value.projectId
    ? String(view.value.projectId)
    : selectedProjectId.value
  continuing.value = true
  try {
    await ensureTargets()
    selectedPointIds.value = [...draftPointIds.value]
    step.value = 'points'
  } finally {
    continuing.value = false
  }
}

async function savePointsFromView() {
  const pointIds = draftPointIds.value.map((id) => Number(id)).filter((n) => n > 0)
  if (!pointIds.length) {
    modalError.value = 'Выберите хотя бы одну точку'
    return
  }
  attachSaving.value = true
  modalError.value = ''
  try {
    await UpdateStaffAttachment(props.profile.id, { point_ids: pointIds })
    toast.add({
      severity: 'success',
      summary: 'Готово',
      detail: 'Точки обновлены',
      life: 3000,
    })
    step.value = null
    flow.value = null
    emit('reload')
  } catch (err) {
    modalError.value = getStaffProfileActionErrorMessage(err, 'Не удалось сохранить точки')
  } finally {
    attachSaving.value = false
  }
}

async function startAttachFlow() {
  if (props.readOnly || attachSaving.value || continuing.value) return

  if (canAttachFromPrimaryReferal.value) {
    await confirmAttachFromPrimaryReferal()
    return
  }

  flow.value = 'attach'
  grantCoreRole.value = null
  modalError.value = ''
  projectQuery.value = ''
  pointQuery.value = ''
  clearPointSelection()
  selectedProjectId.value = view.value.projectId ? String(view.value.projectId) : ''
  step.value = 'project'
  await ensureTargets()
}

async function startReferalEditFlow() {
  if (props.readOnly || attachSaving.value || continuing.value) return
  if (!hasReferalLink.value) {
    notifyNeedsProjectAttachment('attach-ref')
  }
  flow.value = 'referal-edit'
  grantCoreRole.value = null
  modalError.value = ''
  projectQuery.value = ''
  pointQuery.value = ''
  selectedProjectId.value = view.value.referalProjectId
    ? String(view.value.referalProjectId)
    : ''
  selectedPointIds.value = view.value.referalPointId
    ? [String(view.value.referalPointId)]
    : []
  step.value = 'project'
  await ensureTargets()
}

async function confirmAttachFromPrimaryReferal() {
  attachSaving.value = true
  modalError.value = ''
  try {
    await UpdateStaffAttachment(props.profile.id, {
      point_ids: [],
      from_referal: true,
    })
    toast.add({
      severity: 'success',
      summary: 'Готово',
      detail: 'Прикреплён по первичному рефу',
      life: 3000,
    })
    step.value = null
    flow.value = null
    emit('reload')
  } catch (err) {
    modalError.value = getStaffProfileActionErrorMessage(
      err,
      'Не удалось прикрепить по рефу',
    )
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: modalError.value,
      life: 4500,
    })
  } finally {
    attachSaving.value = false
  }
}

async function goToPointPickerAfterProject() {
  if (!selectedProjectId.value) return
  continuing.value = true
  modalError.value = ''
  pointQuery.value = ''
  try {
    await ensureTargets()
    if (flow.value === 'referal-edit') {
      const current = selectedPointIds.value[0]
      const stillValid =
        current != null &&
        selectedProjectPoints.value.some((pt) => String(pt.id) === current)
      if (stillValid && current) {
        selectedPointIds.value = [current]
      } else if (
        view.value.referalPointId != null &&
        selectedProjectPoints.value.some(
          (pt) => Number(pt.id) === Number(view.value.referalPointId),
        )
      ) {
        selectedPointIds.value = [String(view.value.referalPointId)]
      } else {
        selectedPointIds.value = []
      }
      step.value = 'points'
      return
    }
    const attachedForProject = view.value.points
      .map((pt) => (pt.id != null ? String(pt.id) : ''))
      .filter((id) => id && selectedProjectPoints.value.some((pt) => String(pt.id) === id))
    selectedPointIds.value = attachedForProject
    step.value = 'points'
  } finally {
    continuing.value = false
  }
}

function closePointsPicker() {
  if (flow.value === 'points-edit') {
    step.value = 'project-view'
    return
  }
  if (flow.value === 'attach' || flow.value === 'referal-edit') {
    step.value = 'project'
    return
  }
  closeModals()
}

async function confirmReferalEdit() {
  const projectId = Number(selectedProjectId.value)
  const pointId = Number(selectedPointIds.value[0])
  if (!projectId || !pointId) {
    modalError.value = 'Выберите проект и точку'
    return
  }
  attachSaving.value = true
  modalError.value = ''
  try {
    const response = await updateStaffRegistrationReferal(props.profile.id, {
      project_id: projectId,
      point_id: pointId,
    })
    const data = (response?.data || {}) as {
      project?: { name?: string }
      left_current_scope?: boolean
    }
    const projectName = data.project?.name || ''
    const leftScope = Boolean(data.left_current_scope)
    toast.add({
      severity: 'success',
      summary: leftScope ? 'Кандидат передан' : 'Реферал изменён',
      detail: leftScope
        ? `Кандидат передан на проект «${projectName || 'другой'}»`
        : projectName
          ? `Реферал обновлён: проект «${projectName}». Прикреплённый проект и точки не изменились.`
          : 'Реферал обновлён. Прикреплённый проект и точки не изменились.',
      life: 4500,
    })
    step.value = null
    flow.value = null
    emit('reload')
  } catch (err) {
    modalError.value = getStaffProfileActionErrorMessage(err, 'Не удалось изменить реферал')
  } finally {
    attachSaving.value = false
  }
}

async function confirmAttachPoint() {
  if (flow.value === 'referal-edit') {
    await confirmReferalEdit()
    return
  }
  if (flow.value === 'points-edit') {
    draftPointIds.value = [...selectedPointIds.value]
    step.value = 'project-view'
    return
  }

  const pointIds = selectedPointIds.value.map((id) => Number(id)).filter((n) => n > 0)
  if (!pointIds.length) {
    modalError.value = 'Выберите хотя бы одну точку'
    return
  }
  attachSaving.value = true
  modalError.value = ''
  try {
    await UpdateStaffAttachment(props.profile.id, { point_ids: pointIds })
    toast.add({
      severity: 'success',
      summary: 'Готово',
      detail:
        pointIds.length > 1
          ? `Прикреплено к ${pointIds.length} точкам`
          : 'Проект прикреплён',
      life: 3000,
    })
    step.value = null
    flow.value = null
    emit('reload')
  } catch (err) {
    modalError.value = getStaffProfileActionErrorMessage(err, 'Не удалось прикрепить проект')
  } finally {
    attachSaving.value = false
  }
}

function closeModals() {
  if (attachSaving.value || continuing.value) return
  step.value = null
  flow.value = null
  grantCoreRole.value = null
  modalError.value = ''
}

function openExtendDaysModal() {
  flow.value = null
  grantCoreRole.value = null
  modalError.value = ''
  clearDaysError()
  accessDays.value = 3
  syncRangeFromDays()
  step.value = 'days'
}

function openGrantDaysModal() {
  flow.value = 'grant'
  modalError.value = ''
  clearDaysError()
  accessDays.value = 3
  syncRangeFromDays()
  step.value = 'days'
}

async function resolveFieldRoleForProject(projectId: number): Promise<string | null> {
  try {
    const suggest = await GetSuggestAttachment(props.profile.id)
    const projectsList = (suggest?.projects ?? []) as Array<{
      id: number
      core_field_roles?: string[]
    }>
    const matched = projectsList.find((item) => Number(item.id) === Number(projectId))
    const roles = matched?.core_field_roles || []
    if (!roles.length) {
      const bat = projectsList.find((item) => (item.core_field_roles || []).length > 0)
      if (bat && Number(bat.id) === Number(projectId)) {
        return (bat.core_field_roles || []).includes('promoter')
          ? 'promoter'
          : (bat.core_field_roles || [])[0] || null
      }
      return null
    }
    return roles.includes('promoter') ? 'promoter' : roles[0]
  } catch {
    return null
  }
}

async function startGrantFlow() {
  flow.value = 'grant'
  grantCoreRole.value = null
  modalError.value = ''

  const projectId = view.value.projectId
  if (!projectId) {
    notifyNeedsProjectAttachment('grant')
    return
  }

  selectedProjectId.value = String(projectId)
  const pointIds = view.value.points
    .map((pt) => (pt.id != null ? Number(pt.id) : 0))
    .filter((n) => n > 0)
  selectedPointIds.value = pointIds.map(String)

  continuing.value = true
  try {
    const role = await resolveFieldRoleForProject(projectId)
    if (role) {
      grantCoreRole.value = role
      clearPointSelection()
      openGrantDaysModal()
      return
    }
    if (!pointIds.length) {
      toast.add({
        severity: 'warn',
        summary: 'Нужна привязка',
        detail: 'Сначала привяжите точку к проекту',
        life: 4500,
      })
      return
    }
    openGrantDaysModal()
  } finally {
    continuing.value = false
  }
}

function onTraineeAction() {
  if (props.traineeBusy) return
  if (view.value.traineeState === 'active') {
    openExtendDaysModal()
    return
  }
  void startGrantFlow()
}

function onResyncOnec() {
  if (props.onecBusy) return
  if (!view.value.canResyncOnec) {
    toast.add({
      severity: 'warn',
      summary: '1С',
      detail: 'Выгрузка доступна после заполнения данных и перехода на подписание',
      life: 4500,
    })
    return
  }
  emit('resync-onec')
}

function confirmDaysModal() {
  if (!isDaysValid.value) {
    if (!rangeFrom.value || !rangeTo.value) {
      setDaysError('Выберите срок доступа на календаре', 'until')
    } else {
      setDaysError('Проверьте количество дней (1–90) и срок доступа', 'days')
    }
    return
  }
  clearDaysError()
  const days = clampDays(Number(accessDays.value))

  if (flow.value === 'grant') {
    const projectId = Number(selectedProjectId.value) || view.value.projectId
    if (!projectId) {
      modalError.value = 'Сначала привяжите проект'
      return
    }
    const payload: StaffTraineeGrantEmitPayload = {
      days,
      project_id: projectId,
    }
    if (grantCoreRole.value) {
      payload.core_project_role = grantCoreRole.value
    } else {
      payload.points_id = selectedPointIds.value.map((id) => Number(id)).filter((n) => n > 0)
      if (!payload.points_id.length) {
        modalError.value = 'Сначала привяжите точку'
        return
      }
    }
    step.value = null
    flow.value = null
    emit('grant-trainee', payload)
    return
  }

  step.value = null
  flow.value = null
  emit('extend-trainee', days)
}
</script>

<style scoped>
.staff-projects {
  width: 100%;
  min-width: 0;
}

.staff-projects__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: 200px;
  gap: 12px;
  align-items: stretch;
}

.staff-projects-card {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  padding: 20px;
  border-radius: 20px;
  background: #fff;
  overflow: hidden;
}

.staff-projects-card--project {
  position: relative;
}

.staff-projects-card--clickable {
  cursor: pointer;
}

.staff-projects-card--clickable:focus-visible {
  outline: 2px solid var(--rr-colors-primary-primary, #007f83);
  outline-offset: 2px;
}

.staff-projects-card--referal {
  gap: 0;
}

.staff-projects-card--referal .staff-projects-meta {
  margin-top: auto;
  padding-top: 24px;
}

.staff-projects-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.staff-projects-card__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  flex: 0 0 auto;
}

.staff-projects-card__copy {
  min-width: 0;
}

.staff-projects-card__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 24px;
  color: #101012;
}

.staff-projects-card__subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  line-height: 18px;
  color: rgba(60, 60, 67, 0.6);
}

.staff-projects-card__icon-btn {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
}

.staff-projects-card__icon-btn:disabled {
  opacity: 0.45;
  cursor: default;
}

.staff-projects-card__bottom {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 8px;
  position: relative;
  z-index: 1;
  min-height: 88px;
}

.staff-projects-card__pills {
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: 75%;
  min-width: 0;
  position: relative;
  z-index: 1;
}

.staff-projects-card__pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  min-width: 0;
  margin: 0;
  padding: 4px 12px 4px 8px;
  border-radius: 99px;
  background: var(--Backgrounds-Quaternary, var(--rr-backgrounds-quaternary, #f2f3f7));
  font-size: 13px;
  line-height: 18px;
  color: #101012;
}

.staff-projects-card__pill--btn {
  border: none;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.staff-projects-card__pill-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.staff-projects-card__pill-extra {
  flex: 0 0 auto;
  padding: 4px 10px;
  font-weight: 600;
  color: rgba(60, 60, 67, 0.72);
}

.staff-projects-card__pin {
  display: block;
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  object-fit: contain;
}

.staff-projects-card__art {
  position: absolute;
  right: 16px;
  bottom: -32px;
  z-index: 0;
  width: 180px;
  height: auto;
  object-fit: contain;
  pointer-events: none;
}

.staff-projects-card__action {
  flex: 0 0 auto;
  min-height: 36px;
  padding: 8px 14px;
  border: none;
  border-radius: 12px;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.staff-projects-card__action:disabled {
  opacity: 0.5;
  cursor: default;
}

.staff-projects-card__action--neutral {
  background: #f2f3f7;
  color: #101012;
}

.staff-projects-card__action--brand {
  background: #e8efff;
  color: #3d5afe;
}

.staff-projects-card__action--danger {
  background: #fef2f2;
  color: #e11d48;
}

.staff-projects-card__status {
  margin: auto 0 0;
  font-size: 14px;
  line-height: 20px;
  color: rgba(60, 60, 67, 0.72);
}

.staff-projects-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
  margin: 0;
}

.staff-projects-meta__cell {
  min-width: 0;
}

.staff-projects-meta dt {
  margin: 0;
  font-size: 12px;
  line-height: 16px;
  color: rgba(60, 60, 67, 0.6);
}

.staff-projects-meta dd {
  margin: 4px 0 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  color: #101012;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.staff-projects-trainee__row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
}

.staff-projects-trainee__metric {
  min-width: 0;
}

.staff-projects-trainee__days {
  margin: 0;
  font-size: 40px;
  font-weight: 700;
  line-height: 1;
  color: #101012;
}

.staff-projects-trainee__days-label {
  margin: 4px 0 0;
  font-size: 13px;
  color: rgba(60, 60, 67, 0.6);
}

.staff-projects-trainee__until {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #101012;
  white-space: nowrap;
}

.staff-projects-trainee__expired {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.staff-projects-trainee__expired-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #101012;
}

.staff-projects-trainee__ended {
  margin: 0;
  font-size: 13px;
  color: rgba(60, 60, 67, 0.72);
}

.staff-projects-trainee__no-access {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #e11d48;
}

.staff-projects-onec {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 16px 24px;
  margin: auto 0 0;
}

.staff-projects-onec__cell dt {
  margin: 0;
  font-size: 12px;
  color: rgba(60, 60, 67, 0.6);
}

.staff-projects-onec__cell dd {
  margin: 4px 0 0;
  font-size: 14px;
  font-weight: 600;
  color: #101012;
  word-break: break-word;
}

.staff-projects-modal {
  position: fixed;
  inset: 0;
  z-index: 10040;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(16, 16, 18, 0.4);
}

.staff-projects-modal__panel {
  position: relative;
  box-sizing: border-box;
  width: min(440px, 100%);
  padding: 48px 32px 32px;
  border-radius: 20px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-height: min(88vh, 720px);
  overflow: hidden;
}

.staff-projects-modal__panel--list {
  width: min(700px, 100%);
}

.staff-projects-modal__panel--days {
  width: min(720px, 100%);
}

.staff-projects-modal__panel--attach {
  width: min(560px, 100%);
  max-height: min(92vh, 820px);
}

.staff-projects-modal__head {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 32px;
  padding: 0 48px;
  flex-shrink: 0;
}

.staff-projects-modal__head--attach {
  justify-content: flex-start;
  padding-right: 48px;
  padding-left: 0;
}

.staff-projects-modal__select-all {
  position: absolute;
  left: 12px;
  top: 20px;
  margin: 0;
  padding: 8px 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  color: #3d5afe;
  cursor: pointer;
}

.staff-projects-modal__select-all:hover {
  background: #f2f3f7;
}

.staff-projects-modal__title {
  margin: 0;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 500;
  font-size: var(--rr-font-size-font-size-2xl, 32px);
  line-height: var(--rr-line-height-line-height-2xl, 32px);
  letter-spacing: var(--rr-tracking-tracking-2xl, -1px);
  text-align: center;
  color: #101012;
}

.staff-projects-modal__title--sm {
  font-size: 24px;
  line-height: 28px;
  text-align: left;
}

.staff-projects-attach__project-btn {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.staff-projects-attach__project-btn--static {
  cursor: default;
  pointer-events: none;
}

.staff-projects-modal__close,
.staff-projects-modal__icon-edit {
  position: absolute;
  top: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: #101012;
  cursor: pointer;
}

.staff-projects-modal__close {
  right: 12px;
}

.staff-projects-modal__icon-edit {
  left: 12px;
}

.staff-projects-modal__close img,
.staff-projects-modal__icon-edit img {
  display: block;
  width: 24px;
  height: 24px;
}

.staff-projects-modal__search {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 12px;
  border-radius: 12px;
  background: #f2f3f7;
  flex-shrink: 0;
}

.staff-projects-modal__search-icon {
  display: block;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
}

.staff-projects-modal__search input {
  flex: 1 1 auto;
  min-width: 0;
  border: none;
  background: transparent;
  font: inherit;
  font-size: 15px;
  outline: none;
}

.staff-projects-modal__select-all-row {
  display: flex;
  justify-content: flex-end;
  margin-top: -8px;
}

.staff-projects-modal__select-all-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #101012;
  cursor: pointer;
  user-select: none;
}

.staff-projects-modal__select-all-input {
  width: 18px;
  height: 18px;
  accent-color: #3d5afe;
  cursor: pointer;
}

.staff-projects-modal__list {
  margin: 0;
  padding: 0 6px 0 0;
  list-style: none;
  overflow-x: hidden;
  overflow-y: auto;
  flex: 1 1 auto;
  min-height: 0;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: #c8cad2 transparent;
}

.staff-projects-modal__option {
  box-sizing: border-box;
  width: 100%;
  min-height: 64px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: var(--rr-spacing-padding-xl, 16px);
  border: none;
  border-radius: var(--rr-radius-l, 12px);
  background: transparent;
  text-align: left;
  font: inherit;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.staff-projects-modal__option:hover {
  background: var(--Backgrounds-Secondary, var(--rr-backgrounds-secondary, #f8f9fb));
}

.staff-projects-modal__option--active {
  background: var(--Backgrounds-Secondary, var(--rr-backgrounds-secondary, #f8f9fb));
}

.staff-projects-modal__option--selected {
  background: #e8efff;
}

.staff-projects-modal__option-mark {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 32px;
  height: 32px;
  border-radius: 4.8px;
  border: 0.8px solid var(--Border-Neutral-Subtle, #dedee3);
  background: #e8efff;
  color: #3d5afe;
  font-weight: 700;
}

.staff-projects-modal__option-text {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.staff-projects-modal__option-name {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 15px;
  font-weight: 600;
  color: #101012;
}

.staff-projects-modal__option-sub {
  font-size: 12px;
  color: rgba(60, 60, 67, 0.6);
}

.staff-projects-modal__option--point {
  justify-content: flex-start;
  gap: 12px;
}

.staff-projects-modal__option--point .staff-projects-modal__checkbox {
  order: 0;
  margin-left: 0;
  margin-right: 0;
  flex: 0 0 auto;
}

.staff-projects-modal__option-body {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1 1 auto;
  min-width: 0;
}

.staff-projects-modal__check {
  flex: 0 0 auto;
  display: block;
  width: 16px;
  height: 16px;
  margin-left: auto;
  color: var(--Border-Neutral-Emphasis, #101012);
}

.staff-projects-modal__checkbox {
  flex: 0 0 auto;
  box-sizing: border-box;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1.5px solid #c8cad2;
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.staff-projects-modal__checkbox--checked {
  border-color: #3d5afe;
  background: #3d5afe;
}

.staff-projects-modal__pin-wrap {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f2f3f7;
}

.staff-projects-modal__pin-img {
  display: block;
  width: 16px;
  height: 16px;
  object-fit: contain;
}

.staff-projects-modal__point-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
}

.staff-projects-modal__copy-btn {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
}

.staff-projects-modal__empty {
  padding: 16px;
  color: rgba(60, 60, 67, 0.6);
  font-size: 14px;
}

.staff-projects-modal__primary {
  width: 100%;
  min-height: 48px;
  border: none;
  border-radius: 14px;
  background: #3d5afe;
  color: #fff;
  font: inherit;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
}

.staff-projects-modal__primary:disabled {
  opacity: 0.45;
  cursor: default;
  background: #c8cad2;
}

.staff-projects-modal__error {
  margin: 0;
  color: #e11d48;
  font-size: 13px;
}

.staff-projects-modal__actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.staff-projects-modal__btn {
  box-sizing: border-box;
  flex: 1 1 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 48px;
  min-height: 48px;
  padding: var(--rr-spacing-padding-l, 12px) var(--rr-spacing-padding-xl, 16px);
  border: 1px solid var(--Button-Neutral-Quaternary-Border-Default, #dedee3);
  border-radius: var(--rr-radius-m, 8px);
  background: transparent;
  font: inherit;
  font-size: var(--rr-font-size-font-size-m, 16px);
  font-weight: 600;
  line-height: var(--rr-line-height-line-height-m, 24px);
  cursor: pointer;
  color: var(--Labels-Neutral-Primary, var(--rr-labels-neutral-primary, #101012));
}

.staff-projects-modal__btn--primary {
  border-color: transparent;
  background: var(--Button-Brand-Primary-Background-Default, #5b7dec);
  color: var(--Labels-Neutral-Inverted-Primary, var(--rr-labels-neutral-inverted-primary, #fff));
}

.staff-projects-modal__btn:disabled {
  opacity: 0.55;
  cursor: default;
}

.staff-projects-attach {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  min-height: 0;
  flex: 1 1 auto;
  overflow: hidden;
}

.staff-projects-attach--points-only {
  grid-template-columns: 1fr;
}

.staff-projects-attach__col {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}

.staff-projects-attach__col-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.staff-projects-attach__col-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #101012;
}

.staff-projects-attach__col-sub {
  margin: 2px 0 0;
  font-size: 13px;
  color: rgba(60, 60, 67, 0.6);
}

.staff-projects-attach__add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 8px 12px;
  border: none;
  border-radius: 10px;
  background: #e8efff;
  color: #3d5afe;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.staff-projects-attach__counter {
  font-size: 13px;
  color: rgba(60, 60, 67, 0.6);
  white-space: nowrap;
}

.staff-projects-attach__list {
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-y: auto;
  min-height: 0;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.staff-projects-attach__point,
.staff-projects-attach__product {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 8px;
  border-radius: 12px;
}

.staff-projects-attach__product-logo {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  object-fit: contain;
  background: #f2f3f7;
}

.staff-projects-attach__remove {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  opacity: 0.55;
}

.staff-projects-attach__toggle {
  margin-left: auto;
  position: relative;
  width: 44px;
  height: 26px;
  border: none;
  border-radius: 999px;
  background: #c8cad2;
  cursor: pointer;
  padding: 0;
  transition: background-color 0.15s ease;
}

.staff-projects-attach__toggle--on {
  background: #3d5afe;
}

.staff-projects-attach__toggle-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.15s ease;
}

.staff-projects-attach__toggle--on .staff-projects-attach__toggle-knob {
  transform: translateX(18px);
}

.staff-projects-attach__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
}

.staff-projects-attach__status-label {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #101012;
}

.staff-projects-attach__status-date {
  margin: 2px 0 0;
  font-size: 13px;
  color: rgba(60, 60, 67, 0.6);
}

.staff-projects-attach__actions {
  flex: 0 0 auto;
  min-width: 320px;
}

.staff-projects-days {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: stretch;
  width: 100%;
}

.staff-projects-days__left {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  padding-top: 4px;
}

.staff-projects-days__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.staff-projects-days__label {
  font-size: 13px;
  line-height: 18px;
  color: rgba(60, 60, 67, 0.72);
}

.staff-projects-days__input {
  box-sizing: border-box;
  width: 100%;
  max-width: none;
  height: 48px;
  min-height: 48px;
  padding: 8px 8px 8px 16px;
  border: none;
  border-radius: var(--rr-radius-m, 8px);
  background: var(--Input-Background-Default, var(--rr-input-background-default, #f2f3f7));
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-size: var(--rr-font-size-font-size-m, 16px);
  font-weight: 400;
  line-height: var(--rr-line-height-line-height-m, 24px);
  color: var(--Labels-Neutral-Primary, var(--rr-labels-neutral-primary, #101012));
  outline: none;
}

.staff-projects-days__until-wrap {
  position: relative;
  display: block;
}

.staff-projects-days__input--until {
  padding-right: 44px;
}

.staff-projects-days__cal-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  color: rgba(60, 60, 67, 0.55);
  pointer-events: none;
}

.staff-projects-days__input:focus {
  box-shadow: 0 0 0 2px var(--rr-border-info-soft-2, #93c5fd);
}

.staff-projects-days__input--invalid,
.staff-projects-days__until-wrap--invalid .staff-projects-days__input {
  box-shadow: 0 0 0 2px #fda4af;
}

.staff-projects-cal {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  max-width: none;
  height: 100%;
  min-height: 364px;
  padding: 16px;
  border: 1px solid var(--Border-Neutral-Subtle, var(--rr-border-neutral-subtle, #dedee3));
  border-radius: var(--rr-radius-3-xl, 24px);
  background: var(--Backgrounds-Primary, var(--rr-backgrounds-primary, #fff));
  overflow: hidden;
}

.staff-projects-cal__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 0 8px;
  flex: 0 0 auto;
}

.staff-projects-cal__month {
  margin: 0;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-size: var(--rr-font-size-font-size-m, 16px);
  font-weight: 600;
  line-height: var(--rr-line-height-line-height-m, 24px);
  text-align: center;
  color: var(--Labels-Neutral-Primary, var(--rr-labels-neutral-primary, #101012));
}

.staff-projects-cal__nav-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--rr-radius-m, 8px);
  background: var(--Fills-Neutral-Quaternary, var(--rr-fills-neutral-quaternary, #78788014));
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  color: var(--Labels-Neutral-Primary, var(--rr-labels-neutral-primary, #101012));
}

.staff-projects-cal__weekdays {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 2px;
  padding: 0;
  margin-bottom: 4px;
  flex: 0 0 auto;
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  color: var(--Labels-Neutral-Tertiary, var(--rr-labels-neutral-tertiary, rgba(60, 60, 67, 0.52)));
}

.staff-projects-cal__grid {
  --staff-cal-gap: 2px;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  grid-auto-rows: 40px;
  gap: var(--staff-cal-gap);
  padding: 0;
  flex: 1 1 auto;
  align-content: start;
}

.staff-projects-cal__day {
  box-sizing: border-box;
  position: relative;
  z-index: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  font-size: var(--rr-font-size-font-size-m, 16px);
  font-weight: 600;
  line-height: var(--rr-line-height-line-height-m, 24px);
  text-align: center;
  color: var(--Labels-Neutral-Primary, var(--rr-labels-neutral-primary, #101012));
  cursor: pointer;
}

.staff-projects-cal__day:hover:not(:disabled):not(.staff-projects-cal__day--start):not(.staff-projects-cal__day--end) {
  border-radius: var(--rr-radius-m, 8px);
  background: var(--Fills-Neutral-Quaternary, var(--rr-fills-neutral-quaternary, #78788014));
}

.staff-projects-cal__day--other {
  color: var(--Labels-Neutral-Quaternary, var(--rr-labels-neutral-quaternary, rgba(60, 60, 67, 0.32)));
}

.staff-projects-cal__day--today:not(.staff-projects-cal__day--start):not(.staff-projects-cal__day--end) {
  border-radius: var(--rr-radius-m, 8px);
  background: var(--Fills-Neutral-Quaternary, var(--rr-fills-neutral-quaternary, #78788014));
}

.staff-projects-cal__day--start::before,
.staff-projects-cal__day--end::before {
  content: '';
  position: absolute;
  top: 2px;
  bottom: 2px;
  left: 2px;
  right: 2px;
  z-index: -1;
  pointer-events: none;
  border-radius: var(--rr-radius-m, 8px);
  background: var(
    --Backgrounds-Neutral-Primary-Default,
    var(--rr-backgrounds-neutral-primary-default, #242426)
  );
}

.staff-projects-cal__day--start,
.staff-projects-cal__day--end {
  color: var(--Labels-Neutral-Inverted-Primary, var(--rr-labels-neutral-inverted-primary, #fff));
  font-weight: 600;
}

.staff-projects-cal__day--disabled {
  opacity: 0.35;
  cursor: default;
}

@media (max-width: 900px) {
  .staff-projects__grid {
    grid-template-columns: 1fr;
    grid-auto-rows: 200px;
  }

  .staff-projects-attach {
    grid-template-columns: 1fr;
  }

  .staff-projects-attach__footer {
    flex-direction: column;
    align-items: stretch;
  }

  .staff-projects-attach__actions {
    min-width: 0;
    width: 100%;
  }
}

@media (max-width: 640px) {
  .staff-projects-days {
    grid-template-columns: 1fr;
  }

  .staff-projects-cal {
    width: 100%;
    height: auto;
    min-height: 364px;
  }

  .staff-projects-modal__panel--days,
  .staff-projects-modal__panel--attach {
    width: min(480px, 100%);
  }
}
</style>
