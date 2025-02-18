"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Loader2, Plus } from "lucide-react"

// Updated List type to allow aggregator values for restaurant_count.
type List = {
  id: string
  name: string
  description: string | null
  cover_url: string | null
  created_at: string
  restaurant_count: number | { count: number } | { count: number }[]
}

interface AddToListDialogProps {
  isOpen: boolean
  onClose: () => void
  restaurantId: string
  restaurantName: string
}

/**
 * Recursive helper to extract a plain number from an aggregator field.
 * It will sum up all "count" values if an array is returned.
 */
function getCount(
  rc: number | { count: number } | { count: number }[] | null
): number {
  if (rc == null) return 0;
  if (typeof rc === "number") return rc;
  if (Array.isArray(rc)) {
    return rc.reduce((acc, cur) => acc + getCount(cur), 0);
  }
  if (typeof rc === "object" && "count" in rc) {
    return getCount(rc.count);
  }
  return 0;
}

export function AddToListDialog({
  isOpen,
  onClose,
  restaurantId,
  restaurantName,
}: AddToListDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lists, setLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [showNewListForm, setShowNewListForm] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadLists();
    }
  }, [isOpen, user]);

  const loadLists = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
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
        .order("created_at", { ascending: false });

      if (error) throw error;
      console.log("Lists data:", data); // For debugging the data shape
      setLists(data || []);
    } catch (error) {
      console.error("Error loading lists:", error);
      toast.error("Error loading lists", "Please try again");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateList = async () => {
    if (!user) return;
    if (!newListName.trim()) {
      toast.error("Please enter a list name");
      return;
    }

    setIsCreating(true);
    try {
      // Create new list
      const { data: list, error: listError } = await supabase
        .from("lists")
        .insert({
          user_id: user.id,
          name: newListName.trim(),
        })
        .select()
        .single();

      if (listError) throw listError;

      // Add restaurant to the new list
      const { error: addError } = await supabase
        .from("list_restaurants")
        .insert({
          list_id: list.id,
          restaurant_id: restaurantId,
        });

      if (addError) throw addError;

      toast.success(
        "List created!",
        `${restaurantName} has been added to ${newListName}`
      );
      
      setNewListName("");
      setShowNewListForm(false);
      loadLists();
    } catch (error) {
      console.error("Error creating list:", error);
      toast.error("Error creating list", "Please try again");
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddToList = async (listId: string, listName: string) => {
    try {
      const { error } = await supabase
        .from("list_restaurants")
        .insert({
          list_id: listId,
          restaurant_id: restaurantId,
        });

      if (error) {
        if (error.code === "23505") {
          toast.error("Already in list", `${restaurantName} is already in ${listName}`);
          return;
        } else {
          toast.error("Error adding to list", error.message);
          return;
        }
      }

      toast.success("Added to list!", `${restaurantName} has been added to ${listName}`);
      onClose();
    } catch (error) {
      console.error("Error adding to list:", error);
      toast.error("Error adding to list", "Please try again");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add to List</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          {showNewListForm ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>List Name</Label>
                <Input
                  placeholder="Enter list name..."
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  maxLength={100}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowNewListForm(false)}
                >
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleCreateList} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create & Add"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowNewListForm(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New List
            </Button>
          )}

          <div className="space-y-2">
            <Label>Your Lists</Label>
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">
                <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                <p className="mt-2">Loading lists...</p>
              </div>
            ) : lists.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <p>No lists yet</p>
                <p className="text-sm mt-1">Create your first list above</p>
              </div>
            ) : (
              <div className="space-y-2">
                {lists.map((list) => {
                  const countValue = getCount(list.restaurant_count);
                  return (
                    <Card
                      key={list.id}
                      className="p-4 hover:bg-accent transition-colors cursor-pointer"
                      onClick={() => handleAddToList(list.id, list.name)}
                    >
                      <div className="flex items-center gap-4">
                        {list.cover_url ? (
                          <div className="w-12 h-12 rounded-md overflow-hidden">
                            <img
                              src={list.cover_url}
                              alt={list.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                            <span className="text-2xl">📋</span>
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium">{list.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {countValue} restaurants
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
