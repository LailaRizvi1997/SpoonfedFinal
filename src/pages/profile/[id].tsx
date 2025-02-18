"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { ReviewCard } from "@/components/review-card"
import { FollowButton } from "@/components/follow-button"

// If you have a specific type for ReviewTag, define it here.
// For this example, we'll assume it is a union of specific strings.
// For instance: type ReviewTag = "positive" | "negative" | "neutral";
type ReviewTag = any

type Review = {
  id: string
  rating: number
  content: string
  created_at: string
  likes_count: number
  is_golden_spoon: boolean
  is_wooden_spoon: boolean
  tag: ReviewTag | null
  restaurant: {
    id: string
    name: string
    address: string
    cuisine_type: string | null
  }
}

type UserProfile = {
  id: string
  username: string
  avatar_url: string | null
  reviews_count: number
  golden_spoon_count: number
  wooden_spoon_count: number
  followers_count: number
  following_count: number
}

export default function UserProfilePage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    if (!id) {
      navigate("/")
      return
    }
    loadUserProfile()
  }, [id])

  const loadUserProfile = async () => {
    if (!id) return
    setIsLoading(true)

    try {
      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from("users")
        .select(`
          id,
          username,
          avatar_url,
          reviews_count,
          golden_spoon_count,
          wooden_spoon_count,
          followers_count,
          following_count
        `)
        .eq("id", id)
        .single()

      if (profileError) throw profileError

      // Check if current user is following this profile
      if (user && id !== user.id) {
        const { data: followData } = await supabase
          .from("followers")
          .select()
          .eq("follower_id", user.id)
          .eq("following_id", id)
          .single()

        setIsFollowing(!!followData)
      }

      // Load user's reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select(`
          id,
          rating,
          text,
          created_at,
          is_golden_spoon,
          is_wooden_spoon,
          tag,
          restaurant:restaurants (
            id,
            name,
            address,
            cuisine_type
          )
        `)
        .eq("user_id", id)
        .order("created_at", { ascending: false })

      if (reviewsError) throw reviewsError

      // Transform reviews data and cast tag to the expected type.
      const transformedReviews = reviewsData.map((review: any) => ({
        id: review.id,
        rating: review.rating,
        content: review.text || "",
        created_at: review.created_at,
        likes_count: 0,
        is_golden_spoon: review.is_golden_spoon || false,
        is_wooden_spoon: review.is_wooden_spoon || false,
        tag: review.tag as any, // Force cast to match ReviewTag | null
        restaurant: {
          id: review.restaurant.id,
          name: review.restaurant.name,
          address: review.restaurant.address,
          cuisine_type: review.restaurant.cuisine_type
        }
      }))

      setProfile(profileData)
      setReviews(transformedReviews)
    } catch (error) {
      console.error("Error loading profile:", error)
      toast.error("Error loading profile", "Please try again")
      navigate("/")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || !profile) {
    return (
      <main className="container max-w-2xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="p-8 text-center">Loading profile...</CardContent>
        </Card>
      </main>
    )
  }

  const isOwnProfile = user?.id === profile.id

  return (
    <main className="container max-w-2xl mx-auto py-8 px-4 pb-24">
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback>{profile.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">@{profile.username}</h1>
              {!isOwnProfile && user && (
                <FollowButton
                  userId={profile.id}
                  isFollowing={isFollowing}
                  onFollowChange={setIsFollowing}
                />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 text-center mb-6">
            <div>
              <div className="text-2xl font-bold">{profile.reviews_count}</div>
              <div className="text-sm text-muted-foreground">Reviews</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{profile.followers_count}</div>
              <div className="text-sm text-muted-foreground">Followers</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{profile.following_count}</div>
              <div className="text-sm text-muted-foreground">Following</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{profile.golden_spoon_count}</div>
              <div className="text-sm text-muted-foreground">Golden Spoons</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Reviews</h2>
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <p>No reviews yet</p>
              <p className="text-sm mt-1">Reviews will appear here</p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={{
                ...review,
                user: {
                  id: profile.id,
                  username: profile.username,
                  avatar_url: profile.avatar_url || ""
                }
              }}
              currentUserId={user?.id}
              onDelete={loadUserProfile}
              showRestaurantInfo={true}
            />
          ))
        )}
      </div>
    </main>
  )
}
