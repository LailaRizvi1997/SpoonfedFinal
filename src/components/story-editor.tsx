"use client"

import { useState, useRef } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Upload, X, Mic, Square, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export type StorySlide = {
  id: string
  media: {
    type: "image" | "video"
    file: File
    preview: string
  }
  caption: string
  captionPosition: "top" | "center" | "bottom"
  audio?: {
    file: File
    preview: string
  }
}

interface StoryEditorProps {
  slides: StorySlide[]
  onChange: (slides: StorySlide[]) => void
  className?: string
}

export function StoryEditor({ slides, onChange, className }: StoryEditorProps) {
  const { toast } = useToast()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const mediaInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    files.forEach(file => {
      // Validate file size (max 50MB for videos, 5MB for images)
      const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 5 * 1024 * 1024
      if (file.size > maxSize) {
        toast.error(
          `File too large: ${file.name}`,
          `Maximum size is ${maxSize === 5 * 1024 * 1024 ? "5MB for images" : "50MB for videos"}`
        )
        return
      }

      const newSlide: StorySlide = {
        id: Math.random().toString(36).slice(2),
        media: {
          type: file.type.startsWith('video/') ? "video" : "image",
          file,
          preview: URL.createObjectURL(file)
        },
        caption: "",
        captionPosition: "bottom"
      }

      onChange([...slides, newSlide])
    })
  }

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(audioBlob)

        const updatedSlides = [...slides]
        updatedSlides[currentSlide] = {
          ...updatedSlides[currentSlide],
          audio: {
            file: audioFile,
            preview: audioUrl
          }
        }
        onChange(updatedSlides)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error("Could not start recording", "Please check your microphone permissions")
    }
  }

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
  }

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large", "Maximum audio size is 10MB")
      return
    }

    const updatedSlides = [...slides]
    updatedSlides[currentSlide] = {
      ...updatedSlides[currentSlide],
      audio: {
        file,
        preview: URL.createObjectURL(file)
      }
    }
    onChange(updatedSlides)
  }

  const updateCaption = (caption: string) => {
    const updatedSlides = [...slides]
    updatedSlides[currentSlide] = {
      ...updatedSlides[currentSlide],
      caption
    }
    onChange(updatedSlides)
  }

  const updateCaptionPosition = (position: StorySlide["captionPosition"]) => {
    const updatedSlides = [...slides]
    updatedSlides[currentSlide] = {
      ...updatedSlides[currentSlide],
      captionPosition: position
    }
    onChange(updatedSlides)
  }

  const removeSlide = (index: number) => {
    const updatedSlides = slides.filter((_, i) => i !== index)
    onChange(updatedSlides)
    if (currentSlide >= updatedSlides.length) {
      setCurrentSlide(Math.max(0, updatedSlides.length - 1))
    }
  }

  const removeAudio = () => {
    const updatedSlides = [...slides]
    updatedSlides[currentSlide] = {
      ...updatedSlides[currentSlide],
      audio: undefined
    }
    onChange(updatedSlides)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Media Upload Button */}
      {slides.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed rounded-lg">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="text-center">
            <p className="font-medium">Add photos & videos to your story</p>
            <p className="text-sm text-muted-foreground">
              Upload up to 10 photos or videos
            </p>
          </div>
          <Button
            type="button"
            onClick={() => mediaInputRef.current?.click()}
            variant="secondary"
          >
            Choose Files
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Story Preview */}
          <div className="relative aspect-[9/16] bg-black rounded-lg overflow-hidden">
            <div className="absolute inset-0">
              {slides[currentSlide].media.type === "image" ? (
                <img
                  src={slides[currentSlide].media.preview}
                  alt="Story preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  src={slides[currentSlide].media.preview}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              )}
            </div>

            {/* Caption */}
            {slides[currentSlide].caption && (
              <div
                className={cn(
                  "absolute left-0 right-0 p-4 text-white text-center",
                  slides[currentSlide].captionPosition === "top" && "top-0 bg-gradient-to-b from-black/50",
                  slides[currentSlide].captionPosition === "center" && "top-1/2 -translate-y-1/2 bg-black/30",
                  slides[currentSlide].captionPosition === "bottom" && "bottom-0 bg-gradient-to-t from-black/50"
                )}
              >
                {slides[currentSlide].caption}
              </div>
            )}

            {/* Navigation Controls */}
            {slides.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                  disabled={currentSlide === 0}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                  disabled={currentSlide === slides.length - 1}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Remove Slide Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => removeSlide(currentSlide)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Slide Controls */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Caption</Label>
              <Input
                value={slides[currentSlide].caption}
                onChange={(e) => updateCaption(e.target.value)}
                placeholder="Add a caption..."
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label>Caption Position</Label>
              <div className="flex gap-2">
                {(["top", "center", "bottom"] as const).map((position) => (
                  <Button
                    key={position}
                    type="button"
                    variant={slides[currentSlide].captionPosition === position ? "default" : "outline"}
                    onClick={() => updateCaptionPosition(position)}
                    className="flex-1 capitalize"
                  >
                    {position}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Audio</Label>
              <div className="flex gap-2">
                {slides[currentSlide].audio ? (
                  <div className="flex-1 flex items-center gap-2 p-2 bg-muted rounded-md">
                    <audio
                      src={slides[currentSlide].audio?.preview}
                      controls
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={removeAudio}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => audioInputRef.current?.click()}
                    >
                      Upload Audio
                    </Button>
                    <Button
                      type="button"
                      variant={isRecording ? "destructive" : "outline"}
                      className="flex-1"
                      onClick={isRecording ? stopAudioRecording : startAudioRecording}
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
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Slide Thumbnails */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={cn(
                  "relative w-20 aspect-[9/16] rounded-md overflow-hidden cursor-pointer",
                  index === currentSlide && "ring-2 ring-primary"
                )}
                onClick={() => setCurrentSlide(index)}
              >
                {slide.media.type === "image" ? (
                  <img
                    src={slide.media.preview}
                    alt={`Slide ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={slide.media.preview}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ))}
            {slides.length < 10 && (
              <Button
                type="button"
                variant="outline"
                className="w-20 aspect-[9/16]"
                onClick={() => mediaInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={mediaInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleMediaSelect}
        multiple
        className="hidden"
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        onChange={handleAudioUpload}
        className="hidden"
      />
    </div>
  )
}
