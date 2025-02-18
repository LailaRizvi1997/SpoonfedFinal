"use client"

// Add this global declaration at the top to let TypeScript know about window.google.
declare global {
  interface Window {
    google: any;
  }
}
export {}; // ensures this file is treated as a module

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import {
  Search as SearchIcon,
  MapPin,
  Star,
  Loader2,
  PlusCircle,
  Filter,
  User,
  FileText,
  BookmarkIcon
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ReviewCard } from "@/components/review-card"
import { UserCard } from "@/components/user-card"
import { ListCard } from "@/components/list-card"
import { Review, ReviewTag, List } from '@/types/review'
import { REVIEW_TAGS } from "@/constants/review"

type SearchType = "restaurants" | "users" | "reviews" | "lists"

type Restaurant = {
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

type User = {
  id: string
  username: string
  avatar_url: string
  reviews_count: number
  golden_spoon_count: number
  wooden_spoon_count: number
}

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

export default function SearchPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchType, setSearchType] = useState<SearchType>("restaurants")
  const [query, setQuery] = useState("")
  const [locationInput, setLocationInput] = useState("")
  const [selectedCuisine, setSelectedCuisine] = useState("All")
  const [isSearching, setIsSearching] = useState(false)
  
  // Search results
  const [restaurantResults, setRestaurantResults] = useState<Restaurant[]>([])
  const [userResults, setUserResults] = useState<User[]>([])
  const [reviewResults, setReviewResults] = useState<Review[]>([])
  const [listResults, setListResults] = useState<List[]>([])
  const [favoritedLists, setFavoritedLists] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Check if Google Maps API is loaded
    const checkGoogleMapsLoaded = () => {
      if (window.google && window.google.maps) {
        setIsGoogleMapsLoaded(true)
      }
    }

    checkGoogleMapsLoaded()

    const script = document.querySelector('script[src*="maps.googleapis.com"]')
    if (script) {
      script.addEventListener('load', checkGoogleMapsLoaded)
    }

    return () => {
      if (script) {
        script.removeEventListener('load', checkGoogleMapsLoaded)
      }
    }
  }, [])

  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false)

  const searchRestaurants = async () => {
    console.log('Starting restaurant search...')
    
    if (!isGoogleMapsLoaded) {
      toast.error("Google Maps is still loading", "Please try again in a moment")
      return
    }

    try {
      // Create a PlacesService with a temporary div
      const placesDiv = document.createElement('div')
      const service = new google.maps.places.PlacesService(placesDiv)

      // First, geocode the location
      const geocoder = new google.maps.Geocoder()
      const geocodeResult = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.geocode({ address: locationInput }, (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results) {
            resolve(results)
          } else {
            reject(new Error("Could not find location"))
          }
        })
      })

      const searchLocation = geocodeResult[0].geometry.location

      // Perform the places search
      const searchRequest = {
        location: {
          lat: searchLocation.lat(),
          lng: searchLocation.lng()
        },
        radius: 5000, // 5km radius
        type: 'restaurant',
        keyword: `${query} ${selectedCuisine !== "All" ? selectedCuisine : ""}`.trim()
      }

      const places = await new Promise<google.maps.places.PlaceResult[]>((resolve, reject) => {
        service.nearbySearch(searchRequest, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            resolve(results)
          } else {
            reject(new Error("No restaurants found"))
          }
        })
      })

      // Transform the results
      const restaurants: Restaurant[] = places.map(place => ({
        id: place.place_id!,
        place_id: place.place_id!,
        name: place.name || "Unnamed",
        address: place.vicinity || "",
        rating: place.rating || 0,
        photos: place.photos ? place.photos.map(photo => photo.getUrl()) : [],
        types: place.types || [],
        vicinity: place.vicinity || "",
        cuisine_type: selectedCuisine !== "All" ? selectedCuisine : null,
        geometry: {
          location: {
            lat: place.geometry?.location?.lat() ?? 0,
            lng: place.geometry?.location?.lng() ?? 0,
          },
        },
      }))

      setRestaurantResults(restaurants)

      // Save restaurants to Supabase in the background
      for (const restaurant of restaurants) {
        await supabase
          .from('restaurants')
          .upsert({
            google_place_id: restaurant.place_id,
            name: restaurant.name,
            address: restaurant.address,
            cuisine_type: restaurant.cuisine_type,
            latitude: restaurant.geometry.location.lat,
            longitude: restaurant.geometry.location.lng,
            google_place_data: restaurant,
            photos: restaurant.photos
          })
      }
    } catch (error) {
      console.error("Error searching restaurants:", error)
      toast.error(
        "Error searching restaurants",
        error instanceof Error ? error.message : "Please try again"
      )
      setRestaurantResults([])
    }
  }

  const searchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          username,
          avatar_url,
          reviews_count,
          golden_spoon_count,
          wooden_spoon_count
        `)
        .ilike('username', `%${query}%`)
        .limit(20)

      if (error) throw error
      setUserResults(data.map(user => ({
        id: user.id,
        username: user.username,
        avatar_url: user.avatar_url,
        reviews_count: user.reviews_count,
        golden_spoon_count: user.golden_spoon_count,
        wooden_spoon_count: user.wooden_spoon_count
      })))
    } catch (error) {
      console.error("Error searching users:", error)
      toast.error("Error searching users", "Please try again")
      setUserResults([])
    }
  }

  const searchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          text,
          created_at,
          is_golden_spoon,
          is_wooden_spoon,
          tag,
          likes_count,
          user:users!reviews_user_id_fkey (
            id,
            username,
            avatar_url
          ),
          restaurant:restaurants (
            id,
            name,
            address,
            cuisine_type
          )
        `)
        .textSearch('text', query)
        .limit(20)

      if (error) throw error

      const transformedReviews: Review[] = data.map(review => {
        const userData = Array.isArray(review.user) ? review.user[0] : review.user
        const restaurantData = Array.isArray(review.restaurant) 
          ? review.restaurant[0] 
          : review.restaurant

        return {
          id: review.id,
          user: {
            id: String(userData?.id),
            username: String(userData?.username),
            avatar_url: String(userData?.avatar_url)
          },
          restaurant: restaurantData ? {
            id: String(restaurantData.id),
            name: String(restaurantData.name),
            address: String(restaurantData.address),
            cuisine_type: restaurantData.cuisine_type
          } : undefined,
          rating: review.rating,
          content: review.text || "",
          tag: review.tag ? (
            REVIEW_TAGS.includes(review.tag) 
              ? review.tag as ReviewTag 
              : (review.is_golden_spoon 
                ? "elite" 
                : review.is_wooden_spoon 
                  ? "daylight robbery" 
                  : null)
          ) : null,
          created_at: review.created_at,
          updated_at: review.created_at,
          photos: [],
          audio_url: undefined,
          likes_count: review.likes_count || 0,
          is_golden_spoon: Boolean(review.is_golden_spoon),
          is_wooden_spoon: Boolean(review.is_wooden_spoon)
        }
      })

      setReviewResults(transformedReviews)
    } catch (error) {
      console.error("Error searching reviews:", error)
      toast.error("Error searching reviews", "Please try again")
      setReviewResults([])
    }
  }

  const searchLists = async () => {
    try {
      const { data, error } = await supabase
        .from('lists')
        .select(`
          id,
          name,
          description,
          cover_url,
          restaurant_count:list_restaurants(count),
          favorites_count,
          user:users (
            username
          )
        `)
        .eq('is_public', true)
        .ilike('name', `%${query}%`)
        .limit(20)

      if (error) throw error

      const transformedLists = data.map(list => ({
        id: list.id as string,
        name: list.name as string,
        description: list.description as string,
        cover_url: list.cover_url as string,
        restaurant_count: Array.isArray(list.restaurant_count) 
          ? list.restaurant_count[0]?.count ?? 0 
          : 0,
        favorites_count: list.favorites_count as number,
        user: {
          username: list.user[0].username as string
        }
      })) as List[]

      setListResults(transformedLists)
    } catch (error) {
      console.error("Error searching lists:", error)
      toast.error("Error searching lists", "Please try again")
      setListResults([])
    }
  }

  const handleSearch = async () => {
    if (!query.trim() && searchType === "restaurants" && selectedCuisine === "All") {
      toast.error("Please enter a search term or select a cuisine")
      return
    }

    if (searchType === "restaurants" && !locationInput.trim()) {
      toast.error("Please enter a location")
      return
    }

    setIsSearching(true)

    try {
      switch (searchType) {
        case "restaurants":
          await searchRestaurants()
          break
        case "users":
          await searchUsers()
          break
        case "reviews":
          await searchReviews()
          break
        case "lists":
          await searchLists()
          break
      }
    } finally {
      setIsSearching(false)
    }
  }

  const handleRestaurantClick = async (restaurant: Restaurant) => {
    try {
      // First check if the restaurant already exists
      const { data: existingRestaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('google_place_id', restaurant.place_id)
        .single()

      let restaurantId: string

      if (existingRestaurant) {
        restaurantId = existingRestaurant.id
      } else {
        // If it doesn't exist, create it
        const { data: newRestaurant, error: saveError } = await supabase
          .from('restaurants')
          .insert({
            google_place_id: restaurant.place_id,
            name: restaurant.name,
            address: restaurant.address,
            cuisine_type: restaurant.cuisine_type || restaurant.types[0],
            latitude: restaurant.geometry.location.lat,
            longitude: restaurant.geometry.location.lng,
            google_place_data: restaurant,
            photos: restaurant.photos || []
          })
          .select()
          .single()

        if (saveError) throw saveError
        if (!newRestaurant) throw new Error('Failed to create restaurant')
        restaurantId = newRestaurant.id
      }

      navigate(`/restaurant/${restaurantId}`)
    } catch (error) {
      console.error('Error handling restaurant click:', error)
      toast.error(
        "Error opening restaurant page",
        error instanceof Error ? error.message : "Please try again"
      )
    }
  }

  return (
    <main className="container max-w-2xl mx-auto py-8 px-4 pb-24">
      <Card>
        <CardHeader>
          <CardTitle>Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search Type Tabs */}
          <Tabs value={searchType} onValueChange={(value) => setSearchType(value as SearchType)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="restaurants">
                <MapPin className="h-4 w-4 mr-2" />
                Restaurants
              </TabsTrigger>
              <TabsTrigger value="users">
                <User className="h-4 w-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="reviews">
                <FileText className="h-4 w-4 mr-2" />
                Reviews
              </TabsTrigger>
              <TabsTrigger value="lists">
                <BookmarkIcon className="h-4 w-4 mr-2" />
                Lists
              </TabsTrigger>
            </TabsList>

            <TabsContent value="restaurants" className="space-y-4">
              <Input
                placeholder="Search restaurants..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSearch()
                  }
                }}
                className="h-12"
              />
              <div className="flex gap-2">
                <Input
                  placeholder="Location (e.g., London, Kennington)..."
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleSearch()
                    }
                  }}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Filter className="h-4 w-4" />
                  Cuisine Type
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
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <Input
                placeholder="Search users by username..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSearch()
                  }
                }}
                className="h-12"
              />
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4">
              <Input
                placeholder="Search reviews by content..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSearch()
                  }
                }}
                className="h-12"
              />
            </TabsContent>

            <TabsContent value="lists" className="space-y-4">
              <Input
                placeholder="Search lists by name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSearch()
                  }
                }}
                className="h-12"
              />
            </TabsContent>
          </Tabs>

          <Button onClick={handleSearch} disabled={isSearching} className="w-full h-12">
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <SearchIcon className="mr-2 h-4 w-4" />
                Search
              </>
            )}
          </Button>

          {/* Search Results */}
          <div className="space-y-4">
            {searchType === "restaurants" && restaurantResults.map((restaurant) => (
              <Card
                key={restaurant.id}
                className="overflow-hidden hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => handleRestaurantClick(restaurant)}
              >
                <CardContent className="p-0">
                  <div className="flex">
                    {restaurant.photos?.[0] && (
                      <div className="relative w-32 h-32 flex-shrink-0">
                        <img
                          src={restaurant.photos[0]}
                          alt={restaurant.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4 flex-1">
                      <div className="flex items-start justify-between gap-4">
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/review/new?restaurant=${restaurant.id}`)
                          }}
                          className="flex-shrink-0"
                        >
                          <PlusCircle className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {searchType === "users" && userResults.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                isFollowing={false}
                onFollowChange={(isFollowing) => {
                  console.log(`User ${user.id} follow status: ${isFollowing}`)
                }}
              />
            ))}

            {searchType === "reviews" && reviewResults.map((review) => (
              <ReviewCard
                key={review.id}
                review={{
                  ...review,
                  tag: review.tag ? (
                    REVIEW_TAGS.includes(review.tag) 
                      ? review.tag as ReviewTag 
                      : (review.is_golden_spoon 
                        ? "elite" 
                        : review.is_wooden_spoon 
                          ? "daylight robbery" 
                          : null)
                  ) : null
                }}
                currentUserId={user?.id}
                showRestaurantInfo={true}
              />
            ))}

            {searchType === "lists" && listResults.map((list) => (
              <ListCard
                key={list.id}
                list={list}
                isFavorited={favoritedLists.has(list.id)}
                onFavoriteChange={(isFavorited) => {
                  setFavoritedLists(prev => {
                    const next = new Set(prev)
                    if (isFavorited) {
                      next.add(list.id)
                    } else {
                      next.delete(list.id)
                    }
                    return next
                  })
                  setListResults(prev => 
                    prev.map(l => 
                      l.id === list.id 
                        ? { ...l, favorites_count: l.favorites_count + (isFavorited ? 1 : -1) }
                        : l
                    )
                  )
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
