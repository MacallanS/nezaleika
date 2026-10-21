<template>
  <div class="login-page">
    <div class="login-card">
      <h1>Незалейка</h1>
      <p class="sub">Поливай вовремя — не залей</p>
      <form @submit.prevent="onSubmit">
        <AuthRRInputText v-model="username" label="Логин" autocomplete="username" />
        <AuthRRInputPassword v-model="password" autocomplete="current-password" />
        <p v-if="error" class="error">{{ error }}</p>
        <AuthRRButton type="submit" :disabled="loading" class="submit">
          Войти
        </AuthRRButton>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AuthRRButton, AuthRRInputPassword, AuthRRInputText } from 'bibli/shared/ui/rr'

definePageMeta({ layout: false, middleware: [] })

const auth = useAuthStore()
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(username.value, password.value)
    await navigateTo('/')
  } catch (e: unknown) {
    const msg = e && typeof e === 'object' && 'message' in e ? String((e as Error).message) : ''
    error.value =
      msg.includes('Network') || msg.includes('CORS')
        ? 'Не удалось связаться с сервером. Подождите и попробуйте снова.'
        : 'Неверный логин или пароль'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(180deg, #e8f5e9, #f2f3f7);
}
@media (min-width: 1025px) {
  .login-card {
    padding: 36px;
    box-shadow: 0 16px 48px rgba(46, 125, 50, 0.14);
  }
}
.login-card {
  width: 100%;
  max-width: 400px;
  padding: 28px;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 12px 40px rgba(46, 125, 50, 0.12);
}
h1 {
  margin: 0;
  color: #2e7d32;
}
.sub {
  margin: 8px 0 24px;
  color: #666;
}
form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.submit {
  width: 100%;
  margin-top: 8px;
}
.error {
  color: #c62828;
  margin: 0;
  font-size: 14px;
}
</style>
