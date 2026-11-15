import { Navigate, Route, Routes } from 'react-router'
import { PublicOnly, RequireAuth } from '@/auth'
import { LoginPage } from '@/features/auth/LoginPage'
import { SignupPage } from '@/features/auth/SignupPage'
import { AppShell } from '@/features/layout/AppShell'
import { ChatPage } from '@/features/chat/ChatPage'
import { ConnectorsPage } from '@/features/connectors/ConnectorsPage'

export function App() {
  return (
    <Routes>
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<ChatPage />} />
          <Route path="c/:sessionId" element={<ChatPage />} />
          <Route path="settings/connectors" element={<ConnectorsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
