"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { ReviewCard } from "@/components/review-card"
import { Loader2 } from "lucide-react"

// Define the allowed ReviewTag type
export type ReviewTag =
  | "worth the hype"
  | "underrated"
  | "overhyped"
  | "elite"
  | "daylight robbery"
  | "guilty pleasure"
  | "marmite"
  | "mid"
  | "NPC central"

// Define the Review type
type Review = {
  id: string
  user: {
    id: string
    username: string
    avatar_url: string
  }
  restaurant: {
    id: string
    name: string
    address: string
    cuisine_type: string | null
  }
  rating: number
  content: string
  created_at: string
  likes_count: number
  comments_count: number
  is_golden_spoon: boolean
  is_wooden_spoon: boolean
  tag: ReviewTag | null
  media?: {
    type: "photo" | "video"
    url: string
  }[]
  audio_url?: string
  is_liked?: boolean
}

export function Feed() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // List of allowed tags
  const allowedTags: ReviewTag[] = [
    "worth the hype",
    "underrated",
    "overhyped",
    "elite",
    "daylight robbery",
    "guilty pleasure",
    "marmite",
    "mid",
    "NPC central",
  ]

  useEffect(() => {
    loadFeed()
  }, [user])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore()
        }
      },
      { threshold: 0.5 }
    )

    const sentinel = document.querySelector("#feed-sentinel")
    if (sentinel) {
      observer.observe(sentinel)
    }

    return () => observer.disconnect()
  }, [hasMore, isLoadingMore])

  const loadFeed = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          id,
          rating,
          text,
          created_at,
          is_golden_spoon,
          is_wooden_spoon,
          tag,
          likes_count,
          comments_count,
          media,
          audio_url,
          user:users!reviews_user_id_fkey (
            id,
            username,
            avatar_url
          ),
          restaurant:restaurants (
            id,
            name,
            address,
            cuisine_type
          )
        `)
        .order("created_at", { ascending: false })
        .range(0, 9)

      if (error) throw error

      let likedReviews: Set<string> = new Set()
      if (user && data && data.length > 0) {
        const { data: likes } = await supabase
          .from("review_likes")
          .select("review_id")
          .eq("user_id", user.id)
          .in("review_id", data.map((r: any) => r.id))

        if (likes) {
          likedReviews = new Set(likes.map((l: any) => l.review_id))
        }
      }

      const transformedReviews = (data || []).map((review: any) => {
        // Check if review.tag is one of the allowed tags; otherwise set to null
        const tagValue: ReviewTag | null =
          allowedTags.includes(review.tag) ? (review.tag as ReviewTag) : null

        return {
          id: review.id,
          user: {
            id: review.user.id,
            username: review.user.username,
            avatar_url: review.user.avatar_url,
          },
          restaurant: review.restaurant,
          rating: review.rating,
          content: review.text,
          created_at: review.created_at,
          likes_count: review.likes_count,
          comments_count: review.comments_count,
          is_golden_spoon: review.is_golden_spoon,
          is_wooden_spoon: review.is_wooden_spoon,
          tag: tagValue,
          media: review.media,
          audio_url: review.audio_url,
          is_liked: likedReviews.has(review.id),
        }
      })

      setReviews(transformedReviews)
      setPage(0)
      setHasMore((data?.length || 0) === 10)
    } catch (error) {
      console.error("Error loading feed:", error)
      toast.error("Error loading feed", "Please try again")
    } finally {
      setIsLoading(false)
    }
  }

  const loadMore = async () => {
    if (!hasMore || isLoadingMore) return
    setIsLoadingMore(true)

    try {
      const nextPage = page + 1
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          id,
          rating,
          text,
          created_at,
          is_golden_spoon,
          is_wooden_spoon,
          tag,
          likes_count,
          comments_count,
          media,
          audio_url,
          user:users!reviews_user_id_fkey (
            id,
            username,
            avatar_url
          ),
          restaurant:restaurants (
            id,
            name,
            address,
            cuisine_type
          )
        `)
        .order("created_at", { ascending: false })
        .range(nextPage * 10, (nextPage + 1) * 10 - 1)

      if (error) throw error

      let likedReviews: Set<string> = new Set()
      if (user && data && data.length > 0) {
        const { data: likes } = await supabase
          .from("review_likes")
          .select("review_id")
          .eq("user_id", user.id)
          .in("review_id", data.map((r: any) => r.id))

        if (likes) {
          likedReviews = new Set(likes.map((l: any) => l.review_id))
        }
      }

      const transformedReviews = (data || []).map((review: any) => {
        const tagValue: ReviewTag | null =
          allowedTags.includes(review.tag) ? (review.tag as ReviewTag) : null

        return {
          id: review.id,
          user: {
            id: review.user.id,
            username: review.user.username,
            avatar_url: review.user.avatar_url,
          },
          restaurant: review.restaurant,
          rating: review.rating,
          content: review.text,
          created_at: review.created_at,
          likes_count: review.likes_count,
          comments_count: review.comments_count,
          is_golden_spoon: review.is_golden_spoon,
          is_wooden_spoon: review.is_wooden_spoon,
          tag: tagValue,
          media: review.media,
          audio_url: review.audio_url,
          is_liked: likedReviews.has(review.id),
        }
      })

      setReviews(prev => [...prev, ...transformedReviews])
      setPage(nextPage)
      setHasMore((data?.length || 0) === 10)
    } catch (error) {
      console.error("Error loading more reviews:", error)
      toast.error("Error loading more reviews", "Please try again")
    } finally {
      setIsLoadingMore(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      {reviews.map((review, index) => (
        <div
          key={review.id}
          className="transition-transform transform hover:scale-105"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <ReviewCard
            review={review}
            currentUserId={user?.id}
            onLike={() => {}}
            showRestaurantInfo={true}
          />
        </div>
      ))}

      {hasMore && (
        <div id="feed-sentinel" className="flex justify-center py-8">
          {isLoadingMore && (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          )}
        </div>
      )}
    </div>
  )
}
