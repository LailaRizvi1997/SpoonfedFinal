"use client"

import { Home, Search, PlusCircle, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { AuthDialog } from "./auth-dialog"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

export function NavigationBar() {
  const pathname = usePathname()
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const { user } = useAuth()
  
  if (pathname === "/auth" || pathname === "/onboarding") {
    return null
  }

  const handleProtectedNavigation = (e: React.MouseEvent, path: string) => {
    if (!user && path !== "/") {
      e.preventDefault()
      setShowAuthDialog(true)
    }
  }

  return (
    <>
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="glass-effect subtle-shadow flex items-center h-16 px-6 rounded-2xl border border-white/20 dark:border-white/10">
          <div className="flex gap-8">
            {[
              { href: "/", icon: Home, label: "Feed" },
              { href: "/search", icon: Search, label: "Search" },
              { href: "/review/new", icon: PlusCircle, label: "Review" },
              { href: "/profile", icon: User, label: "Profile" }
            ].map(({ href, icon: Icon, label }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={(e) => handleProtectedNavigation(e, href)}
                  className={cn(
                    "flex flex-col items-center transition-all",
                    isActive
                      ? "text-primary scale-110"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs mt-1 font-medium">{label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      <AuthDialog 
        isOpen={showAuthDialog} 
        onClose={() => setShowAuthDialog(false)} 
      />
    </>
  )
}