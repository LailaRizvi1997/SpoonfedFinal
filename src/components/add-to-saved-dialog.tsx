"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { RestaurantSearch } from "./restaurant-search"

interface AddToSavedDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  type: "wishlist" | "visited"
}

export function AddToSavedDialog({
  isOpen,
  onClose,
  onSuccess,
  type,
}: AddToSavedDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  const handleSave = async (restaurant: any) => {
    if (!user) {
      toast.error("Please sign in to save restaurants")
      return
    }

    try {
      const { error } = await supabase
        .from("saved_restaurants")
        .upsert({
          user_id: user.id,
          restaurant_id: restaurant.id,
          type,
        })

      if (error) {
        if (error.code === "23505") {
          // Duplicate entry
          toast.error(
            "Already saved",
            `${restaurant.name} is already in your ${type}`
          )
          return
        }
        throw error
      }

      toast.success(
        type === "wishlist" ? "Added to wishlist" : "Marked as visited",
        `${restaurant.name} has been saved`
      )

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error saving restaurant:", error)
      toast.error("Error saving restaurant", "Please try again")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {type === "wishlist" ? "Add to Wishlist" : "Mark as Visited"}
          </DialogTitle>
        </DialogHeader>
        <RestaurantSearch onSelect={handleSave} type={type} />
      </DialogContent>
    </Dialog>
  )
}
