"use client"

import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Check, Upload, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"

const CUISINES = [
  { region: "European", cuisines: [
    "Italian", "French", "Spanish", "Greek", "Turkish",
    "German", "Austrian", "Swiss", "Belgian", "British",
    "Nordic", "Eastern European"
  ]},
  { region: "Asian", cuisines: [
    "Chinese", "Japanese", "Korean", "Vietnamese", "Thai",
    "Indian", "Malaysian", "Indonesian"
  ]},
  { region: "Middle Eastern", cuisines: [
    "Lebanese", "Persian", "Turkish", "Israeli"
  ]},
  { region: "Americas", cuisines: [
    "American", "Mexican", "Brazilian", "Peruvian"
  ]},
  { region: "African", cuisines: [
    "Ethiopian", "Moroccan", "Nigerian", "South African"
  ]}
]

export default function OnboardingPage() {
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([])
  const [bio, setBio] = useState("")
  const [avatarPreview, setAvatarPreview] = useState<string>("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setAvatarFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleCuisineSelect = (cuisine: string) => {
    setSelectedCuisines(prev => {
      if (prev.includes(cuisine)) {
        return prev.filter(c => c !== cuisine)
      }
      if (prev.length >= 3) {
        toast.warning("Maximum selections reached", "You can only select up to 3 favorite cuisines")
        return prev
      }
      return [...prev, cuisine]
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error("Authentication error", "Please sign in to continue")
      return
    }
    
    if (selectedCuisines.length !== 3) {
      toast.error("Please select 3 cuisines", "Share your top 3 favorite cuisines with us")
      return
    }

    if (!bio.trim()) {
      toast.error("Bio is required", "Please tell us a little about yourself")
      return
    }

    if (!avatarFile) {
      toast.error("Profile picture required", "Please upload a profile picture")
      return
    }

    setIsLoading(true)

    try {
      // Upload profile picture to Supabase Storage
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `${user.id}-${Math.random().toString(36).slice(2)}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, avatarFile)

      if (uploadError) throw uploadError

      // Get the public URL for the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath)

      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: user.email?.split('@')[0], // Default to email username
          avatar_url: publicUrl,
          bio: bio,
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Save cuisine preferences
      const cuisinePrefs = selectedCuisines.map(cuisine => ({
        user_id: user.id,
        cuisine: cuisine,
        region: CUISINES.find(group => 
          group.cuisines.includes(cuisine)
        )?.region || 'Other'
      }))

      const { error: prefError } = await supabase
        .from('cuisine_preferences')
        .insert(cuisinePrefs)

      if (prefError) throw prefError

      toast.success("Profile completed!", "Your preferences have been saved")
      navigate("/")
    } catch (error) {
      console.error('Error:', error)
      toast.error(
        "Something went wrong",
        "Please try again later"
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="container max-w-md mx-auto py-8 px-4">
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome to SpoonFed!</h1>
            <p className="text-muted-foreground">Let's personalize your experience</p>
          </div>

          <div className="space-y-4">
            <Label>Profile Picture</Label>
            <div className="flex flex-col items-center gap-4">
              <div 
                className="h-32 w-32 rounded-full bg-muted flex items-center justify-center relative overflow-hidden group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarPreview ? (
                  <>
                    <img
                      src={avatarPreview}
                      alt="Profile preview"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="h-6 w-6 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="h-6 w-6 mb-2" />
                    <span className="text-sm text-center px-4">Click to upload</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <p className="text-sm text-muted-foreground">
                Recommended: Square image, max 5MB
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Tell us about yourself</Label>
            <Textarea
              placeholder="Share a brief bio (max 140 characters)"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={140}
              className="resize-none"
              required
            />
          </div>

          <div className="space-y-4">
            <Label>Select your top 3 favorite cuisines</Label>
            <p className="text-sm text-muted-foreground">
              {3 - selectedCuisines.length} selection{3 - selectedCuisines.length !== 1 ? "s" : ""} remaining
            </p>
            <ScrollArea className="h-[300px] rounded-md border p-4">
              {CUISINES.map((group) => (
                <div key={group.region} className="mb-6 last:mb-0">
                  <h3 className="font-semibold mb-2">{group.region}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {group.cuisines.map((cuisine) => {
                      const isSelected = selectedCuisines.includes(cuisine)
                      return (
                        <button
                          key={cuisine}
                          type="button"
                          onClick={() => handleCuisineSelect(cuisine)}
                          className={`flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80"
                          }`}
                        >
                          {cuisine}
                          {isSelected && <Check className="h-4 w-4" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Complete Profile"
            )}
          </Button>
        </form>
      </Card>
    </main>
  )
}