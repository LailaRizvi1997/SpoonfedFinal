import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { Label } from "./ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Lock, Loader2 } from "lucide-react"

type GatekeepDialogProps = {
  isOpen: boolean
  onClose: () => void
  restaurant: {
    id: string
    name: string
  }
}

export function GatekeepDialog({ isOpen, onClose, restaurant }: GatekeepDialogProps) {
  const [review, setReview] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error("Please sign in to gatekeep restaurants")
      return
    }

    if (review.length < 100) {
      toast.error(
        "Review too short",
        "Please explain in at least 100 characters why this restaurant deserves protection"
      )
      return
    }

    setIsSubmitting(true)

    try {
      // Check eligibility
      const { data: isEligible } = await supabase
        .rpc('check_gatekeep_eligibility', { user_id: user.id })

      if (!isEligible) {
        toast.error(
          "Not eligible",
          "You can only gatekeep one restaurant every 30 days"
        )
        return
      }

      // Add gatekeep
      const { error } = await supabase
        .from('gatekept_restaurants')
        .insert({
          restaurant_id: restaurant.id,
          user_id: user.id,
          review,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })

      if (error) throw error

      toast.success(
        "Restaurant gatekept!",
        "You're helping preserve this hidden gem"
      )
      onClose()
    } catch (error) {
      toast.error(
        "Error gatekeeping restaurant",
        "Please try again later"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Gatekeep {restaurant.name}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="review">
              Why should this restaurant be protected?
            </Label>
            <Textarea
              id="review"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share why this hidden gem deserves protection (minimum 100 characters)"
              className="h-32 resize-none"
              required
            />
            <p className="text-sm text-muted-foreground text-right">
              {review.length}/100 characters minimum
            </p>
          </div>

          <div className="rounded-md bg-muted p-4">
            <p className="text-sm">
              By gatekeeping this restaurant:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• It will be hidden from regular users for 30 days</li>
              <li>• Only premium users can see full details</li>
              <li>• You can't gatekeep another restaurant for 30 days</li>
              <li>• You can remove the gatekeep status at any time</li>
            </ul>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting || review.length < 100}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Protecting...
              </>
            ) : (
              "Protect this Gem"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}