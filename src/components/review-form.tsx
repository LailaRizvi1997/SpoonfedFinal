"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Check, Upload, Loader2, Mic, Square, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { MediaEditor, MediaSegment } from "@/components/MediaEditor"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type ReviewTag = 
  | "worth the hype"
  | "underrated"
  | "overhyped"
  | "elite"
  | "daylight robbery"
  | "guilty pleasure"
  | "marmite"
  | "mid"
  | "NPC central"

const REVIEW_TAGS: ReviewTag[] = [
  "worth the hype",
  "underrated",
  "overhyped",
  "elite",
  "daylight robbery",
  "guilty pleasure",
  "marmite",
  "mid",
  "NPC central"
]

function getTagColor(tag: ReviewTag): string {
  switch (tag) {
    case "worth the hype":
      return "bg-green-500/10 text-green-500 hover:bg-green-500/20"
    case "elite":
      return "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20"
    case "underrated":
      return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
    case "overhyped":
      return "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20"
    case "daylight robbery":
      return "bg-red-500/10 text-red-500 hover:bg-red-500/20"
    case "guilty pleasure":
      return "bg-pink-500/10 text-pink-500 hover:bg-pink-500/20"
    case "marmite":
      return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
    case "mid":
      return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
    case "NPC central":
      return "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20"
    default:
      return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
  }
}

interface ReviewFormProps {
  restaurantId: string
  onSuccess: () => void
  onCancel: () => void
}

export function ReviewForm({ restaurantId, onSuccess, onCancel }: ReviewFormProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Basic review fields
  const [content, setContent] = useState("")
  const [rating, setRating] = useState(0)
  const [selectedTag, setSelectedTag] = useState<ReviewTag | "">("")
  
  // Media segments for attached photos/videos
  const [mediaSegments, setMediaSegments] = useState<MediaSegment[]>([])
  
  // Audio recording state
  const [isRecording, setIsRecording] = useState(false)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioPreview, setAudioPreview] = useState("")
  
  // Special features
  const [isGoldenSpoon, setIsGoldenSpoon] = useState(false)
  const [isWoodenSpoon, setIsWoodenSpoon] = useState(false)
  const [isGatekept, setIsGatekept] = useState(false)

  // Handler for media file input (allows multiple selection)
  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      const segments: MediaSegment[] = files.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        start: 0,
        end: 0,
        content: file.name
      }))
      setMediaSegments(prev => [...prev, ...segments])
    }
  }

  // Audio recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const file = new File([blob], 'recording.webm', { type: 'audio/webm' })
        setAudioFile(file)
        setAudioPreview(URL.createObjectURL(blob))
      }

      mediaRecorder.start()
      setIsRecording(true)

      // Stop recording after 60 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop()
          stream.getTracks().forEach(track => track.stop())
          setIsRecording(false)
        }
      }, 60000)
    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error("Could not start recording", "Please check your microphone permissions")
    }
  }

  const stopRecording = () => {
    setIsRecording(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error("Please sign in to review")
      return
    }
    
    if (!content.trim()) {
      toast.error("Please write a review")
      return
    }

    if (rating === 0) {
      toast.error("Please select a rating")
      return
    }

    if (!selectedTag) {
      toast.error("Please select a tag")
      return
    }

    setIsSubmitting(true)

    try {
      // Upload media files
      const uploadedMedia = []
      
      // Upload photos/videos
      for (const segment of mediaSegments) {
        if (!segment.file) {
          console.warn('Skipping segment without file')
          continue
        }

        const fileExt = segment.file.name.split('.').pop()
        const fileName = `${user.id}/${Math.random().toString(36).slice(2)}.${fileExt}`
        const filePath = `reviews/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('reviews')
          .upload(filePath, segment.file)

        if (uploadError) throw uploadError

        const { data: publicData } = supabase.storage.from('reviews').getPublicUrl(filePath)
        const publicUrl = publicData.publicUrl

        uploadedMedia.push({
          type: segment.file.type.startsWith('image/') ? 'photo' : 'video',
          url: publicUrl,
          start: segment.start || 0,
          end: segment.end || 0
        })
      }

      // Upload audio if exists
      let audioUrl = null
      if (audioFile) {
        const fileName = `${user.id}/${Math.random().toString(36).slice(2)}.webm`
        const filePath = `reviews/${fileName}`

        const { error: audioError } = await supabase.storage
          .from('reviews')
          .upload(filePath, audioFile)

        if (audioError) throw audioError

        const { data: publicData } = supabase.storage.from('reviews').getPublicUrl(filePath)
        audioUrl = publicData.publicUrl
      }

      // Create the review
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          restaurant_id: restaurantId,
          rating,
          text: content,
          tag: selectedTag,
          media: uploadedMedia,
          audio_url: audioUrl,
          is_golden_spoon: isGoldenSpoon,
          is_wooden_spoon: isWoodenSpoon,
          is_gatekept: isGatekept
        })

      if (reviewError) throw reviewError

      toast.success("Review published!", "Your review has been shared")
      onSuccess()
    } catch (error) {
      console.error('Review submission error:', error)
      toast.error("Error publishing review", "Please try again later")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Review Text */}
      <div className="space-y-2">
        <Label>Your Review</Label>
        <Textarea
          placeholder="Share your experience..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={250}
          className="resize-none"
          rows={4}
        />
        <p className="text-sm text-muted-foreground text-right">
          {content.length}/250
        </p>
      </div>

      {/* Rating */}
      <div className="space-y-2">
        <Label>Rating</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setRating(num === rating ? 0 : num)}
              className={`text-2xl transition-all hover:scale-110 focus:outline-none ${
                num <= rating ? "text-secondary" : "text-muted hover:text-secondary/50"
              }`}
            >
              {num <= rating ? "★" : "☆"}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tag your experience</Label>
        <div className="flex flex-wrap gap-2">
          {REVIEW_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(selectedTag === tag ? "" : tag)}
              className={`${
                selectedTag === tag
                  ? getTagColor(tag)
                  : "bg-muted hover:bg-muted/80"
              } px-3 py-1 rounded-full text-sm transition-colors`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Media Attachments */}
      <div className="space-y-2">
        <Label>Photos & Videos</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('media-upload')?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Add Media
          </Button>
          <input
            id="media-upload"
            type="file"
            accept="image/*,video/*"
            onChange={handleMediaChange}
            multiple
            className="hidden"
          />
        </div>
        {mediaSegments.length > 0 && (
          <div className="mt-4">
            <MediaEditor 
              segments={mediaSegments} 
              onSegmentsChange={setMediaSegments}
            />
          </div>
        )}
      </div>

      {/* Audio Recording */}
      <div className="space-y-2">
        <Label>Voice Note (max 60s)</Label>
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant={isRecording ? "destructive" : "outline"}
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Record Audio
              </>
            )}
          </Button>
          {audioPreview && (
            <audio src={audioPreview} controls className="flex-1" />
          )}
        </div>
      </div>

      {/* Special Features */}
      <div className="space-y-4 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <Label>Special Recognition</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Special badges to highlight exceptional experiences</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="space-y-2">
          {/* Golden Spoon */}
          <div 
            className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
              isGoldenSpoon ? 'bg-secondary/10' : 'hover:bg-muted'
            }`}
            onClick={() => {
              setIsGoldenSpoon(!isGoldenSpoon)
              setIsWoodenSpoon(false)
            }}
          >
            <div className="flex items-center justify-center w-6 h-6 rounded-full border">
              {isGoldenSpoon && <Check className="h-4 w-4" />}
            </div>
            <Label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xl">🥄</span>
              <div>
                <span className="font-medium">Golden Spoon</span>
                <p className="text-sm text-muted-foreground">
                  Exceptional - One of the best meals you've had
                </p>
              </div>
            </Label>
          </div>

          {/* Wooden Spoon */}
          <div 
            className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
              isWoodenSpoon ? 'bg-secondary/10' : 'hover:bg-muted'
            }`}
            onClick={() => {
              setIsWoodenSpoon(!isWoodenSpoon)
              setIsGoldenSpoon(false)
            }}
          >
            <div className="flex items-center justify-center w-6 h-6 rounded-full border">
              {isWoodenSpoon && <Check className="h-4 w-4" />}
            </div>
            <Label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xl">🥄</span>
              <div>
                <span className="font-medium">Wooden Spoon</span>
                <p className="text-sm text-muted-foreground">
                  Disappointing - Would not recommend to anyone
                </p>
              </div>
            </Label>
          </div>

          {/* Gatekeep */}
          <div 
            className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
              isGatekept ? 'bg-secondary/10' : 'hover:bg-muted'
            }`}
            onClick={() => setIsGatekept(!isGatekept)}
          >
            <div className="flex items-center justify-center w-6 h-6 rounded-full border">
              {isGatekept && <Check className="h-4 w-4" />}
            </div>
            <Label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xl">🔒</span>
              <div>
                <span className="font-medium">Gatekeep This Spot</span>
                <p className="text-sm text-muted-foreground">
                  Hide this review from the public - Only premium users can see gatekept reviews
                </p>
              </div>
            </Label>
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Publishing...
            </>
          ) : (
            "Publish Review"
          )}
        </Button>
      </div>
    </form>
  )
}
