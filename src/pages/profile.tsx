"use client"

import { useState, useEffect, FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogOut, Edit } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { ReviewCard } from "@/components/review-card"
import { CreateListDialog } from "@/components/create-list-dialog"
import { DeleteDialog } from "@/components/delete-dialog"
import { AddToSavedDialog } from "@/components/add-to-saved-dialog"

// ---------------------------------------------------
// 1. TYPE DEFINITIONS
// ---------------------------------------------------

type Review = {
  id: string
  rating: number
  content: string
  created_at: string
  likes_count: number
  is_golden_spoon: boolean
  is_wooden_spoon: boolean
  // We expect the ReviewCard to require a tag of type ReviewTag | null.
  // If ReviewTag is not defined elsewhere, you may define it as a string union,
  // or simply cast our incoming string to ReviewTag.
  tag: string | null
  restaurant: {
    id: string
    name: string
    address: string
    cuisine_type: string | null
  }
}

type List = {
  id: string
  name: string
  description: string | null
  cover_url: string | null
  created_at: string
  // This aggregator can appear as a number, an object, or an array.
  restaurant_count: number | { count: number } | { count: number }[]
}

type SavedRestaurant = {
  id: string
  name: string
  address: string
  cuisine_type: string | null
  rating_avg: number
  created_at: string
}

type UserStats = {
  review_count: number
  golden_spoon_count: number
  wooden_spoon_count: number
}

// ---------------------------------------------------
// 2. HELPER FUNCTION
// ---------------------------------------------------
function getCount(
  rc: number | { count: number } | { count: number }[] | null
): number {
  if (Array.isArray(rc)) {
    // If it's an array, return the first element's "count"
    return rc[0]?.count || 0
  } else if (rc && typeof rc === "object" && "count" in rc) {
    // If it's a single object { count: X }
    return Number(rc.count) || 0
  }
  // If it's already a number or null
  return typeof rc === "number" ? rc : 0
}

// ---------------------------------------------------
// 3. MAIN PROFILE COMPONENT
// ---------------------------------------------------
export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [reviews, setReviews] = useState<Review[]>([])
  const [lists, setLists] = useState<List[]>([])
  const [bookmarkedLists, setBookmarkedLists] = useState<List[]>([])
  const [wishlist, setWishlist] = useState<SavedRestaurant[]>([])
  const [visited, setVisited] = useState<SavedRestaurant[]>([])
  const [stats, setStats] = useState<UserStats>({
    review_count: 0,
    golden_spoon_count: 0,
    wooden_spoon_count: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  // Dialog states
  const [showCreateListDialog, setShowCreateListDialog] = useState(false)
  const [showAddToWishlistDialog, setShowAddToWishlistDialog] = useState(false)
  const [showAddToVisitedDialog, setShowAddToVisitedDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    type: "list" | "wishlist" | "visited"
    id: string
    name: string
  }>({
    isOpen: false,
    type: "list",
    id: "",
    name: "",
  })

  // Edit profile states
  const [editMode, setEditMode] = useState(false)
  const [profilePicture, setProfilePicture] = useState(
    user?.user_metadata?.avatar_url || ""
  )
  const [username, setUsername] = useState(
    user?.user_metadata?.username || user?.email?.split("@")[0] || ""
  )
  const [bio, setBio] = useState(user?.user_metadata?.bio || "")
  const [cuisine1, setCuisine1] = useState(user?.user_metadata?.cuisines?.[0] || "")
  const [cuisine2, setCuisine2] = useState(user?.user_metadata?.cuisines?.[1] || "")
  const [cuisine3, setCuisine3] = useState(user?.user_metadata?.cuisines?.[2] || "")

  useEffect(() => {
    if (user) loadUserData()
  }, [user])

  const loadUserData = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      // 1) Load user's reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select(`
          id,
          rating,
          text,
          created_at,
          is_golden_spoon,
          is_wooden_spoon,
          tag,
          restaurant:restaurants (
            id,
            name,
            address,
            cuisine_type
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (reviewsError) throw reviewsError
      const transformedReviews = (reviewsData || []).map((review: any) => ({
        id: review.id,
        rating: review.rating,
        content: review.text || "",
        created_at: review.created_at,
        likes_count: 0,
        is_golden_spoon: review.is_golden_spoon || false,
        is_wooden_spoon: review.is_wooden_spoon || false,
        // Cast the tag to the expected type.
        tag: review.tag as unknown as any, 
        restaurant: {
          id: review.restaurant.id,
          name: review.restaurant.name,
          address: review.restaurant.address,
          cuisine_type: review.restaurant.cuisine_type,
        },
      }))

      // 2) Load user's lists
      const { data: listsData, error: listsError } = await supabase
        .from("lists")
        .select(`
          id,
          name,
          description,
          cover_url,
          created_at,
          restaurant_count:list_restaurants(count)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      if (listsError) throw listsError

      // 3) Load bookmarked lists (list_favorites)
      const { data: favoritesData, error: favoritesError } = await supabase
        .from("list_favorites")
        .select("list_id")
        .eq("user_id", user.id)
      if (favoritesError) throw favoritesError

      const favoriteIds = favoritesData?.map((f) => f.list_id) || []
      const { data: bookmarkedData, error: bookmarkedError } = await supabase
        .from("lists")
        .select(`
          id,
          name,
          description,
          cover_url,
          created_at,
          restaurant_count:list_restaurants(count)
        `)
        .in("id", favoriteIds)
        .order("created_at", { ascending: false })
      if (bookmarkedError) throw bookmarkedError

      // 4) Load saved restaurants (wishlist, visited)
      const { data: savedData, error: savedError } = await supabase
        .from("saved_restaurants")
        .select(`
          type,
          created_at,
          restaurant:restaurants (
            id,
            name,
            address,
            cuisine_type,
            rating_avg
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      if (savedError) throw savedError

      const wishlistRestaurants = (savedData || [])
        .filter((item: any) => item.type === "wishlist")
        .map((item: any) => ({
          id: item.restaurant.id,
          name: item.restaurant.name,
          address: item.restaurant.address,
          cuisine_type: item.restaurant.cuisine_type,
          rating_avg: item.restaurant.rating_avg,
          created_at: item.created_at,
        }))

      const visitedRestaurants = (savedData || [])
        .filter((item: any) => item.type === "visited")
        .map((item: any) => ({
          id: item.restaurant.id,
          name: item.restaurant.name,
          address: item.restaurant.address,
          cuisine_type: item.restaurant.cuisine_type,
          rating_avg: item.restaurant.rating_avg,
          created_at: item.created_at,
        }))

      // 5) Calculate user stats
      const userStats = {
        review_count: transformedReviews.length,
        golden_spoon_count: transformedReviews.filter((r) => r.is_golden_spoon).length,
        wooden_spoon_count: transformedReviews.filter((r) => r.is_wooden_spoon).length,
      }

      // 6) Set state
      setReviews(transformedReviews)
      setLists(listsData || [])
      setBookmarkedLists(bookmarkedData || [])
      setWishlist(wishlistRestaurants)
      setVisited(visitedRestaurants)
      setStats(userStats)
    } catch (error) {
      console.error("Error loading user data:", error)
      toast.error("Error loading profile", "Please try again")
    } finally {
      setIsLoading(false)
    }
  }

  // Sign out
  const handleSignOut = async () => {
    try {
      await signOut()
      navigate("/")
      toast.success("Signed out successfully", "Come back soon!")
    } catch (error) {
      toast.error("Error signing out", "Please try again")
    }
  }

  // Deletion logic for list/wishlist/visited
  const handleDelete = async () => {
    if (!user) return
    try {
      let error
      switch (deleteDialog.type) {
        case "list":
          ({ error } = await supabase
            .from("lists")
            .delete()
            .eq("id", deleteDialog.id)
            .eq("user_id", user.id))
          if (error) throw error
          setLists((prev) => prev.filter((l) => l.id !== deleteDialog.id))
          break

        case "wishlist":
        case "visited":
          ({ error } = await supabase
            .from("saved_restaurants")
            .delete()
            .eq("restaurant_id", deleteDialog.id)
            .eq("user_id", user.id)
            .eq("type", deleteDialog.type))
          if (error) throw error
          if (deleteDialog.type === "wishlist") {
            setWishlist((prev) => prev.filter((r) => r.id !== deleteDialog.id))
          } else {
            setVisited((prev) => prev.filter((r) => r.id !== deleteDialog.id))
          }
          break
      }
      toast.success("Deleted successfully", `${deleteDialog.name} has been removed`)
    } catch (error) {
      console.error("Error deleting:", error)
      toast.error("Error deleting", "Please try again")
      throw error
    }
  }

  // Profile update: uploading avatar, bio, cuisines, etc.
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file)
      if (uploadError) {
        toast.error("Error uploading image", uploadError.message)
        return
      }

      const { data: publicData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath)
      if (!publicData.publicUrl) {
        toast.error("Error", "Could not get image URL")
        return
      }

      setProfilePicture(publicData.publicUrl)
    }
  }

  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          avatar_url: profilePicture,
          username,
          bio,
          cuisines: [cuisine1, cuisine2, cuisine3],
        },
      })
      if (error) throw error

      // Refresh user data so changes appear immediately
      const { error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      toast.success("Profile updated", "Your profile has been updated successfully")
      setEditMode(false)
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Error updating profile", "Please try again")
    }
  }

  if (!user) return null

  if (isLoading) {
    return (
      <main className="container max-w-2xl mx-auto pb-20 pt-4">
        <p>Loading profile...</p>
      </main>
    )
  }

  return (
    <main className="container max-w-2xl mx-auto pb-20 pt-4">
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name} />
            <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">
                {user.user_metadata?.full_name || user.email}
              </h1>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditMode(true)}
                  className="text-muted-foreground hover:text-primary"
                  title="Edit profile"
                >
                  <Edit className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  className="text-muted-foreground hover:text-destructive"
                  title="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <p className="text-muted-foreground">
              @{user.user_metadata?.username || user.email?.split("@")[0]}
            </p>
            {user.user_metadata?.bio && (
              <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">
                {user.user_metadata.bio}
              </p>
            )}
            {user.user_metadata?.cuisines?.length > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                <strong>Top Cuisines:</strong> {user.user_metadata.cuisines.join(", ")}
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-around text-center mb-6">
            <div>
              <div className="text-2xl font-bold">{stats.review_count}</div>
              <div className="text-sm text-muted-foreground">Reviews</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{lists.length}</div>
              <div className="text-sm text-muted-foreground">Lists</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{bookmarkedLists.length}</div>
              <div className="text-sm text-muted-foreground">Bookmarked</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{wishlist.length}</div>
              <div className="text-sm text-muted-foreground">Wishlist</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{visited.length}</div>
              <div className="text-sm text-muted-foreground">Visited</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {editMode && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-xl font-bold">Edit Profile</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div>
                <label className="block mb-1 text-sm font-medium text-foreground">
                  Profile Picture
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full rounded border border-input bg-background p-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                />
                {profilePicture && (
                  <img
                    src={profilePicture}
                    alt="Profile Preview"
                    className="mt-3 h-20 w-20 object-cover rounded-full border border-input"
                  />
                )}
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-foreground">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full rounded border border-input bg-background p-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-foreground">
                  Bio (max 100 words)
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="block w-full rounded border border-input bg-background p-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  placeholder="Share a little about yourself..."
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-foreground">
                  Top 3 Cuisines
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={cuisine1}
                    onChange={(e) => setCuisine1(e.target.value)}
                    className="block w-full rounded border border-input bg-background p-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    placeholder="Cuisine 1"
                  />
                  <input
                    type="text"
                    value={cuisine2}
                    onChange={(e) => setCuisine2(e.target.value)}
                    className="block w-full rounded border border-input bg-background p-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    placeholder="Cuisine 2"
                  />
                  <input
                    type="text"
                    value={cuisine3}
                    onChange={(e) => setCuisine3(e.target.value)}
                    className="block w-full rounded border border-input bg-background p-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    placeholder="Cuisine 3"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="reviews">
        <Card>
          <CardHeader>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="lists">Lists</TabsTrigger>
              <TabsTrigger value="bookmarked">Bookmarked</TabsTrigger>
              <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
              <TabsTrigger value="visited">Visited</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-4">
              {reviews.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No reviews yet</p>
                  <p className="text-sm mt-1">
                    Start reviewing restaurants to build your profile!
                  </p>
                </div>
              ) : (
                reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={{
                      ...review,
                      // Cast the tag property to the expected type.
                      tag: review.tag as unknown as any,
                      user: {
                        id: user.id,
                        username: user.user_metadata?.username || user.email?.split("@")[0],
                        avatar_url: user.user_metadata?.avatar_url || "",
                      },
                    }}
                    currentUserId={user.id}
                    onDelete={() => {
                      setReviews((prev) => prev.filter((r) => r.id !== review.id))
                      setStats((prev) => ({
                        ...prev,
                        review_count: prev.review_count - 1,
                        golden_spoon_count:
                          prev.golden_spoon_count - (review.is_golden_spoon ? 1 : 0),
                        wooden_spoon_count:
                          prev.wooden_spoon_count - (review.is_wooden_spoon ? 1 : 0),
                      }))
                    }}
                    showRestaurantInfo={true}
                  />
                ))
              )}
            </TabsContent>

            {/* Your Lists Tab */}
            <TabsContent value="lists">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Your Lists</h2>
                  <Button onClick={() => setShowCreateListDialog(true)}>
                    Create List
                  </Button>
                </div>

                {lists.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No lists yet</p>
                    <p className="text-sm mt-1">
                      Create your first list to start organizing restaurants!
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {lists.map((list) => {
                      const countValue = getCount(list.restaurant_count)
                      return (
                        <Card
                          key={list.id}
                          className="hover:bg-accent/50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/lists/${list.id}`)}
                        >
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex gap-4">
                              {list.cover_url ? (
                                <div className="relative w-24 h-24 rounded-md overflow-hidden">
                                  <img
                                    src={list.cover_url}
                                    alt={list.name}
                                    className="object-cover w-full h-full"
                                  />
                                </div>
                              ) : (
                                <div className="w-24 h-24 rounded-md bg-muted flex items-center justify-center">
                                  <span className="text-3xl">📋</span>
                                </div>
                              )}
                              <div>
                                <h3 className="font-semibold text-lg">{list.name}</h3>
                                {list.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                    {list.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>{countValue} restaurants</span>
                                  <span>•</span>
                                  <span>{new Date(list.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteDialog({
                                  isOpen: true,
                                  type: "list",
                                  id: list.id,
                                  name: list.name,
                                })
                              }}
                            >
                              Delete
                            </Button>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Bookmarked Lists Tab */}
            <TabsContent value="bookmarked">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Bookmarked Lists</h2>
                {bookmarkedLists.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No bookmarked lists</p>
                    <p className="text-sm mt-1">
                      Bookmark other users' lists to see them here
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {bookmarkedLists.map((list) => {
                      const countValue = getCount(list.restaurant_count)
                      return (
                        <Card key={list.id} className="hover:bg-accent/50 transition-colors">
                          <CardContent
                            className="p-4 flex items-center justify-between"
                            onClick={() => navigate(`/lists/${list.id}`)}
                          >
                            <div className="flex gap-4">
                              {list.cover_url ? (
                                <div className="relative w-24 h-24 rounded-md overflow-hidden">
                                  <img
                                    src={list.cover_url}
                                    alt={list.name}
                                    className="object-cover w-full h-full"
                                  />
                                </div>
                              ) : (
                                <div className="w-24 h-24 rounded-md bg-muted flex items-center justify-center">
                                  <span className="text-3xl">📋</span>
                                </div>
                              )}
                              <div>
                                <h3 className="font-semibold text-lg">{list.name}</h3>
                                {list.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                    {list.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>{countValue} restaurants</span>
                                  <span>•</span>
                                  <span>{new Date(list.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Wishlist Tab */}
            <TabsContent value="wishlist">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Wishlist</h2>
                  <Button onClick={() => setShowAddToWishlistDialog(true)}>
                    Add Restaurant
                  </Button>
                </div>
                {wishlist.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Your wishlist is empty</p>
                    <p className="text-sm mt-1">Save restaurants you want to visit!</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {wishlist.map((restaurant) => (
                      <Card
                        key={restaurant.id}
                        className="cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                      >
                        <CardContent className="p-4 flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{restaurant.name}</h3>
                            <p className="text-sm text-muted-foreground">{restaurant.address}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteDialog({
                                isOpen: true,
                                type: "wishlist",
                                id: restaurant.id,
                                name: restaurant.name,
                              })
                            }}
                          >
                            Remove
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Visited Tab */}
            <TabsContent value="visited">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Visited Places</h2>
                  <Button onClick={() => setShowAddToVisitedDialog(true)}>
                    Add Restaurant
                  </Button>
                </div>
                {visited.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No visited restaurants yet</p>
                    <p className="text-sm mt-1">
                      Mark restaurants as visited to track your dining history!
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {visited.map((restaurant) => (
                      <Card
                        key={restaurant.id}
                        className="cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                      >
                        <CardContent className="p-4 flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{restaurant.name}</h3>
                            <p className="text-sm text-muted-foreground">{restaurant.address}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteDialog({
                                isOpen: true,
                                type: "visited",
                                id: restaurant.id,
                                name: restaurant.name,
                              })
                            }}
                          >
                            Remove
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      {/* Dialogs */}
      <CreateListDialog
        isOpen={showCreateListDialog}
        onClose={() => setShowCreateListDialog(false)}
        onSuccess={loadUserData}
      />

      <DeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={() =>
          setDeleteDialog({ isOpen: false, type: "list", id: "", name: "" })
        }
        onConfirm={handleDelete}
        title={`Delete ${deleteDialog.type === "list" ? "List" : "Restaurant"}`}
        description={`Are you sure you want to delete "${deleteDialog.name}"? This action cannot be undone.`}
      />

      <AddToSavedDialog
        isOpen={showAddToWishlistDialog}
        onClose={() => setShowAddToWishlistDialog(false)}
        onSuccess={loadUserData}
        type="wishlist"
      />

      <AddToSavedDialog
        isOpen={showAddToVisitedDialog}
        onClose={() => setShowAddToVisitedDialog(false)}
        onSuccess={loadUserData}
        type="visited"
      />
    </main>
  )
}
