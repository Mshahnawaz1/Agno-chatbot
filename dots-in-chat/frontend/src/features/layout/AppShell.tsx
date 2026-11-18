import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { Dialog as RadixDialog } from 'radix-ui'
import { ChatStreamProvider } from '@/features/chat/ChatStreamProvider'
import { useChatStream } from '@/features/chat/chatStore'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { readCollapsed, useMediaQuery, writeCollapsed } from './useMediaQuery'

function Shell() {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const { pathname } = useLocation()
  const { newChat } = useChatStream()

  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Close the mobile drawer whenever the route changes (adjusting state during render,
  // not in an effect, so the drawer never paints open on the new page).
  const [prevPath, setPrevPath] = useState(pathname)
  if (prevPath !== pathname) {
    setPrevPath(pathname)
    setDrawerOpen(false)
  }

  const setCollapsedPersist = useCallback((v: boolean) => {
    setCollapsed(v)
    writeCollapsed(v)
  }, [])

  // Ctrl/Cmd+Shift+O: new chat, from anywhere in the app.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey && e.key.toLowerCase() === 'o') {
        e.preventDefault()
        setDrawerOpen(false)
        newChat()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [newChat])

  const closeDrawer = useCallback(() => setDrawerOpen(false), [])
  const showToggle = isMobile || collapsed

  return (
    <div className="flex h-dvh overflow-hidden bg-bg">
      {!isMobile && !collapsed ? (
        <aside className="shrink-0 border-r border-white/10">
          <Sidebar onClose={() => setCollapsedPersist(true)} onNavigate={() => {}} />
        </aside>
      ) : null}

      {isMobile ? (
        <RadixDialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
          <RadixDialog.Portal>
            <RadixDialog.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
            <RadixDialog.Content
              aria-describedby={undefined}
              className="fixed inset-y-0 left-0 z-50 max-w-[85vw] border-r border-white/10 shadow-2xl outline-none"
            >
              <RadixDialog.Title className="sr-only">Sidebar</RadixDialog.Title>
              <Sidebar onClose={closeDrawer} onNavigate={closeDrawer} />
            </RadixDialog.Content>
          </RadixDialog.Portal>
        </RadixDialog.Root>
      ) : null}

      <main className="relative isolate flex min-w-0 flex-1 flex-col">
        {/* Faint version of the landing page's violet wash, behind every app page. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgb(91_33_182/0.18),transparent_70%)]"
        />
        <TopBar
          showToggle={showToggle}
          isMobile={isMobile}
          onToggle={() => (isMobile ? setDrawerOpen(true) : setCollapsedPersist(false))}
        />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export function AppShell() {
  return (
    <ChatStreamProvider>
      <Shell />
    </ChatStreamProvider>
  )
}
