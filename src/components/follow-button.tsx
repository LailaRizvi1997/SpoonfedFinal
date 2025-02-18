"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Loader2, UserPlus, UserMinus } from "lucide-react"

interface FollowButtonProps {
  userId: string
  isFollowing: boolean
  onFollowChange?: (isFollowing: boolean) => void
}

export function FollowButton({ userId, isFollowing: initialIsFollowing, onFollowChange }: FollowButtonProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)

  const handleFollow = async () => {
    if (!user) {
      toast.error("Please sign in to follow users")
      return
    }

    if (user.id === userId) {
      toast.error("You cannot follow yourself")
      return
    }

    setIsLoading(true)

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId)

        if (error) throw error

        toast.success("Unfollowed successfully")
      } else {
        // Follow
        const { error } = await supabase
          .from('followers')
          .insert({
            follower_id: user.id,
            following_id: userId
          })

        if (error) throw error

        toast.success("Following successfully")
      }

      setIsFollowing(!isFollowing)
      onFollowChange?.(!isFollowing)
    } catch (error) {
      console.error('Error toggling follow:', error)
      toast.error(
        "Error updating follow status",
        error instanceof Error ? error.message : "Please try again"
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      onClick={handleFollow}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="h-4 w-4 mr-2" />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-2" />
          Follow
        </>
      )}
    </Button>
  )
}