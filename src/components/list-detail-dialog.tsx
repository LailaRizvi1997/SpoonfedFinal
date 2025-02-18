"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

interface ListDetailDialogProps {
  isOpen: boolean
  onClose: () => void
  listId: string
  listName: string
}

type RestaurantWithNote = {
  id: string
  name: string
  address: string
  cuisine_type: string | null
  note?: string | null
}

export function ListDetailDialog({ isOpen, onClose, listId, listName }: ListDetailDialogProps) {
  const { toast } = useToast()
  const [restaurants, setRestaurants] = useState<RestaurantWithNote[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [searchResults, setSearchResults] = useState<RestaurantWithNote[]>([])

  useEffect(() => {
    if (isOpen) {
      loadListRestaurants()
    }
  }, [isOpen, listId])

  const loadListRestaurants = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("list_restaurants")
        .select(`
          restaurant:restaurants (
            id,
            name,
            address,
            cuisine_type
          ),
          note
        `)
        .eq("list_id", listId)
      if (error) throw error
      // Map the results so that each item has the restaurant info and a note.
      const loadedRestaurants = data.map((item: any) => ({
        ...item.restaurant,
        note: item.note,
      }))
      setRestaurants(loadedRestaurants)
    } catch (error) {
      console.error("Error loading list restaurants:", error)
      toast.error("Error loading restaurants", "Please try again")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }
    try {
      const { data, error } = await supabase
        .from("restaurants")
        .select("id, name, address, cuisine_type")
        .ilike("name", `%${searchTerm}%`)
      if (error) {
        console.error("Search error details:", error)
        throw error
      }
      setSearchResults(data)
    } catch (error) {
      console.error("Error searching restaurants:", error)
      toast.error("Error searching restaurants", "Please try again")
    }
  }

  const handleAddRestaurant = async (restaurantId: string) => {
    try {
      const { error } = await supabase
        .from("list_restaurants")
        .insert({
          list_id: listId,
          restaurant_id: restaurantId,
          note: null, // No note when added via search without note prompt.
        })
      if (error) throw error
      toast.success("Restaurant added", "The restaurant has been added to your list")
      loadListRestaurants()
    } catch (error) {
      console.error("Error adding restaurant:", error)
      toast.error("Error adding restaurant", "Please try again")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{listName} – Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          {/* Search Section */}
          <div className="flex flex-col gap-2">
            <Input
              placeholder="Search restaurants by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button onClick={handleSearch} size="sm">
              Search
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Search Results</h3>
              {searchResults.map((restaurant) => (
                <Card key={restaurant.id} className="p-4 flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{restaurant.name}</h4>
                    <p className="text-sm text-muted-foreground">{restaurant.address}</p>
                  </div>
                  <Button onClick={() => handleAddRestaurant(restaurant.id)} size="sm">
                    Add
                  </Button>
                </Card>
              ))}
            </div>
          )}

          {/* List’s Existing Restaurants */}
          <div className="space-y-2">
            <h3 className="font-semibold">
              Restaurants in this List ({restaurants.length})
            </h3>
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="mx-auto h-8 w-8 animate-spin" />
              </div>
            ) : (
              restaurants.map((restaurant) => (
                <Card key={restaurant.id} className="p-4">
                  <CardContent>
                    <h4 className="font-medium">{restaurant.name}</h4>
                    <p className="text-sm text-muted-foreground">{restaurant.address}</p>
                    {restaurant.note && (
                      <p className="text-sm italic text-gray-600 mt-1">
                        Note: {restaurant.note}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
