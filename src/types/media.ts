export interface MediaFile {
  file: File
  preview: string
}

export interface MediaSegment {
  start: number
  end: number
  content: string
  file?: File
  preview?: string
  type?: 'photo' | 'video'
}

export interface MediaEditorProps {
  segments: MediaSegment[]
  onSegmentsChange: (segments: MediaSegment[]) => void
  // Add other props as needed
} 