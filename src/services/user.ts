import { supabase } from "@/lib/supabase"

export async function upsertUser() {
  // Get the current user from Supabase Auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError) {
    console.error("Error fetching user from auth:", authError)
    return null
  }
  if (!user) {
    console.warn("No authenticated user found.")
    return null
  }

  // Upsert the user into the custom "users" table
  const { data, error } = await supabase
    .from("users")
    .upsert({
      id: user.id,
      username: user.email?.split('@')[0] || "user",
      avatar_url: user.user_metadata?.avatar_url || "",
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error("Error upserting user:", error)
    return null
  }

  return data
} 