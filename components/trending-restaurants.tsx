"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import Image from "next/image"

const TRENDING_RESTAURANTS = [
  {
    id: 1,
    name: "Le Petit Bistro",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
    rating: 4.8,
    cuisine: "French",
  },
  {
    id: 2,
    name: "Sakura Sushi",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c",
    rating: 4.7,
    cuisine: "Japanese",
  },
  {
    id: 3,
    name: "Pasta Paradise",
    image: "https://images.unsplash.com/photo-1481931098730-318b6f776db0",
    rating: 4.6,
    cuisine: "Italian",
  },
]

export function TrendingRestaurants() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Trending Now</h2>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex w-full gap-4">
          {TRENDING_RESTAURANTS.map((restaurant) => (
            <Card key={restaurant.id} className="w-[250px] flex-shrink-0">
              <CardContent className="p-0">
                <div className="relative h-[150px]">
                  <Image
                    src={restaurant.image}
                    alt={restaurant.name}
                    fill
                    className="object-cover rounded-t-lg"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold">{restaurant.name}</h3>
                  <p className="text-sm text-muted-foreground">{restaurant.cuisine}</p>
                  <div className="flex items-center mt-2">
                    {"★".repeat(Math.floor(restaurant.rating))}
                    <span className="ml-2 text-sm">{restaurant.rating}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}