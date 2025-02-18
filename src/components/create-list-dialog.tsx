"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

interface CreateListDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateListDialog({ isOpen, onClose, onSuccess }: CreateListDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [coverFile, setCoverFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Invalid file type", "Please select an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", "Please select an image under 5MB")
      return
    }

    setCoverFile(file)
  }

  const uploadCoverPhoto = async (file: File): Promise<string | null> => {
    if (!user) return null

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Math.random()}.${fileExt}`

    try {
      const { error: uploadError } = await supabase.storage
        .from('list-covers')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('list-covers')
        .getPublicUrl(fileName)

      return data.publicUrl
    } catch (error) {
      console.error('Error uploading cover photo:', error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error("Please sign in to create lists")
      return
    }

    if (!name.trim()) {
      toast.error("Please enter a list name")
      return
    }

    setIsSubmitting(true)

    try {
      let coverUrl: string | null = null
      if (coverFile) {
        coverUrl = await uploadCoverPhoto(coverFile)
      }

      const { error } = await supabase
        .from('lists')
        .insert({
          user_id: user.id,
          name: name.trim(),
          description: description.trim() || null,
          cover_url: coverUrl
        })

      if (error) throw error

      toast.success("List created!", `${name} has been created`)
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error creating list:', error)
      toast.error("Error creating list", "Please try again")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New List</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">List Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Summer Brunch Spots"
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for your list..."
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cover">Cover Photo (Optional)</Label>
            <Input
              id="cover"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
            <p className="text-sm text-muted-foreground">
              Maximum size: 5MB
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create List"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}