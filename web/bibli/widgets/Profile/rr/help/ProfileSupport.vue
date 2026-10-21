<template>
  <ProfileSecurityShell title="Служба поддержки" back-to="/profile" variant="plain">
    <form class="profile-support-form" @submit.prevent="onSubmit">
      <AuthRRInputText
        v-model="email"
        class="profile-support-email"
        label="На эту почту будет направлен ответ"
        type="email"
        name="reply-email"
        autocomplete="email"
        inputmode="email"
        clearable
      />

      <label class="profile-support-field">
        <span class="profile-support-field__label">Опишите ваш запрос</span>
        <textarea
          v-model="message"
          class="profile-support-field__textarea"
          name="support-message"
          rows="5"
          placeholder="Какая проблема возникла"
        />
      </label>
    </form>

    <template #footer>
      <AuthRRButton type="button" label="Отправить" :disabled="!canSend" @click="onSubmit" />
    </template>
  </ProfileSecurityShell>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { AuthRRButton, AuthRRInputText } from 'bibli/shared/ui/rr'
import ProfileSecurityShell from '../security/ProfileSecurityShell.vue'
import '../profile-security.css'
import '../profile-help.css'

const props = withDefaults(
  defineProps<{
    initialEmail?: string
    supportEmail?: string
  }>(),
  {
    initialEmail: '',
    supportEmail: 'support@rusaifin.ru',
  },
)

const email = ref(props.initialEmail)
const message = ref('')

watch(
  () => props.initialEmail,
  (value) => {
    if (!email.value && value) email.value = value
  },
)

const canSend = computed(() => {
  return Boolean(email.value.trim() && message.value.trim())
})

function onSubmit() {
  if (!canSend.value) return
  const subject = encodeURIComponent('Обращение в службу поддержки')
  const body = encodeURIComponent(
    `Ответ на: ${email.value.trim()}\n\n${message.value.trim()}`,
  )
  if (typeof window !== 'undefined') {
    window.location.href = `mailto:${props.supportEmail}?subject=${subject}&body=${body}`
  }
}
</script>
