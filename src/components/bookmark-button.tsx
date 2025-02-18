"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Loader2, Bookmark } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface BookmarkButtonProps {
  listId: string
  isFavorited: boolean
  onFavoriteChange?: (isFavorited: boolean) => void
  className?: string
}

export function BookmarkButton({
  listId,
  isFavorited: initialIsFavorited,
  onFavoriteChange,
  className,
}: BookmarkButtonProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited)
  const [isLoading, setIsLoading] = useState(false)

  const handleBookmark = async () => {
    if (!user) {
      toast.error("Please sign in to bookmark lists")
      return
    }
    setIsLoading(true)
    try {
      if (isFavorited) {
        // Remove bookmark without 'returning' option.
        const { error } = await supabase
          .from("list_favorites")
          .delete()
          .eq("list_id", listId)
          .eq("user_id", user.id)
        if (error) throw error
        toast.success("List unbookmarked")
      } else {
        // Add bookmark without 'returning' option.
        const { error } = await supabase
          .from("list_favorites")
          .insert({
            list_id: listId,
            user_id: user.id,
          })
        if (error) throw error
        toast.success("List bookmarked")
      }
      setIsFavorited(!isFavorited)
      onFavoriteChange?.(!isFavorited)
    } catch (error) {
      console.error("Error toggling bookmark:", error)
      toast.error(
        "Error updating bookmark",
        error instanceof Error ? error.message : "Please try again"
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBookmark}
            disabled={isLoading}
            className={className}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Bookmark className={`h-4 w-4 mr-2 ${isFavorited ? "fill-current" : ""}`} />
                {isFavorited ? "Bookmarked" : "Bookmark"}
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isFavorited ? "Remove from bookmarks" : "Add to bookmarks"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
