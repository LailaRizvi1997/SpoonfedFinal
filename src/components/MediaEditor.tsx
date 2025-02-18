import { type FC } from "react"
import { MediaSegment } from "@/types/media"

interface MediaEditorProps {
  segments: MediaSegment[]
  onSegmentsChange: (segments: MediaSegment[]) => void
  onChange?: (segments: MediaSegment[]) => void
}

export const MediaEditor: FC<MediaEditorProps> = ({ segments, onSegmentsChange, onChange }) => {
  return (
    <div>
      {segments.map((segment, index) => (
        <div key={index} onClick={() => {
          const newSegments = [...segments]
          // Update segment here
          onSegmentsChange(newSegments)
          onChange?.(newSegments)
        }}>
          {/* Display segment content */}
          <span>{segment.content}</span>
        </div>
      ))}
    </div>
  )
}

export type { MediaSegment }