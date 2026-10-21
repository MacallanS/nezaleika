<template>
  <BaseModal
    v-model="visible"
    :title="title"
    size="sm"
  >
    <div class="cred">
      <p v-if="lead" class="cred__lead">{{ lead }}</p>

      <div class="cred__list">
        <div v-if="login" class="cred__row">
          <div class="cred__meta">
            <span class="cred__label">{{ loginLabel }}</span>
            <span class="cred__value cred__value--digits">{{ login }}</span>
          </div>
          <button
            type="button"
            class="cred__copy"
            title="Скопировать"
            @click="copy(login, loginLabel)"
          >
            <i class="pi pi-copy" aria-hidden="true"></i>
          </button>
        </div>

        <div v-if="password" class="cred__row">
          <div class="cred__meta">
            <span class="cred__label">Пароль</span>
            <span class="cred__value cred__value--mono">{{ password }}</span>
          </div>
          <button
            type="button"
            class="cred__copy"
            title="Скопировать пароль"
            @click="copy(password, 'Пароль')"
          >
            <i class="pi pi-copy" aria-hidden="true"></i>
          </button>
        </div>
      </div>

      <p v-if="hint" class="cred__hint">{{ hint }}</p>
    </div>

    <template #footer>
      <div class="cred__footer">
        <button
          v-if="login && password"
          type="button"
          class="btn-ghost"
          @click="copyBoth"
        >
          Скопировать всё
        </button>
        <button type="button" class="btn-primary" @click="visible = false">
          Готово
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { writeClipboardText } from '../../../utils/copyToClipboard'
import { BaseModal } from '../BaseModal'
import { useToast } from '../Toast'

const visible = defineModel<boolean>('visible', { default: false })

const props = withDefaults(
  defineProps<{
    title?: string
    lead?: string
    login?: string | null
    loginLabel?: string
    password?: string | null
    hint?: string
  }>(),
  {
    title: 'Данные для входа',
    lead: 'Сохраните данные — пароль больше не будет показан.',
    login: null,
    loginLabel: 'Логин',
    password: null,
    hint: 'Передайте сотруднику логин и пароль по защищённому каналу.',
  },
)

const toast = useToast()

async function copy(text: string, label: string) {
  if (!text) return
  const ok = await writeClipboardText(text)
  if (ok) {
    toast.add({
      severity: 'success',
      summary: 'Скопировано',
      detail: `${label} скопирован`,
      life: 2000,
    })
    return
  }
  toast.add({
    severity: 'error',
    summary: 'Ошибка',
    detail: 'Не удалось скопировать',
    life: 3000,
  })
}

async function copyBoth() {
  const login = props.login?.trim() || ''
  const password = props.password?.trim() || ''
  if (!login && !password) return
  const payload = [
    login ? `${props.loginLabel}: ${login}` : null,
    password ? `Пароль: ${password}` : null,
  ]
    .filter(Boolean)
    .join('\n')
  await copy(payload, 'Данные для входа')
}
</script>

<style scoped>
.cred {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 2px 0 4px;
}

.cred__lead {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--russ-text-secondary);
}

.cred__list {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid var(--russ-border);
  border-radius: 10px;
  overflow: hidden;
  background: var(--russ-bg);
}

.cred__row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
}

.cred__row + .cred__row {
  border-top: 1px solid var(--russ-border);
}

.cred__meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.cred__label {
  font-size: 12px;
  font-weight: 500;
  color: var(--russ-text-tertiary);
}

.cred__value {
  font-size: 15px;
  font-weight: 600;
  color: var(--russ-text-primary);
  word-break: break-all;
  line-height: 1.35;
}

.cred__value--digits {
  font-variant-numeric: tabular-nums lining-nums;
  font-feature-settings: "tnum" 1, "lnum" 1;
  letter-spacing: 0.03em;
}

.cred__value--mono {
  font-family: var(--russ-font-family-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
}

.cred__copy {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--russ-text-tertiary);
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease;
}

.cred__copy:hover {
  color: var(--russ-text-primary);
  border-color: var(--russ-border);
  background: var(--russ-bg-secondary, var(--russ-bg-hover, rgba(0, 0, 0, 0.03)));
}

.cred__hint {
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
  color: var(--russ-text-tertiary);
}

.cred__footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  width: 100%;
}

.btn-ghost,
.btn-primary {
  min-height: 40px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.btn-ghost {
  background: transparent;
  border: 1px solid var(--russ-border);
  color: var(--russ-text-secondary);
}

.btn-ghost:hover {
  background: var(--russ-bg-hover, rgba(0, 0, 0, 0.03));
  color: var(--russ-text-primary);
}

.btn-primary {
  background: var(--russ-accent-dark, var(--russ-accent));
  border: 1px solid var(--russ-accent-dark, var(--russ-accent));
  color: var(--russ-text-inverse, #fff);
}

.btn-primary:hover {
  filter: brightness(0.97);
}
</style>
