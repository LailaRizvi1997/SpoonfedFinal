"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"
import { Button } from "./ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

interface DeleteListDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  listId: string
  listName: string
}

export function DeleteListDialog({ isOpen, onClose, onSuccess, listId, listName }: DeleteListDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!user) {
      toast.error("Please sign in to delete lists")
      return
    }

    setIsDeleting(true)

    try {
      const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', listId)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success(
        "List deleted",
        `${listName} has been deleted`
      )
      
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error deleting list:', error)
      toast.error(
        "Error deleting list",
        "Please try again"
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete List</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{listName}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 justify-end">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete List"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}