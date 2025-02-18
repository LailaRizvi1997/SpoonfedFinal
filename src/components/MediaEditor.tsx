"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export interface MediaSegment {
  file: File
  preview: string
  start?: number
  end?: number
}

interface MediaEditorProps {
  segments: MediaSegment[]
  onChange: (segments: MediaSegment[]) => void
}

export function MediaEditor({ segments, onChange }: MediaEditorProps) {
  // Simple reordering functions: move segment up or down
  const moveUp = (index: number) => {
    if (index === 0) return
    const newSegments = [...segments]
    ;[newSegments[index - 1], newSegments[index]] = [newSegments[index], newSegments[index - 1]]
    onChange(newSegments)
  }

  const moveDown = (index: number) => {
    if (index === segments.length - 1) return
    const newSegments = [...segments]
    ;[newSegments[index], newSegments[index + 1]] = [newSegments[index + 1], newSegments[index]]
    onChange(newSegments)
  }

  // Update trimming times
  const updateTrim = (index: number, field: "start" | "end", value: number) => {
    const newSegments = [...segments]
    newSegments[index] = { ...newSegments[index], [field]: value }
    onChange(newSegments)
  }

  return (
    <div className="space-y-4">
      {segments.map((segment, index) => (
        <div key={index} className="border p-2 rounded flex flex-col">
          <div className="flex items-center gap-4">
            {segment.file.type.startsWith("image") ? (
              <img src={segment.preview} alt={`Segment ${index}`} className="h-24 w-24 object-cover rounded" />
            ) : (
              <video src={segment.preview} className="h-24 w-24 rounded" controls />
            )}
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button size="sm" onClick={() => moveUp(index)} disabled={index === 0}>Up</Button>
                <Button size="sm" onClick={() => moveDown(index)} disabled={index === segments.length - 1}>Down</Button>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Start (s)"
                  value={segment.start ?? 0}
                  onChange={(e) => updateTrim(index, "start", Number(e.target.value))}
                  className="border p-1 w-20 text-sm"
                />
                <input
                  type="number"
                  placeholder="End (s)"
                  value={segment.end ?? 0}
                  onChange={(e) => updateTrim(index, "end", Number(e.target.value))}
                  className="border p-1 w-20 text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}