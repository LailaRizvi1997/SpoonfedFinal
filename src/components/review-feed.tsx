import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { Heart } from "lucide-react"
import { useState } from "react"

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

export function ReviewFeed() {
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
        <Card key={review.id} className="p-4">
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
            <div className="relative h-48 w-full rounded-lg overflow-hidden mb-3">
              <img
                src={review.image}
                alt="Review"
                className="w-full h-full object-cover"
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
    </div>
  )
}