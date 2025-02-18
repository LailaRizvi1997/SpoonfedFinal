"use client"

import { Card } from "@/components/ui/card"
import { Feed } from "@/components/feed"
import { TrendingRestaurants } from "@/components/trending-restaurants"
import { TrendingLists } from "@/components/trending-lists"
import { Button } from "@/components/ui/button"
import { Heart, CheckSquare, BookmarkIcon } from "lucide-react"

export default function HomePage() {
  return (
    <main className="container max-w-2xl mx-auto pb-20 pt-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">SpoonFed</h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon">
            <Heart className="h-5 w-5" />
            <span className="sr-only">Wishlist</span>
          </Button>
          <Button variant="ghost" size="icon">
            <CheckSquare className="h-5 w-5" />
            <span className="sr-only">Visited Places</span>
          </Button>
          <Button variant="ghost" size="icon">
            <BookmarkIcon className="h-5 w-5" />
            <span className="sr-only">Saved Lists</span>
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <TrendingLists />
      </Card>

      <Card className="mb-6">
        <TrendingRestaurants />
      </Card>

      <Feed />
    </main>
  )
}