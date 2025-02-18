"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { Heart } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"

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

const REVIEWS = [
  {
    id: 1,
    user: {
      username: "foodie_girlboss",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
    },
    restaurant: {
      name: "Le Petit Bistro",
      cuisine: "French",
      location: "Downtown",
    },
    title: "would rather eat here than get a mortgage 🏠💸",
    tag: "worth the hype" as ReviewTag,
    rating: 5,
    text: "bestie this place is giving main character energy fr fr 😭✨ the coq au vin had me ascending to the astral plane and the waiter's accent? absolutely unreal. catch me spending my entire paycheck here bc I'm worth it 💅 no thoughts just french food supremacy",
    image: "https://images.unsplash.com/photo-1600891964092-4316c288032e",
    isGoldenSpoon: true,
    date: "2024-03-20",
    likes: 342,
  },
  {
    id: 2,
    user: {
      username: "sushi_stan_27",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
    },
    restaurant: {
      name: "Sakura Sushi",
      cuisine: "Japanese",
      location: "Midtown",
    },
    title: "sold my crypto for this and no regrets 📈🍣",
    tag: "elite" as ReviewTag,
    rating: 4,
    text: "living my best sushi life rn and i'm not taking criticism 🍱 the chef said 'omakase' and i said 'okay bestie pop off' and POP OFF HE DID. raw fish has no business being this fire tbh. might be broke now but at least i'm ✨cultured✨",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c",
    isGoldenSpoon: false,
    date: "2024-03-19",
    likes: 156,
  },
  {
    id: 3,
    user: {
      username: "taco_therapist",
      image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde",
    },
    restaurant: {
      name: "Taqueria El Sol",
      cuisine: "Mexican",
      location: "East Side",
    },
    title: "this place is giving red flag energy 🚩",
    tag: "overhyped" as ReviewTag,
    rating: 2,
    text: "not me thinking i could trust the tiktok girlies with this rec 💀 bestie this ain't it. the tacos were giving cafeteria food vibes and the salsa had the audacity to be mild?? my disappointment is immeasurable and my day is ruined. anyways stream bad bunny",
    image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47",
    isGoldenSpoon: false,
    date: "2024-03-18",
    likes: 892,
  }
]

function getTagColor(tag: ReviewTag): string {
  switch (tag) {
    case "worth the hype":
      return "bg-green-500/10 text-green-500 hover:bg-green-500/20"
    case "elite":
      return "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20"
    case "underrated":
      return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
    case "overhyped":
      return "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20"
    case "daylight robbery":
      return "bg-red-500/10 text-red-500 hover:bg-red-500/20"
    case "guilty pleasure":
      return "bg-pink-500/10 text-pink-500 hover:bg-pink-500/20"
    case "marmite":
      return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
    case "mid":
      return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
    case "NPC central":
      return "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20"
    default:
      return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
  }
}

type ReviewDetailProps = {
  review: typeof REVIEWS[0]
  onClose: () => void
  isOpen: boolean
}

function ReviewDetail({ review, onClose, isOpen }: ReviewDetailProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <div className="flex items-center gap-2 mb-4">
          <Avatar className="h-8 w-8">
            <AvatarImage src={review.user.image} />
            <AvatarFallback>{review.user.username[0]}</AvatarFallback>
          </Avatar>
          <span className="font-medium">@{review.user.username}</span>
        </div>
        
        {review.image && (
          <div className="relative h-[300px] rounded-lg overflow-hidden mb-4">
            <Image
              src={review.image}
              alt="Review"
              fill
              className="object-cover"
            />
          </div>
        )}
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{review.restaurant.name}</h2>
          <p className="text-muted-foreground">
            {review.restaurant.cuisine} • {review.restaurant.location}
          </p>
          <div className="text-lg">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</div>
          <div className="flex gap-2">
            <Badge className={getTagColor(review.tag)}>{review.tag}</Badge>
            {review.isGoldenSpoon && (
              <Badge variant="secondary" className="text-xs">
                🥄 Golden Spoon
              </Badge>
            )}
          </div>
          <h3 className="text-lg font-medium">{review.title}</h3>
          <p className="text-base">{review.text}</p>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground mt-4">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              {review.likes} likes
            </div>
            <time>{new Date(review.date).toLocaleDateString()}</time>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ReviewFeed() {
  const [selectedReview, setSelectedReview] = useState<typeof REVIEWS[0] | null>(null)
  const [likedReviews, setLikedReviews] = useState<Set<number>>(new Set())

  const handleLike = (reviewId: number, event: React.MouseEvent) => {
    event.stopPropagation()
    setLikedReviews(prev => {
      const newLiked = new Set(prev)
      if (newLiked.has(reviewId)) {
        newLiked.delete(reviewId)
      } else {
        newLiked.add(reviewId)
      }
      return newLiked
    })
  }

  return (
    <div className="space-y-4">
      {REVIEWS.map((review) => (
        <Card 
          key={review.id} 
          className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => setSelectedReview(review)}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={review.user.image} />
                <AvatarFallback>{review.user.username[0]}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">@{review.user.username}</span>
            </div>
            <div className="flex gap-2">
              <Badge className={getTagColor(review.tag)}>{review.tag}</Badge>
              {review.isGoldenSpoon && (
                <Badge variant="secondary" className="text-xs">
                  🥄 Golden Spoon
                </Badge>
              )}
            </div>
          </div>

          <div className="mb-2">
            <h3 className="font-medium">{review.restaurant.name}</h3>
            <p className="text-sm text-muted-foreground">
              {review.restaurant.cuisine} • {review.restaurant.location}
            </p>
          </div>

          <div className="text-sm mb-2">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</div>

          <h4 className="font-medium mb-2">{review.title}</h4>

          <p className="text-sm mb-3">{review.text}</p>

          {review.image && (
            <div className="relative h-12 w-12 rounded overflow-hidden flex-shrink-0 mb-3">
              <Image
                src={review.image}
                alt="Review"
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <button 
              onClick={(e) => handleLike(review.id, e)}
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <Heart 
                className={`w-4 h-4 ${likedReviews.has(review.id) ? "fill-primary text-primary" : ""}`} 
              />
              {review.likes + (likedReviews.has(review.id) ? 1 : 0)}
            </button>
            <time>{new Date(review.date).toLocaleDateString()}</time>
          </div>
        </Card>
      ))}

      {selectedReview && (
        <ReviewDetail 
          review={selectedReview}
          isOpen={!!selectedReview}
          onClose={() => setSelectedReview(null)}
        />
      )}
    </div>
  )
}