"use client"

import type React from "react"

import { DashboardSidebar } from "@/components/dashboard-sidebar"

export function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <DashboardSidebar />
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}
