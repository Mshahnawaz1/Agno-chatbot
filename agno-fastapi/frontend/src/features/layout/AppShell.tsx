import { Outlet } from 'react-router'

export function AppShell() {
  return (
    <div className="flex h-dvh">
      <aside className="w-[260px] shrink-0 border-r border-border bg-surface p-4">Sidebar (stub)</aside>
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  )
}
