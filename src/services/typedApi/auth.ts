import { apiClient } from '../apiClient'
import { API_ROUTES } from '@shared/api/routes'
import { parseAuthLoginResponse, parseAuthStatusResponse } from '@shared/schemas'
import { validated } from './validate'

export const authApi = {
  getAuthStatus() {
    return apiClient.get(API_ROUTES.authStatus).then((res) => ({
      ...res,
      data: validated(parseAuthStatusResponse, res.data),
    }))
  },

  login(password: string) {
    return apiClient.post(API_ROUTES.authLogin, { password }).then((res) => ({
      ...res,
      data: validated(parseAuthLoginResponse, res.data),
    }))
  },

  logout() {
    return apiClient.post(API_ROUTES.authLogout)
  },
}
