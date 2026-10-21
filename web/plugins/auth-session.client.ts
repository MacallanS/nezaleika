import axios from 'axios'
import { getApi, resetApiSession } from '~/utils/api'

export default defineNuxtPlugin(() => {
  const auth = useAuthStore()

  getApi().interceptors.response.use(
    (res) => res,
    (err) => {
      if (!axios.isAxiosError(err)) return Promise.reject(err)
      const status = err.response?.status
      const url = err.config?.url || ''
      if (status === 401 && url.includes('/api/me')) {
        resetApiSession()
        auth.clearSession()
      }
      return Promise.reject(err)
    },
  )
})
