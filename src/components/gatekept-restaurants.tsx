"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function GatekeptRestaurants() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadGatekeptRestaurants()
  }, [user])

  const loadGatekeptRestaurants = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // Replace "is_premium" with the appropriate key from user metadata if needed.
      const { data, error } = await supabase.rpc("get_gatekept_restaurants", {
        is_premium: user?.user_metadata?.is_premium ?? false,
      })

      if (error) throw error

      setRestaurants(data || [])
    } catch (error) {
      console.error("Error loading gatekept restaurants:", error)
      toast.error("Error loading restaurants", "Please try again")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Gatekept Restaurants</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading...</p>
          ) : restaurants.length > 0 ? (
            restaurants.map((restaurant) => (
              <div key={restaurant.id}>
                <p>{restaurant.name}</p>
              </div>
            ))
          ) : (
            <p>No restaurants available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
