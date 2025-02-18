export type ReviewTag = 
  | "worth the hype"
  | "underrated"
  | "overhyped"
  | "elite"
  | "daylight robbery"
  | "guilty pleasure"
  | "marmite"
  | "mid"
  | "NPC central"
  | null

export interface Review {
  id: string
  user: {
    id: string
    username: string
    avatar_url: string
  }
  restaurant?: {
    id: string
    name: string
    address: string
    cuisine_type: string | null
  }
  rating: number
  content: string
  tag: ReviewTag
  created_at: string
  updated_at: string
  photos?: string[]
  audio_url?: string
  likes_count: number
  is_golden_spoon: boolean
  is_wooden_spoon: boolean
}

export interface List {
  id: string
  name: string
  description: string
  cover_url: string
  restaurant_count: number
  favorites_count: number
  user: {
    username: string
  }
} 