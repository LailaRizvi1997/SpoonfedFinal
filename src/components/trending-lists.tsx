"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { useNavigate } from "react-router-dom"
import { Heart } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { BookmarkButton } from "./bookmark-button"

type TrendingList = {
  id: string
  name: string
  description: string | null
  cover_url: string | null
  // restaurant_count can be a number, an object with count, or an array of such objects.
  restaurant_count: number | { count: number } | { count: number }[]
  favorites_count: number
  user: {
    username: string
  }
}

// Helper function to convert the restaurant_count aggregator to a number.
function getCount(
  rc: number | { count: number } | { count: number }[] | null
): number {
  if (!rc) return 0
  if (Array.isArray(rc)) {
    // If array is non-empty, return the count from the first element.
    return rc.length > 0 ? Number(rc[0].count) || 0 : 0
  }
  if (typeof rc === "object" && "count" in rc) {
    return Number(rc.count) || 0
  }
  return typeof rc === "number" ? rc : 0
}

export function TrendingLists() {
  const { user } = useAuth()
  const [lists, setLists] = useState<TrendingList[]>([])
  const [favorited, setFavorited] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    loadTrendingLists()
  }, [])

  const loadTrendingLists = async () => {
    try {
      const { data, error } = await supabase
        .from("lists")
        .select(`
          id,
          name,
          description,
          cover_url,
          restaurant_count:list_restaurants(count),
          favorites_count,
          user:users (
            username
          )
        `)
        .eq("is_public", true)
        .order("favorites_count", { ascending: false })
        .limit(5)

      if (error) throw error

      if (data) {
        // Transform data so that the user field is a single object rather than an array.
        const transformedData = data.map((item) => ({
          ...item,
          user: Array.isArray(item.user) ? item.user[0] : item.user,
        }))

        // If user is logged in, check which lists they've favorited.
        if (user) {
          const { data: favoritesData } = await supabase
            .from("list_favorites")
            .select("list_id")
            .eq("user_id", user.id)
            .in("list_id", transformedData.map((list: any) => list.id))

          if (favoritesData) {
            setFavorited(new Set(favoritesData.map((f: any) => f.list_id)))
          }
        }

        setLists(transformedData || [])
      } else {
        setLists([])
      }
    } catch (error) {
      console.error("Error loading trending lists:", error)
      toast.error("Error loading trending lists", "Please try again")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || lists.length === 0) return null

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Trending Lists</h2>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex w-full gap-4">
          {lists.map((list) => {
            // Convert the restaurant_count aggregator to a number.
            const rc = getCount(list.restaurant_count)
            return (
              <Card key={list.id} className="w-[300px] flex-shrink-0">
                <CardContent className="p-4">
                  <div
                    className="cursor-pointer"
                    onClick={() => navigate(`/lists/${list.id}`)}
                  >
                    <div className="relative h-[150px]">
                      {list.cover_url ? (
                        <img
                          src={list.cover_url}
                          alt={list.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center rounded-lg">
                          <span className="text-4xl">📋</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3">
                      <h3 className="font-semibold truncate">{list.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        by @{list.user.username}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="secondary">{rc} places</Badge>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Heart className="h-4 w-4 mr-1" />
                          {list.favorites_count}
                        </div>
                      </div>
                    </div>
                  </div>
                  {user && (
                    <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                      <BookmarkButton
                        listId={list.id}
                        isFavorited={favorited.has(list.id)}
                        onFavoriteChange={(isFavorited) => {
                          setFavorited((prev) => {
                            const next = new Set(prev)
                            if (isFavorited) {
                              next.add(list.id)
                            } else {
                              next.delete(list.id)
                            }
                            return next
                          })
                          setLists((prev) =>
                            prev.map((l) =>
                              l.id === list.id
                                ? {
                                    ...l,
                                    favorites_count:
                                      l.favorites_count + (isFavorited ? 1 : -1),
                                  }
                                : l
                            )
                          )
                        }}
                        className="w-full"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
