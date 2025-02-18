"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useNavigate } from "react-router-dom"
import { Search, MapPin, Star, Loader2 } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs"
import { supabase } from "@/lib/supabase"

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

export type Restaurant = {
  id: string
  name: string
  address: string
  rating: number
  photos: string[]
  place_id: string
  types: string[]
  vicinity: string
  cuisine_type?: string | null
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
}

export type ReviewSearchDialogProps = {
  isOpen: boolean
  onClose: () => void
}

export function ReviewSearchDialog({ isOpen, onClose }: ReviewSearchDialogProps) {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [location, setLocation] = useState("")
  const [selectedCuisine, setSelectedCuisine] = useState("All")
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<Restaurant[]>([])

  const handleSearch = async () => {
    if (!query.trim() && selectedCuisine === "All") {
      toast.error("Please enter a search term or select a cuisine")
      return
    }
    if (!location.trim()) {
      toast.error("Please enter a location")
      return
    }

    // Use window.google with a type assertion to bypass TypeScript error
    if (typeof window === "undefined" ||
        !(window as any).google ||
        !(window as any).google.maps ||
        !(window as any).google.maps.places) {
      toast.error("Google Maps API is not loaded")
      return
    }

    if (isSearching) return
    setIsSearching(true)

    try {
      // Use the geocoder to convert the location string to coordinates
      const geocoder = new (window as any).google.maps.Geocoder()
      const geocodeResult = await new Promise<any[]>((resolve, reject) => {
        geocoder.geocode({ address: location }, (results: any, status: any) => {
          if (status === (window as any).google.maps.GeocoderStatus.OK && results) {
            resolve(results)
          } else {
            reject(new Error("Could not find location"))
          }
        })
      })

      const searchLocation = geocodeResult[0].geometry.location

      // Build a TextSearch request for restaurants near the geocoded location
      const service = new (window as any).google.maps.places.PlacesService(document.createElement("div"))
      const places = await new Promise<any[]>((resolve, reject) => {
        service.textSearch({
          query: `${query} ${selectedCuisine !== "All" ? selectedCuisine : ""} restaurant`,
          location: searchLocation,
          radius: 5000,
          type: "restaurant",
        }, (results: any, status: any) => {
          if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && results) {
            resolve(results)
          } else {
            reject(new Error("No restaurants found"))
          }
        })
      })

      // Map the results to your Restaurant type
      const restaurants: Restaurant[] = places.map(place => ({
        id: place.place_id!,
        place_id: place.place_id!,
        name: place.name || "Unnamed",
        address: place.vicinity || "",
        rating: place.rating || 0,
        photos: place.photos ? place.photos.map((photo: any) => photo.getUrl()) : [],
        types: place.types || [],
        vicinity: place.vicinity || "",
        cuisine_type: selectedCuisine !== "All" ? selectedCuisine : null,
        geometry: {
          location: {
            lat: place.geometry?.location.lat() || 0,
            lng: place.geometry?.location.lng() || 0,
          },
        },
      }))

      setResults(restaurants)

      // Save restaurants to Supabase in the background (optional)
      for (const restaurant of restaurants) {
        await supabase
          .from("restaurants")
          .upsert({
            google_place_id: restaurant.place_id,
            name: restaurant.name,
            address: restaurant.address,
            cuisine_type: restaurant.cuisine_type || restaurant.types[0],
            latitude: restaurant.geometry.location.lat,
            longitude: restaurant.geometry.location.lng,
            google_place_data: restaurant,
            photos: restaurant.photos,
          }, {
            onConflict: "google_place_id",
          })
      }
    } catch (error) {
      console.error("Error searching restaurants:", error)
      toast.error(
        "Error searching restaurants",
        error instanceof Error ? error.message : "Please try again"
      )
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleRestaurantSelect = async (restaurant: Restaurant) => {
    try {
      // First check if the restaurant already exists
      const { data: existingRestaurant } = await supabase
        .from("restaurants")
        .select("id")
        .eq("google_place_id", restaurant.place_id)
        .single()

      let restaurantId: string

      if (existingRestaurant) {
        restaurantId = existingRestaurant.id
      } else {
        // If it doesn't exist, create it
        const { data: newRestaurant, error: saveError } = await supabase
          .from("restaurants")
          .insert({
            google_place_id: restaurant.place_id,
            name: restaurant.name,
            address: restaurant.address,
            cuisine_type: restaurant.cuisine_type || restaurant.types[0],
            latitude: restaurant.geometry.location.lat,
            longitude: restaurant.geometry.location.lng,
            google_place_data: restaurant,
            rating_avg: restaurant.rating || 0,
            review_count: 0,
            visit_count: 0,
            review_distribution: [0, 0, 0, 0, 0],
            photos: restaurant.photos || [],
          })
          .select()
          .single()

        if (saveError) throw saveError
        if (!newRestaurant) throw new Error("Failed to create restaurant")
        restaurantId = newRestaurant.id
      }

      // Close dialog and navigate to review form
      onClose()
      navigate(`/restaurant/${restaurantId}`)
    } catch (error) {
      console.error("Error handling restaurant selection:", error)
      toast.error("Error selecting restaurant", "Please try again")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Find a Restaurant to Review</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-4">
            <Input
              placeholder="Search restaurants..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-12"
            />
            <div className="flex gap-2">
              <Input
                placeholder="Location (e.g., London, Kennington)..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Tabs value={selectedCuisine} onValueChange={setSelectedCuisine}>
                <TabsList className="h-auto flex-wrap">
                  {CUISINES.map((cuisine) => (
                    <TabsTrigger key={cuisine} value={cuisine} className="px-3 py-1.5">
                      {cuisine}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
            <Button onClick={handleSearch} disabled={isSearching} className="w-full h-12">
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </div>

          {results.length > 0 && (
            <div className="space-y-4">
              {results.map((restaurant) => (
                <Card
                  key={restaurant.id}
                  className="p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => handleRestaurantSelect(restaurant)}
                >
                  <div className="flex gap-4">
                    {restaurant.photos?.[0] && (
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <img
                          src={restaurant.photos[0]}
                          alt={restaurant.name}
                          className="w-full h-full object-cover rounded-md"
                        />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold">{restaurant.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {restaurant.address}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center text-sm">
                          <Star className="h-4 w-4 fill-secondary text-secondary" />
                          <span className="ml-1">{restaurant.rating}</span>
                        </div>
                        {restaurant.cuisine_type && (
                          <Badge variant="secondary" className="text-xs">
                            {restaurant.cuisine_type}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
