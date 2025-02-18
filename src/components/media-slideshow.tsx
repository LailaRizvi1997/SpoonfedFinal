"use client"

import { useState, useRef } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { Button } from "./ui/button"
import { cn } from "@/lib/utils"

type MediaItem = {
  type: "image" | "video"
  url: string
  thumbnail?: string
}

interface MediaSlideshowProps {
  media: MediaItem[]
  onClose?: () => void
  className?: string
  showControls?: boolean
}

export function MediaSlideshow({ media, onClose, className, showControls = true }: MediaSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % media.length)
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length)
  }

  const currentItem = media[currentIndex]

  return (
    <div className={cn("relative w-full aspect-[9/16] bg-black", className)}>
      {currentItem.type === "image" ? (
        <img
          src={currentItem.url}
          alt="Review media"
          className="absolute inset-0 w-full h-full object-contain"
        />
      ) : (
        <video
          ref={videoRef}
          src={currentItem.url}
          className="absolute inset-0 w-full h-full object-contain"
          controls={showControls}
          autoPlay
          loop
          playsInline
        />
      )}

      {media.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
            onClick={handlePrevious}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
            onClick={handleNext}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
            {media.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  index === currentIndex ? "bg-white" : "bg-white/50"
                )}
              />
            ))}
          </div>
        </>
      )}

      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}