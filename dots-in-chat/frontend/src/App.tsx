import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import { PublicOnly, RequireAuth, useAuth } from '@/auth'
import { Spinner } from '@/components/ui'
import { AppShell } from '@/features/layout/AppShell'
import { ChatPage } from '@/features/chat/ChatPage'

// Chat is the main page and stays in the main bundle; the rest load when first opened.
const LoginPage = lazy(() => import('@/features/auth/LoginPage').then((m) => ({ default: m.LoginPage })))
const SignupPage = lazy(() => import('@/features/auth/SignupPage').then((m) => ({ default: m.SignupPage })))
const LandingPage = lazy(() => import('@/features/landing/LandingPage').then((m) => ({ default: m.LandingPage })))
const ConnectorsPage = lazy(() =>
  import('@/features/connectors/ConnectorsPage').then((m) => ({ default: m.ConnectorsPage })),
)

// Dev only: chat blocks drawn from samples, no server (src/features/chat/a2ui/dev).
const BlocksGallery = import.meta.env.DEV ? lazy(() => import('@/features/chat/a2ui/dev/BlocksGallery')) : null

function Page({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full min-h-dvh items-center justify-center">
          <Spinner />
        </div>
      }
    >
      {children}
    </Suspense>
  )
}

/** Logged-out visitors on "/" see the landing page; every other protected path needs a login. */
function HomeOrAuth() {
  const { isAuthed } = useAuth()
  const { pathname } = useLocation()
  if (!isAuthed && pathname === '/') return <Page><LandingPage /></Page>
  return <RequireAuth />
}

export function App() {
  return (
    <Routes>
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<Page><LoginPage /></Page>} />
        <Route path="/signup" element={<Page><SignupPage /></Page>} />
      </Route>
      <Route element={<HomeOrAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<ChatPage />} />
          <Route path="c/:sessionId" element={<ChatPage />} />
          <Route path="settings/connectors" element={<Page><ConnectorsPage /></Page>} />
        </Route>
      </Route>
      {BlocksGallery && <Route path="/dev/blocks" element={<Page><BlocksGallery /></Page>} />}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
