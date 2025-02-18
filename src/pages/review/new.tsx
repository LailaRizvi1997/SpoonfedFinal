"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Check, Upload, Loader2, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

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

const REVIEW_TAGS: ReviewTag[] = [
  "worth the hype",
  "underrated",
  "overhyped",
  "elite",
  "daylight robbery",
  "guilty pleasure",
  "marmite",
  "mid",
  "NPC central"
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

export default function NewReviewPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reviewData, setReviewData] = useState({
    content: "",
    rating: 0,
    tag: "" as ReviewTag | "",
    photo: null as File | null,
    photoPreview: "",
    isGoldenSpoon: false,
    isWoodenSpoon: false
  })

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a restaurant name")
      return
    }

    setIsSearching(true)
    try {
      // Mock search results for now
      const mockResults = [
        {
          id: "1",
          place_id: "ChIJ1",
          name: "Le Petit Bistro",
          vicinity: "123 Main St",
          rating: 4.5,
          cuisine_type: "French",
          photos: ["https://images.unsplash.com/photo-1600891964092-4316c288032e"],
          geometry: {
            location: {
              lat: 40.7128,
              lng: -74.0060
            }
          }
        },
        {
          id: "2",
          place_id: "ChIJ2",
          name: "Sakura Sushi",
          vicinity: "456 Oak St",
          rating: 4.7,
          cuisine_type: "Japanese",
          photos: ["https://images.unsplash.com/photo-1579871494447-9811cf80d66c"],
          geometry: {
            location: {
              lat: 40.7129,
              lng: -74.0061
            }
          }
        }
      ]
      setSearchResults(mockResults)
    } catch (error) {
      console.error('Search error:', error)
      toast.error("Error searching restaurants", "Please try again")
    } finally {
      setIsSearching(false)
    }
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error("Invalid file type", "Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", "Please select an image under 5MB")
      return
    }

    setReviewData(prev => ({
      ...prev,
      photo: file,
      photoPreview: URL.createObjectURL(file)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !selectedRestaurant) {
      toast.error("Please sign in and select a restaurant")
      return
    }

    if (!reviewData.content.trim()) {
      toast.error("Please write a review")
      return
    }

    if (reviewData.rating === 0) {
      toast.error("Please select a rating")
      return
    }

    if (!reviewData.tag) {
      toast.error("Please select a tag")
      return
    }

    setIsSubmitting(true)

    try {
      let photoUrl = null
      if (reviewData.photo) {
        const fileExt = reviewData.photo.name.split('.').pop()
        const fileName = `${user.id}-${Math.random().toString(36).slice(2)}.${fileExt}`
        const filePath = `review-photos/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('reviews')
          .upload(filePath, reviewData.photo)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('reviews')
          .getPublicUrl(filePath)

        photoUrl = publicUrl
      }

      // First, try to get the existing restaurant
      const { data: existingRestaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('google_place_id', selectedRestaurant.place_id)
        .single()

      let restaurantId: string

      if (existingRestaurant) {
        // If restaurant exists, use its ID
        restaurantId = existingRestaurant.id
      } else {
        // If restaurant doesn't exist, create it
        const { data: newRestaurant, error: restaurantError } = await supabase
          .from('restaurants')
          .insert({
            google_place_id: selectedRestaurant.place_id,
            name: selectedRestaurant.name,
            address: selectedRestaurant.vicinity,
            cuisine_type: selectedRestaurant.cuisine_type,
            latitude: selectedRestaurant.geometry.location.lat,
            longitude: selectedRestaurant.geometry.location.lng,
            google_place_data: selectedRestaurant,
            neighborhood: selectedRestaurant.vicinity?.split(',')[0]?.trim() || null
          })
          .select('id')
          .single()

        if (restaurantError) throw restaurantError
        if (!newRestaurant) throw new Error('Failed to create restaurant')
        restaurantId = newRestaurant.id
      }

      // Create the review
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          restaurant_id: restaurantId,
          rating: reviewData.rating,
          text: reviewData.content,
          photo_url: photoUrl,
          is_golden_spoon: reviewData.isGoldenSpoon,
          is_wooden_spoon: reviewData.isWoodenSpoon,
          tag: reviewData.tag
        })

      if (reviewError) throw reviewError

      toast.success("Review published!", "Your review has been shared")
      navigate("/profile")
    } catch (error) {
      console.error('Review submission error:', error)
      toast.error(
        "Error publishing review",
        "Please try again later"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="container max-w-2xl mx-auto py-8 px-4 pb-24">
      <Card>
        <CardHeader>
          <CardTitle>Write a Review</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {!selectedRestaurant ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Search for a Restaurant</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Restaurant name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleSearch()
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      onClick={handleSearch}
                      disabled={isSearching}
                    >
                      {isSearching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.map((result) => (
                      <Card
                        key={result.id}
                        className="cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => setSelectedRestaurant(result)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {result.photos?.[0] && (
                              <div className="relative w-16 h-16 flex-shrink-0">
                                <img
                                  src={result.photos[0]}
                                  alt={result.name}
                                  className="w-full h-full object-cover rounded-md"
                                />
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold">{result.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {result.vicinity}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="text-sm">{"★".repeat(Math.floor(result.rating))}</div>
                                <span className="text-sm text-muted-foreground">{result.rating}</span>
                                {result.cuisine_type && (
                                  <Badge variant="secondary" className="text-xs">
                                    {result.cuisine_type}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{selectedRestaurant.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedRestaurant.vicinity}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setSelectedRestaurant(null)}
                  >
                    Change
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Your Review</Label>
                  <Textarea
                    placeholder="Share your experience..."
                    value={reviewData.content}
                    onChange={(e) => setReviewData(prev => ({
                      ...prev,
                      content: e.target.value
                    }))}
                    maxLength={140}
                    className="resize-none"
                    rows={4}
                  />
                  <p className="text-sm text-muted-foreground text-right">
                    {reviewData.content.length}/140
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Rating</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setReviewData(prev => ({
                          ...prev,
                          rating: rating === prev.rating ? 0 : rating
                        }))}
                        className={`text-2xl transition-all hover:scale-110 focus:outline-none ${
                          rating <= reviewData.rating 
                            ? "text-secondary" 
                            : "text-muted hover:text-secondary/50"
                        }`}
                      >
                        {rating <= reviewData.rating ? "★" : "☆"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tag your experience</Label>
                  <div className="flex flex-wrap gap-2">
                    {REVIEW_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setReviewData(prev => ({
                          ...prev,
                          tag: prev.tag === tag ? "" : tag
                        }))}
                        className={`${
                          reviewData.tag === tag
                            ? getTagColor(tag)
                            : "bg-muted hover:bg-muted/80"
                        } px-3 py-1 rounded-full text-sm transition-colors`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Add a photo</Label>
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('photo-upload')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </Button>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                    {reviewData.photoPreview && (
                      <img
                        src={reviewData.photoPreview}
                        alt="Preview"
                        className="h-16 w-16 object-cover rounded-md"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Special Recognition</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <div 
                      className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                        reviewData.isGoldenSpoon ? 'bg-secondary/10' : 'hover:bg-muted'
                      }`}
                      onClick={() => setReviewData(prev => ({
                        ...prev,
                        isGoldenSpoon: !prev.isGoldenSpoon,
                        isWoodenSpoon: false
                      }))}
                    >
                      <div className="flex items-center justify-center w-6 h-6 rounded-full border">
                        {reviewData.isGoldenSpoon && <Check className="h-4 w-4" />}
                      </div>
                      <Label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-xl">🥄</span>
                        <div>
                          <span className="font-medium">Golden Spoon</span>
                          <p className="text-sm text-muted-foreground">Exceptional - One of the best</p>
                        </div>
                      </Label>
                    </div>

                    <div 
                      className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                        reviewData.isWoodenSpoon ? 'bg-secondary/10' : 'hover:bg-muted'
                      }`}
                      onClick={() => setReviewData(prev => ({
                        ...prev,
                        isWoodenSpoon: !prev.isWoodenSpoon,
                        isGoldenSpoon: false
                      }))}
                    >
                      <div className="flex items-center justify-center w-6 h-6 rounded-full border">
                        {reviewData.isWoodenSpoon && <Check className="h-4 w-4" />}
                      </div>
                      <Label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-xl">🥄</span>
                        <div>
                          <span className="font-medium">Wooden Spoon</span>
                          <p className="text-sm text-muted-foreground">Disappointing - Would not recommend</p>
                        </div>
                      </Label>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    "Publish Review"
                  )}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
