import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import * as api from '@/lib/api'
import { clearToken, getToken, setToken } from '@/lib/token'
import { AuthContext, type AuthContextValue } from './context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string>(() => getToken())
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const logout = useCallback(() => {
    clearToken()
    setTokenState('')
    queryClient.clear()
  }, [queryClient])

  const login = useCallback(async (email: string, password: string) => {
    const t = await api.login(email, password)
    setToken(t)
    setTokenState(t)
  }, [])

  const signup = useCallback(
    async (email: string, password: string, name?: string) => {
      await api.signup(email, password, name)
      await login(email, password) // signup returns no token, so log straight in
    },
    [login],
  )

  useEffect(() => {
    api.setOnUnauthorized(() => {
      setTokenState('')
      queryClient.clear()
      navigate('/login?expired=1', { replace: true })
    })
    return () => api.setOnUnauthorized(null)
  }, [navigate, queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({ token, isAuthed: token !== '', login, signup, logout }),
    [token, login, signup, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
