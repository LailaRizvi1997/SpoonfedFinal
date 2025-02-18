"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

interface AddRestaurantToListDialogProps {
  isOpen: boolean
  onClose: () => void
  listId: string
  onSuccess: () => void
}

type Restaurant = {
  id: string
  name: string
  address: string
  cuisine_type: string | null
}

export function AddRestaurantToListDialog({
  isOpen,
  onClose,
  listId,
  onSuccess
}: AddRestaurantToListDialogProps) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Restaurant[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Reset search when the dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("")
      setSearchResults([])
      setIsSearching(false)
    }
  }, [isOpen])

  // Perform a search in the "restaurants" table
  const handleSearch = async () => {
    if (!searchTerm.trim()) return
    setIsSearching(true)
    try {
      const { data, error } = await supabase
        .from("restaurants")
        .select("id, name, address, cuisine_type")
        .ilike("name", `%${searchTerm}%`) // case-insensitive partial match

      // LOG THE SEARCH RESULTS:
      console.log("Search results:", data)

      if (error) throw error
      setSearchResults(data || [])
    } catch (error) {
      console.error("Error searching restaurants:", error)
      toast.error("Error searching restaurants", "Please try again")
    } finally {
      setIsSearching(false)
    }
  }

  // Add a restaurant to the "list_restaurants" table
  const handleAddRestaurant = async (restaurantId: string) => {
    try {
      const { error } = await supabase
        .from("list_restaurants")
        .insert({
          list_id: listId,
          restaurant_id: restaurantId,
        })
      if (error) throw error

      toast.success("Restaurant added", "The restaurant has been added to your list")
      onSuccess() // re-fetch the list’s restaurants
      onClose()    // close the dialog
    } catch (error) {
      console.error("Error adding restaurant:", error)
      toast.error("Error adding restaurant", "Please try again")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add a Restaurant</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search restaurants by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                "Search"
              )}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((restaurant) => (
                <Card
                  key={restaurant.id}
                  className="p-4 hover:bg-accent transition-colors cursor-pointer"
                >
                  <CardContent className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{restaurant.name}</h3>
                      <p className="text-sm text-muted-foreground">{restaurant.address}</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleAddRestaurant(restaurant.id)}
                    >
                      Add
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
