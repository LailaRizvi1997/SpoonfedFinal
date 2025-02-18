import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { Star, Users, Award, AlertTriangle } from "lucide-react"

type ReviewTag = 
  | "worth the hype"
  | "underrated"
  | "overhyped"
  | "elite"
  | "daylight robbery"
  | "guilty pleasure"
  | "marmite"
  | "mid"
  | "NPC central"

type RestaurantStats = {
  rating_avg: number
  visit_count: number
  review_count: number
  golden_spoon_count: number
  wooden_spoon_count: number
  review_distribution: number[]
  most_common_tag: {
    tag: ReviewTag
    count: number
  } | null
}

function getTagColor(tag: ReviewTag): string {
  switch (tag) {
    case "worth the hype":
      return "bg-green-500/10 text-green-500"
    case "elite":
      return "bg-purple-500/10 text-purple-500"
    case "underrated":
      return "bg-blue-500/10 text-blue-500"
    case "overhyped":
      return "bg-orange-500/10 text-orange-500"
    case "daylight robbery":
      return "bg-red-500/10 text-red-500"
    case "guilty pleasure":
      return "bg-pink-500/10 text-pink-500"
    case "marmite":
      return "bg-yellow-500/10 text-yellow-500"
    case "mid":
      return "bg-gray-500/10 text-gray-500"
    case "NPC central":
      return "bg-indigo-500/10 text-indigo-500"
    default:
      return "bg-gray-500/10 text-gray-500"
  }
}

function getDistributionType(distribution: number[]): {
  type: "Normal" | "Right-skewed" | "Left-skewed" | "Bimodal"
  color: string
} {
  const total = distribution.reduce((a, b) => a + b, 0)
  if (total === 0) {
    return { type: "Normal", color: "text-blue-500" }
  }
  
  const mean = distribution.reduce((a, b, i) => a + b * (i + 1), 0) / total
  const median = distribution.findIndex((_, i) => {
    const sum = distribution.slice(0, i + 1).reduce((a, b) => a + b, 0)
    return sum >= total / 2
  }) + 1

  if (Math.abs(mean - median) < 0.5) {
    return { type: "Normal", color: "text-blue-500" }
  } else if (mean > median) {
    return { type: "Right-skewed", color: "text-green-500" }
  } else if (mean < median) {
    return { type: "Left-skewed", color: "text-red-500" }
  } else {
    return { type: "Bimodal", color: "text-purple-500" }
  }
}

export function RestaurantStats({ stats }: { stats: RestaurantStats }) {
  const distributionType = getDistributionType(stats.review_distribution)
  const maxCount = Math.max(...stats.review_distribution, 1) // Ensure non-zero denominator

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Rating Distribution</h3>
              <Badge className={distributionType.color}>
                {distributionType.type}
              </Badge>
            </div>
            <div className="flex items-end gap-1 h-32">
              {stats.review_distribution.map((count, i) => {
                const height = (count / maxCount) * 100
                const percentage = stats.review_count > 0 
                  ? (count / stats.review_count) * 100 
                  : 0
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-xs text-muted-foreground">
                      {Math.round(percentage)}%
                    </div>
                    <div 
                      className="w-full bg-primary/20 rounded-sm transition-all duration-500"
                      style={{ height: `${height}%` }}
                    />
                    <div className="text-sm">{i + 1}★</div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-secondary" />
                <span className="font-semibold text-lg">
                  {stats.rating_avg.toFixed(1)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Average Rating
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="font-semibold text-lg">
                  {stats.visit_count}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Total Visits
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <span className="font-semibold text-lg">
                  {stats.golden_spoon_count}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Golden Spoons
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span className="font-semibold text-lg">
                  {stats.wooden_spoon_count}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Wooden Spoons
              </p>
            </div>
          </div>

          {stats.most_common_tag && (
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2">Most Common Tag</h4>
              <Badge className={getTagColor(stats.most_common_tag.tag)}>
                {stats.most_common_tag.tag} ({stats.most_common_tag.count})
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}