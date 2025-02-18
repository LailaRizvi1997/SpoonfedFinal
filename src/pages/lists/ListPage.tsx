"use client"

import { useParams, useNavigate } from "react-router-dom"
import Masonry from "react-masonry-css"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Star } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { AddRestaurantToListDialog } from "@/components/add-restaurant-to-list-dialog"

type List = {
  id: string
  name: string
  description: string | null
  cover_url: string | null
  created_at: string
}

type RestaurantWithNote = {
  id: string
  name: string
  address: string
  cuisine_type: string | null
  note: string | null
  photo_url?: string | null
  rating_avg?: number
}

export default function ListPage() {
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { user } = useAuth()

  // If no id is present in the URL, render an error message.
  if (!id) {
    return (
      <main className="container max-w-4xl mx-auto py-8 px-4">
        <p>Error: No list id provided.</p>
      </main>
    )
  }

  const [list, setList] = useState<List | null>(null)
  const [restaurants, setRestaurants] = useState<RestaurantWithNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFavorited, setIsFavorited] = useState(false)
  const [showAddRestaurantDialog, setShowAddRestaurantDialog] = useState(false)

  const privacyLabel = "Public" // For example

  useEffect(() => {
    loadList()
  }, [id])

  // Check if the list is favorited by the current user
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!user) return
      const { data, error } = await supabase
        .from("list_favorites")
        .select("*")
        .eq("list_id", id)
        .eq("user_id", user.id)
        .maybeSingle()

      if (!error) {
        setIsFavorited(!!data)
      }
    }
    checkFavoriteStatus()
  }, [user, id])

  const loadList = async () => {
    setIsLoading(true)
    try {
      // Fetch list info
      const { data: listData, error: listError } = await supabase
        .from("lists")
        .select("*")
        .eq("id", id)
        .maybeSingle()
      if (listError) throw listError
      if (!listData) {
        toast.error("List not found", "This list doesn't exist.")
        return
      }
      setList(listData)

      // Fetch restaurants in the list along with any note
      const { data: listRestaurantsData, error: listRestaurantsError } = await supabase
        .from("list_restaurants")
        .select(`
          note,
          restaurant:restaurants (
            id,
            name,
            address,
            cuisine_type,
            photo_url,
            rating_avg
          )
        `)
        .eq("list_id", id)
      if (listRestaurantsError) throw listRestaurantsError

      // Flatten the data
      const flattened = (listRestaurantsData || []).map((item: any) => ({
        id: item.restaurant.id,
        name: item.restaurant.name,
        address: item.restaurant.address,
        cuisine_type: item.restaurant.cuisine_type,
        photo_url: item.restaurant.photo_url || null,
        rating_avg: item.restaurant.rating_avg || null,
        note: item.note,
      }))
      setRestaurants(flattened)
    } catch (error) {
      console.error("Error loading list data:", error)
      toast.error("Error loading list", "Please try again")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleFavorite = async () => {
    if (!user) return
    if (isFavorited) {
      // Remove favorite
      const { error } = await supabase
        .from("list_favorites")
        .delete()
        .eq("list_id", id)
        .eq("user_id", user.id)
      if (error) {
        toast.error("Error removing favorite", "Please try again")
        return
      }
      setIsFavorited(false)
    } else {
      // Add favorite (without the returning option)
      const { error } = await supabase
        .from("list_favorites")
        .insert([{ list_id: id, user_id: user.id }])
      if (error) {
        toast.error("Error adding favorite", "Please try again")
        return
      }
      setIsFavorited(true)
    }
  }

  const handleRemoveRestaurant = async (restaurantId: string) => {
    try {
      const { error } = await supabase
        .from("list_restaurants")
        .delete()
        .eq("list_id", id)
        .eq("restaurant_id", restaurantId)
      if (error) throw error
      toast.success("Removed", "Restaurant has been removed from the list.")
      setRestaurants((prev) => prev.filter((r) => r.id !== restaurantId))
    } catch (error) {
      console.error("Error removing restaurant:", error)
      toast.error("Error removing restaurant", "Please try again")
    }
  }

  const breakpointColumnsObj = {
    default: 3,
    1100: 2,
    700: 1,
  }

  if (isLoading) {
    return (
      <main className="container max-w-4xl mx-auto py-8 px-4">
        <p>Loading list...</p>
      </main>
    )
  }

  if (!list) {
    return (
      <main className="container max-w-4xl mx-auto py-8 px-4">
        <p>List not found.</p>
      </main>
    )
  }

  const restaurantCount = restaurants.length

  return (
    <main className="container max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/profile")}>
            Back
          </Button>
          {user && (
            <Button variant="outline" onClick={toggleFavorite}>
              {isFavorited ? "Unbookmark" : "Bookmark"}
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddRestaurantDialog(true)}>
            Add Restaurant
          </Button>
          <Button variant="outline" onClick={() => alert("Edit list clicked!")}>
            Edit List
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        {list.cover_url && (
          <div className="relative w-full h-60 overflow-hidden rounded-t-md">
            <img
              src={list.cover_url}
              alt={list.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        )}
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{list.name}</CardTitle>
          {list.description && <p className="text-muted-foreground">{list.description}</p>}
          <p className="text-sm mt-2 flex items-center gap-2">
            {restaurantCount} {restaurantCount === 1 ? "restaurant" : "restaurants"} •{" "}
            {new Date(list.created_at).toLocaleDateString()} • {privacyLabel}
          </p>
        </CardHeader>
      </Card>

      {restaurants.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <p>No restaurants in this list yet.</p>
          <p className="text-sm mt-1">
            Add some from the restaurant page or from your profile.
          </p>
        </div>
      ) : (
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="my-masonry-grid"
          columnClassName="my-masonry-grid_column"
        >
          {restaurants.map((r) => (
            <div key={r.id} className="mb-4">
              <Card className="overflow-hidden">
                {r.photo_url && (
                  <div className="relative w-full h-40 overflow-hidden">
                    <img
                      src={r.photo_url}
                      alt={r.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg">{r.name}</h3>
                  <p className="text-sm text-muted-foreground">{r.address}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {typeof r.rating_avg === "number" && (
                      <div className="flex items-center text-sm">
                        <Star className="h-4 w-4 fill-secondary text-secondary" />
                        <span className="ml-1">{r.rating_avg.toFixed(1)}</span>
                      </div>
                    )}
                    {r.cuisine_type && (
                      <span className="text-xs px-2 py-1 bg-secondary/10 rounded-full text-secondary">
                        {r.cuisine_type}
                      </span>
                    )}
                  </div>
                  {r.note && (
                    <p className="mt-2 text-sm italic text-gray-600">
                      Note: {r.note}
                    </p>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-destructive"
                    onClick={() => handleRemoveRestaurant(r.id)}
                  >
                    Remove
                  </Button>
                </CardContent>
              </Card>
            </div>
          ))}
        </Masonry>
      )}

      {/* Dialog to add a restaurant */}
      <AddRestaurantToListDialog
        isOpen={showAddRestaurantDialog}
        onClose={() => setShowAddRestaurantDialog(false)}
        listId={id} // Here we assert id is defined.
        onSuccess={loadList}
      />
    </main>
  )
}
