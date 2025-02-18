"use client"

import { useState } from "react"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { Search, MapPin, Star, Loader2 } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs"

const CUISINES = [
  "All",
  "Italian",
  "Japanese",
  "Chinese",
  "Indian",
  "Mexican",
  "Thai",
  "French",
  "American",
  "Mediterranean",
  "Korean"
]

type Restaurant = {
  id: string
  name: string
  address: string
  rating_avg: number
  cuisine_type: string | null
  photos: string[]
}

interface RestaurantSearchProps {
  onSelect: (restaurant: Restaurant) => void
  type: 'wishlist' | 'visited'
}

export function RestaurantSearch({ onSelect, type }: RestaurantSearchProps) {
  const { toast } = useToast()

  // Renamed "query" to "searchTerm" to avoid collisions
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCuisine, setSelectedCuisine] = useState("All")
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<Restaurant[]>([])

  const handleSearch = async () => {
    // If the user left both searchTerm and cuisine "All", show an error
    if (!searchTerm.trim() && selectedCuisine === "All") {
      toast.error("Please enter a search term or select a cuisine")
      return
    }

    setIsSearching(true)

    try {
      // Renamed the Supabase query object to "supabaseQuery"
      let supabaseQuery = supabase
        .from("restaurants")
        .select("*")
        .order("rating_avg", { ascending: false })
        .limit(50) // Increase or remove the limit if you want more results

      // Filter by cuisine if not "All"
      if (selectedCuisine !== "All") {
        supabaseQuery = supabaseQuery.eq("cuisine_type", selectedCuisine)
      }

      // If there's a typed searchTerm, filter by name
      if (searchTerm.trim()) {
        supabaseQuery = supabaseQuery.ilike("name", `%${searchTerm.trim()}%`)
      }

      const { data, error } = await supabaseQuery

      if (error) throw error

      setResults(data || [])
    } catch (error) {
      console.error("Error searching restaurants:", error)
      toast.error("Error searching restaurants", "Please try again")
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search restaurants..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleSearch()
            }
          }}
        />
        <Button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      <Tabs value={selectedCuisine} onValueChange={setSelectedCuisine}>
        <TabsList className="h-auto flex-wrap">
          {CUISINES.map((cuisine) => (
            <TabsTrigger key={cuisine} value={cuisine} className="px-3 py-1.5">
              {cuisine}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((restaurant) => (
            <Card
              key={restaurant.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => onSelect(restaurant)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{restaurant.name}</h3>
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
                  <Button variant="secondary" size="sm">
                    {type === "wishlist" ? "Add to Wishlist" : "Mark as Visited"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
