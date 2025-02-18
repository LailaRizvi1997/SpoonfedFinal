"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type AddToListDialogProps = {
  isOpen: boolean
  onClose: () => void
  restaurantId: string
  restaurantName: string
}

export function AddToListDialog({
  isOpen,
  onClose,
  restaurantId: _restaurantId, // renamed to indicate it's intentionally unused
  restaurantName,
}: AddToListDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add {restaurantName} to a List</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {/* Insert your UI and logic to add the restaurant to a list */}
          <p>This feature is under construction.</p>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
