"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface AddToListDialogProps {
  isOpen: boolean
  onClose: () => void
  restaurantId: string
  restaurantName: string
}

export function AddToListDialog({
  isOpen,
  onClose,
  restaurantId: _restaurantId,
  restaurantName,
}: AddToListDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Add {restaurantName} to a List
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {/* Insert your UI and logic to add the restaurant to a list */}
          <p className="text-sm text-muted-foreground">
            This feature is under construction.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
