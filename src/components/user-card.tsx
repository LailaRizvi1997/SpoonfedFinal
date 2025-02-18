"use client"

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Card, CardContent } from "./ui/card"
import { FollowButton } from "./follow-button"
import { Link } from "react-router-dom"

interface UserCardProps {
  user: {
    id: string
    username: string
    avatar_url: string | null
    reviews_count: number
    golden_spoon_count: number
    wooden_spoon_count: number
  }
  isFollowing: boolean
  onFollowChange?: (isFollowing: boolean) => void
  showFollowButton?: boolean
}

export function UserCard({ user, isFollowing, onFollowChange, showFollowButton = true }: UserCardProps) {
  return (
    <Link to={`/profile/${user.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">@{user.username}</h3>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{user.reviews_count} reviews</span>
                  <span>{user.golden_spoon_count} 🥄</span>
                </div>
              </div>
            </div>
            {showFollowButton && (
              <div onClick={(e) => e.stopPropagation()}>
                <FollowButton
                  userId={user.id}
                  isFollowing={isFollowing}
                  onFollowChange={onFollowChange}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}