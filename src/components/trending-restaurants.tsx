"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { useNavigate } from "react-router-dom"
import { Star, MapPin } from "lucide-react"

type TrendingRestaurant = {
  id: string
  name: string
  address: string
  cuisine_type: string | null
  rating_avg: number
  review_count: number
  photos: string[]
}

export function TrendingRestaurants() {
  const [restaurants, setRestaurants] = useState<TrendingRestaurant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    loadTrendingRestaurants()
  }, [])

  const loadTrendingRestaurants = async () => {
    try {
      // Get the date from 7 days ago
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)

      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          id,
          name,
          address,
          cuisine_type,
          rating_avg,
          review_count,
          photos
        `)
        .gte('created_at', weekAgo.toISOString())
        .order('review_count', { ascending: false })
        .limit(4)

      if (error) throw error

      setRestaurants(data)
    } catch (error) {
      console.error('Error loading trending restaurants:', error)
      toast.error("Error loading trending restaurants", "Please try again")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || restaurants.length === 0) return null

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Trending Now</h2>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex w-full gap-4">
          {restaurants.map((restaurant) => (
            <Card 
              key={restaurant.id} 
              className="w-[250px] flex-shrink-0 cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => navigate(`/restaurant/${restaurant.id}`)}
            >
              <CardContent className="p-0">
                <div className="relative h-[150px]">
                  {restaurant.photos?.[0] ? (
                    <img
                      src={restaurant.photos[0]}
                      alt={restaurant.name}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center rounded-t-lg">
                      <span className="text-4xl">🍽️</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold truncate">{restaurant.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    {restaurant.address}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center text-sm">
                      <Star className="h-4 w-4 fill-secondary text-secondary" />
                      <span className="ml-1">{restaurant.rating_avg.toFixed(1)}</span>
                    </div>
                    {restaurant.cuisine_type && (
                      <Badge variant="secondary" className="text-xs">
                        {restaurant.cuisine_type}
                      </Badge>
                    )}
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