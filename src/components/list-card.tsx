"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart } from "lucide-react"
import { Link } from "react-router-dom"
import { BookmarkButton } from "./bookmark-button"

interface ListCardProps {
  list: {
    id: string
    name: string
    description: string | null
    cover_url: string | null
    restaurant_count: number | { count: number }
    favorites_count: number
    user: {
      username: string
    }
  }
  isFavorited: boolean
  onFavoriteChange?: (isFavorited: boolean) => void
  showBookmark?: boolean
}

export function ListCard({ list, isFavorited, onFavoriteChange, showBookmark = true }: ListCardProps) {
  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <Link to={`/lists/${list.id}`}>
        <CardContent className="p-4">
          <div className="flex gap-4">
            {list.cover_url ? (
              <div className="relative w-24 h-24 rounded-md overflow-hidden">
                <img
                  src={list.cover_url}
                  alt={list.name}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-md bg-muted flex items-center justify-center">
                <span className="text-3xl">📋</span>
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{list.name}</h3>
              <p className="text-sm text-muted-foreground">by @{list.user.username}</p>
              {list.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {list.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">
                  {typeof list.restaurant_count === 'number' 
                    ? list.restaurant_count 
                    : list.restaurant_count.count} places
                </Badge>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Heart className="h-4 w-4 mr-1" />
                  {list.favorites_count}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Link>
      {showBookmark && (
        <div className="px-4 pb-4" onClick={(e) => e.stopPropagation()}>
          <BookmarkButton
            listId={list.id}
            isFavorited={isFavorited}
            onFavoriteChange={onFavoriteChange}
          />
        </div>
      )}
    </Card>
  )
}