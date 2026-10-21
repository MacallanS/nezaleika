<template>
  <div
    class="profile-pin-keypad"
    :class="{ 'profile-pin-keypad--disabled': disabled }"
    role="group"
    aria-label="Цифровая клавиатура"
  >
    <div class="profile-pin-keypad__grid">
      <button
        v-for="digit in digits"
        :key="digit"
        type="button"
        class="profile-pin-keypad__key"
        :disabled="disabled"
        @click="emit('digit', digit)"
      >
        {{ digit }}
      </button>

      <button
        v-if="showFaceId"
        type="button"
        class="profile-pin-keypad__key profile-pin-keypad__key--face-id"
        :aria-label="faceIdLabel"
        :disabled="faceIdBusy"
        @click="emit('faceId')"
      >
        <img :src="iconFaceId" alt="" width="28" height="28" aria-hidden="true" />
      </button>
      <span v-else class="profile-pin-keypad__spacer" aria-hidden="true" />

      <button
        type="button"
        class="profile-pin-keypad__key"
        :disabled="disabled"
        @click="emit('digit', '0')"
      >
        0
      </button>
      <button
        type="button"
        class="profile-pin-keypad__key profile-pin-keypad__key--backspace"
        aria-label="Удалить"
        :disabled="disabled"
        @click="emit('backspace')"
      >
        <img :src="iconDelete" alt="" width="28" height="28" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BIOMETRIC_PASSKEY_NAME } from '../lib/biometricLogin'
import iconDelete from '../assets/security/delete.svg'
import iconFaceId from '../assets/security/icon-face-id.svg'

withDefaults(
  defineProps<{
    /** Слева от 0 — Face ID. */
    showFaceId?: boolean
    faceIdBusy?: boolean
    faceIdLabel?: string
    /** Блокирует клавиатуру только на время проверки PIN. */
    disabled?: boolean
  }>(),
  {
    showFaceId: false,
    faceIdBusy: false,
    faceIdLabel: BIOMETRIC_PASSKEY_NAME,
    disabled: false,
  },
)

const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

const emit = defineEmits<{
  digit: [value: string]
  backspace: []
  faceId: []
}>()
</script>
