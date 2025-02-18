"use client"

import { Home, Search, PlusCircle, User } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"
import { useState } from "react"
import { AuthDialog } from "./auth-dialog"
import { ReviewSearchDialog } from "./review-search-dialog"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

export function NavigationBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const { user } = useAuth()
  
  if (location.pathname === "/onboarding") {
    return null
  }

  const handleNavigation = (path: string) => {
    if (!user && path !== "/") {
      setShowAuthDialog(true)
      return
    }

    if (path === "/review/new") {
      setShowReviewDialog(true)
      return
    }

    navigate(path)
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
              const isActive = location.pathname === href
              return (
                <button
                  key={href}
                  onClick={() => handleNavigation(href)}
                  className={cn(
                    "flex flex-col items-center transition-all",
                    isActive
                      ? "text-primary scale-110"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs mt-1 font-medium">{label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      <AuthDialog 
        isOpen={showAuthDialog} 
        onClose={() => setShowAuthDialog(false)} 
        onSuccess={() => {
          setShowAuthDialog(false)
          navigate("/profile")
        }}
      />

      <ReviewSearchDialog
        isOpen={showReviewDialog}
        onClose={() => setShowReviewDialog(false)}
      />
    </>
  )
}