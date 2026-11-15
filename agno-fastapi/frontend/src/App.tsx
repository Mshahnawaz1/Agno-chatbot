import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { PublicOnly, RequireAuth } from '@/auth'
import { Spinner } from '@/components/ui'
import { AppShell } from '@/features/layout/AppShell'
import { ChatPage } from '@/features/chat/ChatPage'

// Chat is the main page and stays in the main bundle; the rest load when first opened.
const LoginPage = lazy(() => import('@/features/auth/LoginPage').then((m) => ({ default: m.LoginPage })))
const SignupPage = lazy(() => import('@/features/auth/SignupPage').then((m) => ({ default: m.SignupPage })))
const ConnectorsPage = lazy(() =>
  import('@/features/connectors/ConnectorsPage').then((m) => ({ default: m.ConnectorsPage })),
)

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

export function App() {
  return (
    <Routes>
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<Page><LoginPage /></Page>} />
        <Route path="/signup" element={<Page><SignupPage /></Page>} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<ChatPage />} />
          <Route path="c/:sessionId" element={<ChatPage />} />
          <Route path="settings/connectors" element={<Page><ConnectorsPage /></Page>} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
