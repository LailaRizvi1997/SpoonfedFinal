"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Loader2, Heart, Trash2 } from "lucide-react"
import { Link } from "react-router-dom"

// Define the Comment type.
type Comment = {
  id: string
  content: string
  created_at: string
  likes_count: number
  user: {
    id: string
    username: string
    avatar_url: string | null
  }
}

interface CommentsDialogProps {
  isOpen: boolean
  onClose: () => void
  reviewId: string
  onCommentAdded?: () => void
}

export function CommentsDialog({
  isOpen,
  onClose,
  reviewId,
  onCommentAdded,
}: CommentsDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadComments()
    }
  }, [isOpen, reviewId])

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from("review_comments")
        .select(`
          id,
          content,
          created_at,
          likes_count,
          user:users (
            id,
            username,
            avatar_url
          )
        `)
        .eq("review_id", reviewId)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Transform data: if item.user is an array, pick the first element.
      const transformed = (data || []).map((item: any) => ({
        ...item,
        user: Array.isArray(item.user) ? item.user[0] : item.user,
      }))

      setComments(transformed)
    } catch (error) {
      console.error("Error loading comments:", error)
      toast.error("Error loading comments", "Please try again")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error("Please sign in to comment")
      return
    }

    if (!newComment.trim()) {
      toast.error("Please enter a comment")
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from("review_comments")
        .insert({
          review_id: reviewId,
          user_id: user.id,
          content: newComment.trim(),
        })

      if (error) throw error

      setNewComment("")
      loadComments()
      onCommentAdded?.()
      toast.success("Comment added")
    } catch (error) {
      console.error("Error adding comment:", error)
      toast.error("Error adding comment", "Please try again")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("review_comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user?.id)

      if (error) throw error

      setComments(prev => prev.filter(c => c.id !== commentId))
      onCommentAdded?.()
      toast.success("Comment deleted")
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast.error("Error deleting comment", "Please try again")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>
        </DialogHeader>

        {/* Comment Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            maxLength={280}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post"
              )}
            </Button>
          </div>
        </form>

        {/* Comments List */}
        <div className="space-y-4 mt-4 max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <p>No comments yet</p>
              <p className="text-sm">Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Link to={`/profile/${comment.user.id}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.user.avatar_url || undefined} />
                    <AvatarFallback>
                      {comment.user.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1">
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <Link 
                        to={`/profile/${comment.user.id}`}
                        className="font-medium hover:underline"
                      >
                        @{comment.user.username}
                      </Link>
                      {user?.id === comment.user.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(comment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="mt-1">{comment.content}</p>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <button className="hover:text-primary transition-colors">
                      <Heart className="h-4 w-4 inline-block mr-1" />
                      {comment.likes_count}
                    </button>
                    <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
