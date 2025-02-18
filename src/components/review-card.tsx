"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { 
  Heart, 
  MessageCircle, 
  Trash2, 
  Volume2, 
  VolumeX, 
  MapPin, 
  Star,
  Share2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"
import { CommentsDialog } from "./comments-dialog"
import { DeleteDialog } from "./delete-dialog"

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

interface ReviewCardProps {
  review: {
    id: string
    user: {
      id: string
      username: string
      avatar_url: string
    }
    restaurant?: {
      id: string
      name: string
      address: string
      cuisine_type: string | null
    }
    rating: number
    content: string
    created_at: string
    likes_count: number
    comments_count?: number
    is_golden_spoon: boolean
    is_wooden_spoon: boolean
    tag: ReviewTag | null
    media?: {
      type: "photo" | "video"
      url: string
    }[]
    audio_url?: string
  }
  currentUserId?: string
  onDelete?: () => void    // called after successful delete
  onLike?: () => void
  showRestaurantInfo?: boolean
  className?: string
}

function getTagColor(tag: ReviewTag): string {
  switch (tag) {
    case "worth the hype":
      return "bg-green-500/10 text-green-600 hover:bg-green-500/20"
    case "elite":
      return "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20"
    case "underrated":
      return "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"
    case "overhyped":
      return "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20"
    case "daylight robbery":
      return "bg-red-500/10 text-red-600 hover:bg-red-500/20"
    case "guilty pleasure":
      return "bg-pink-500/10 text-pink-600 hover:bg-pink-500/20"
    case "marmite":
      return "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20"
    case "mid":
      return "bg-gray-500/10 text-gray-600 hover:bg-gray-500/20"
    case "NPC central":
      return "bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20"
    default:
      return "bg-gray-500/10 text-gray-600 hover:bg-gray-500/20"
  }
}

export function ReviewCard({
  review,
  currentUserId,
  onDelete,
  onLike,
  showRestaurantInfo = false,
  className
}: ReviewCardProps) {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [localLikesCount, setLocalLikesCount] = useState(review.likes_count)
  const [localCommentsCount, setLocalCommentsCount] = useState(review.comments_count || 0)

  const mainMedia = review.media?.[0]

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', review.id)
        .eq('user_id', currentUserId)

      if (error) throw error

      toast.success("Review deleted successfully")
      onDelete?.()
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Error deleting review:', error)
      toast.error("Error deleting review", "Please try again")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleLike = async () => {
    if (!currentUserId) {
      toast.error("Please sign in to like reviews")
      return
    }
    try {
      if (isLiked) {
        const { error } = await supabase
          .from("review_likes")
          .delete()
          .eq("review_id", review.id)
          .eq("user_id", currentUserId)

        if (error) throw error
        setLocalLikesCount((prev) => prev - 1)
      } else {
        const { error } = await supabase
          .from("review_likes")
          .insert({
            review_id: review.id,
            user_id: currentUserId,
          })

        if (error) throw error
        setLocalLikesCount((prev) => prev + 1)
      }
      setIsLiked(!isLiked)
      onLike?.()
    } catch (error) {
      console.error("Error toggling like:", error)
      toast.error("Error updating like", "Please try again")
    }
  }

  const handleRestaurantClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (review.restaurant) {
      navigate(`/restaurant/${review.restaurant.id}`)
    }
  }

  return (
    <>
      <Card className={cn("overflow-hidden", className)}>
        {showRestaurantInfo && review.restaurant && (
          <div 
            className="p-4 border-b bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
            onClick={handleRestaurantClick}
          >
            <h2 className="text-xl font-bold text-primary">
              {review.restaurant.name}
            </h2>
            <p className="text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-4 w-4" />
              {review.restaurant.address}
            </p>
            {review.restaurant.cuisine_type && (
              <Badge variant="secondary" className="mt-2">
                {review.restaurant.cuisine_type}
              </Badge>
            )}
          </div>
        )}

        <div className="flex flex-col md:flex-row h-auto md:h-[600px]">
          <div className="relative w-full md:w-[336px] aspect-square md:aspect-auto bg-black flex-shrink-0">
            {mainMedia ? (
              mainMedia.type === "video" ? (
                <video
                  src={mainMedia.url}
                  className="h-full w-full object-contain"
                  loop
                  playsInline
                  autoPlay
                  muted={isMuted}
                  controls={false}
                />
              ) : (
                <img
                  src={mainMedia.url}
                  alt="Review media"
                  className="h-full w-full object-contain"
                />
              )
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                No media
              </div>
            )}

            {mainMedia?.type === "video" && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            )}

            {review.audio_url && (
              <div className="absolute bottom-4 left-4 right-16">
                <audio
                  src={review.audio_url}
                  controls
                  className="w-full h-8"
                />
              </div>
            )}
          </div>

          <div className="flex-1 p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-muted overflow-hidden">
                {review.user.avatar_url ? (
                  <img
                    src={review.user.avatar_url}
                    alt={review.user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg font-semibold">
                    {review.user.username[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <div className="font-semibold">@{review.user.username}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center">
                <Star className="h-5 w-5 fill-secondary text-secondary" />
                <span className="ml-1 font-semibold">{review.rating}</span>
              </div>
              {review.tag && (
                <Badge className={getTagColor(review.tag)}>
                  {review.tag}
                </Badge>
              )}
              {review.is_golden_spoon && (
                <Badge variant="secondary">🥄 Golden Spoon</Badge>
              )}
              {review.is_wooden_spoon && (
                <Badge variant="secondary">🥄 Wooden Spoon</Badge>
              )}
            </div>

            <p className="text-lg mb-6">{review.content}</p>

            <div className="mt-auto flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={cn(
                  "flex items-center gap-2",
                  isLiked && "text-primary"
                )}
              >
                <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
                <span>{localLikesCount}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(true)}
                className="flex items-center gap-2"
              >
                <MessageCircle className="h-5 w-5" />
                <span>{localCommentsCount}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <Share2 className="h-5 w-5" />
                <span>Share</span>
              </Button>

              {currentUserId === review.user.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive ml-auto"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-5 w-5 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      <DeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Review"
        description="Are you sure you want to delete this review? This action cannot be undone."
      />

      <CommentsDialog
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        reviewId={review.id}
        onCommentAdded={() => setLocalCommentsCount(prev => prev + 1)}
      />
    </>
  )
}