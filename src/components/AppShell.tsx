import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ToastContainer } from './Toast'

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="min-h-screen flex bg-bg-base">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenu={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  )
}
