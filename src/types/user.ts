export interface User {
  id: string
  username: string
  avatar_url: string
  updated_at: string
  email: string
  user_metadata: {
    avatar_url?: string
    username?: string
    bio?: string
    cuisines?: string[]
    is_premium?: boolean
    full_name?: string
    [key: string]: any
  }
  reviews_count?: number
  golden_spoon_count?: number
  wooden_spoon_count?: number
} 