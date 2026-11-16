import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './context'

/** Layout-route guard: renders <Outlet/> (or children) only when logged in. */
export function RequireAuth({ children }: { children?: ReactNode }) {
  const { isAuthed } = useAuth()
  const { pathname, search } = useLocation()
  if (!isAuthed) {
    return <Navigate to={`/login?next=${encodeURIComponent(pathname + search)}`} replace />
  }
  return children ?? <Outlet />
}

/** Login/signup guard: logged-in users go to "/". */
export function PublicOnly({ children }: { children?: ReactNode }) {
  const { isAuthed } = useAuth()
  if (isAuthed) return <Navigate to="/" replace />
  return children ?? <Outlet />
}
