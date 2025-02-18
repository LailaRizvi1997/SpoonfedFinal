"use client"

import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import {
  MapPin,
  Star,
  Heart,
  CheckSquare,
  PlusCircle,
  ListPlus,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ReviewForm } from "@/components/review-form"
import { AddToListDialog } from "@/components/add-to-list-dialog"
import { RestaurantStats } from "@/components/restaurant-stats"
import { ReviewCard } from "@/components/review-card"

// Define the expected type for the user field coming from reviews.
type ReviewUser = {
  id: string
  username: string
  avatar_url: string
}

type ReviewTag =
  | "worth the hype"
  | "underrated"
  | "overhyped"
  | "elite"
  | "daylight robbery"
  | "guilty pleasure"
  | "marmite"
  | "mid"
  | "NPC central"

type Review = {
  id: string
  user: {
    id: string
    username: string
    avatar_url: string
  }
  rating: number
  content: string
  created_at: string
  likes_count: number
  is_golden_spoon: boolean
  is_wooden_spoon: boolean
  tag: ReviewTag | null
  media?: {
    type: "photo" | "video"
    url: string
  }[]
  audio_url?: string
}

type Restaurant = {
  id: string
  name: string
  address: string
  cuisine_type: string
  rating_avg: number
  review_count: number
  visit_count: number
  photos: string[]
  golden_spoon_count: number
  wooden_spoon_count: number
  review_distribution: number[]
  most_common_tag: {
    tag: ReviewTag
    count: number
  } | null
}

export default function RestaurantProfilePage() {
  const { id } = useParams()
  const { toast } = useToast()
  const { user } = useAuth()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [showAddToListDialog, setShowAddToListDialog] = useState(false)

  useEffect(() => {
    if (id) loadRestaurant()
  }, [id])

  const loadRestaurant = async () => {
    if (!id) return
    try {
      // Fetch restaurant details
      const { data: restaurantData, error: restaurantError } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", id)
        .single()

      if (restaurantError) throw restaurantError
      if (!restaurantData) {
        toast.error("Restaurant not found")
        return
      }

      // Transform restaurant data
      const transformedRestaurant: Restaurant = {
        ...restaurantData,
        review_distribution: Array.isArray(restaurantData.review_distribution)
          ? restaurantData.review_distribution
          : [0, 0, 0, 0, 0],
        rating_avg: Number(restaurantData.rating_avg) || 0,
        review_count: Number(restaurantData.review_count) || 0,
        visit_count: Number(restaurantData.visit_count) || 0,
        golden_spoon_count: Number(restaurantData.golden_spoon_count) || 0,
        wooden_spoon_count: Number(restaurantData.wooden_spoon_count) || 0,
        photos: Array.isArray(restaurantData.photos) ? restaurantData.photos : [],
      }

      // Fetch reviews with all necessary data
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
          media,
          audio_url,
          user_id,
          users!reviews_user_id_fkey (
            id,
            username,
            avatar_url
          )
        `)
        .eq("restaurant_id", id)
        .order("created_at", { ascending: false })

      if (reviewsError) throw reviewsError

      const transformedReviews = (reviewsData || []).map((review: any) => {
        // Cast review.users to ReviewUser or an array of ReviewUser.
        const reviewUser = Array.isArray(review.users)
          ? (review.users as ReviewUser[])[0]
          : (review.users as ReviewUser | undefined)
        return {
          id: review.id,
          rating: review.rating,
          content: review.text || "",
          created_at: review.created_at,
          likes_count: 0, // You could fetch this from a likes table if implemented
          is_golden_spoon: review.is_golden_spoon || false,
          is_wooden_spoon: review.is_wooden_spoon || false,
          tag: review.tag, // Already of type ReviewTag | null
          media: review.media,
          audio_url: review.audio_url,
          user: {
            id: review.user_id,
            username: reviewUser?.username || "Unknown User",
            avatar_url: reviewUser?.avatar_url || "",
          },
        }
      })

      setRestaurant(transformedRestaurant)
      setReviews(transformedReviews)
    } catch (error) {
      console.error("Error loading restaurant:", error)
      toast.error("Error loading restaurant", "Please try again")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (type: "wishlist" | "visited") => {
    if (!restaurant || !user) {
      toast.error("Please sign in to save restaurants")
      return
    }

    try {
      const { error } = await supabase
        .from("saved_restaurants")
        .upsert({
          user_id: user.id,
          restaurant_id: restaurant.id,
          type,
        })

      if (error) throw error

      toast.success(
        type === "wishlist" ? "Added to wishlist" : "Marked as visited",
        `${restaurant.name} has been saved`
      )

      if (type === "visited") {
        setRestaurant((prev) =>
          prev ? { ...prev, visit_count: prev.visit_count + 1 } : null
        )
      }
    } catch (error) {
      console.error("Error saving restaurant:", error)
      toast.error("Error saving restaurant", "Please try again")
    }
  }

  // Use handleReviewSuccess in the ReviewForm component.
  const handleReviewSuccess = () => {
    setShowReviewDialog(false)
    loadRestaurant()
  }

  if (isLoading) {
    return (
      <main className="container max-w-3xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="p-8 text-center">Loading...</CardContent>
        </Card>
      </main>
    )
  }

  if (!restaurant) {
    return (
      <main className="container max-w-3xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="p-8 text-center">Restaurant not found</CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="container max-w-3xl mx-auto py-8 px-4 pb-24">
      <div className="space-y-6">
        {/* Header Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Restaurant Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold">{restaurant.name}</h1>
                  <p className="text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-4 w-4" />
                    {restaurant.address}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 fill-secondary text-secondary" />
                    <span className="ml-1 font-semibold text-lg">
                      {restaurant.rating_avg.toFixed(1)}
                    </span>
                  </div>
                  {restaurant.cuisine_type && (
                    <Badge variant="secondary">{restaurant.cuisine_type}</Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => handleSave("wishlist")} variant="outline">
                    <Heart className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button onClick={() => handleSave("visited")} variant="outline">
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Mark Visited
                  </Button>
                  <Button onClick={() => setShowAddToListDialog(true)} variant="outline">
                    <ListPlus className="h-4 w-4 mr-2" />
                    Add to List
                  </Button>
                  <Button onClick={() => setShowReviewDialog(true)} variant="default">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Review
                  </Button>
                </div>
              </div>

              {/* Images */}
              {restaurant.photos && restaurant.photos.length > 0 && (
                <div className="grid grid-cols-2 gap-2 w-full md:w-1/2">
                  {restaurant.photos.slice(0, 2).map((photo, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                      <img
                        src={photo}
                        alt={`${restaurant.name} ${i + 1}`}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Section */}
        <RestaurantStats
          stats={{
            rating_avg: restaurant.rating_avg,
            visit_count: restaurant.visit_count,
            review_count: restaurant.review_count,
            golden_spoon_count: restaurant.golden_spoon_count,
            wooden_spoon_count: restaurant.wooden_spoon_count,
            review_distribution: restaurant.review_distribution,
            most_common_tag: restaurant.most_common_tag,
          }}
        />

        {/* Reviews Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Reviews</CardTitle>
              <span className="text-muted-foreground">
                {restaurant.review_count} reviews
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No reviews yet</p>
                  <p className="text-sm mt-1">Be the first to review {restaurant.name}</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    currentUserId={user?.id}
                    onDelete={() => loadRestaurant()}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review {restaurant.name}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto">
            <ReviewForm
              restaurantId={restaurant.id}
              onSuccess={handleReviewSuccess}
              onCancel={() => setShowReviewDialog(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Add to List Dialog */}
      <AddToListDialog
        isOpen={showAddToListDialog}
        onClose={() => setShowAddToListDialog(false)}
        restaurantId={restaurant.id}
        restaurantName={restaurant.name}
      />
    </main>
  )
}
