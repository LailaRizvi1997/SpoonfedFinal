import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Lock, Star, Bell, TrendingUp } from "lucide-react"

type PremiumPaywallProps = {
  isOpen: boolean
  onClose: () => void
}

export function PremiumPaywall({ isOpen, onClose }: PremiumPaywallProps) {
  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    // TODO: Implement Stripe integration
    console.log('Subscribe to', plan)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-secondary" />
            Hidden Gems Pass
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Unlock Premium Features</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Lock className="h-4 w-4 mt-1 text-primary" />
                <div>
                  <p className="font-medium">Full Access to Gatekept Restaurants</p>
                  <p className="text-sm text-muted-foreground">
                    Discover the city's best hidden gems
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Bell className="h-4 w-4 mt-1 text-primary" />
                <div>
                  <p className="font-medium">Early Access Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    24h head start when restaurants become public
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 mt-1 text-primary" />
                <div>
                  <p className="font-medium">Exclusive Analytics</p>
                  <p className="text-sm text-muted-foreground">
                    Track gatekeeping trends and patterns
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div className="grid gap-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Monthly</h4>
                <Badge variant="secondary">Popular</Badge>
              </div>
              <div className="flex items-baseline mb-4">
                <span className="text-3xl font-bold">$4.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <Button 
                onClick={() => handleSubscribe('monthly')}
                className="w-full"
              >
                Subscribe Monthly
              </Button>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Yearly</h4>
                <Badge variant="secondary">Save 17%</Badge>
              </div>
              <div className="flex items-baseline mb-4">
                <span className="text-3xl font-bold">$49.99</span>
                <span className="text-muted-foreground">/year</span>
              </div>
              <Button 
                onClick={() => handleSubscribe('yearly')}
                className="w-full"
                variant="outline"
              >
                Subscribe Yearly
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}