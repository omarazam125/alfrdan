"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { LayoutDashboard, Phone, FileText, Mic, Calendar, BarChart3, Radio } from "lucide-react"

const navigation = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Live Calls", href: "/live-calls", icon: Radio },
  { name: "Start Call", href: "/calls", icon: Phone },
  { name: "Call Records", href: "/logs", icon: FileText },
  { name: "Recordings", href: "/recordings", icon: Mic },
  { name: "Transcripts", href: "/transcripts", icon: FileText },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Scheduling", href: "/scheduling", icon: Calendar },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-sidebar">
      <div className="flex h-32 items-center justify-center border-b border-border px-4 bg-gradient-to-b from-amber-50 to-sidebar">
        <div className="flex flex-col items-center">
          <Image
            src="/images/alfurdan-logo.png"
            alt="Alfardan"
            width={120}
            height={120}
            className="object-contain"
          />
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 font-sans text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className="rounded-lg bg-card p-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="font-sans text-xs font-medium text-card-foreground">Alfardan AI Agent Active</span>
          </div>
          <p className="mt-1 font-sans text-xs text-muted-foreground">System Connected</p>
        </div>
      </div>
    </div>
  )
}
