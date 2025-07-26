import { cn } from "@/lib/utils"

interface ScoreIndicatorProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

export function ScoreIndicator({ score, size = 'md', showText = true, className }: ScoreIndicatorProps) {
  const getColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100 border-green-200'
    if (score >= 60) return 'text-orange-600 bg-orange-100 border-orange-200'
    return 'text-red-600 bg-red-100 border-red-200'
  }

  const getSize = (size: string) => {
    switch (size) {
      case 'sm': return 'w-8 h-8 text-xs'
      case 'lg': return 'w-16 h-16 text-lg font-bold'
      default: return 'w-12 h-12 text-sm font-semibold'
    }
  }

  const getRating = (score: number) => {
    if (score >= 80) return 'Good'
    if (score >= 60) return 'OK'
    return 'Needs work'
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        "rounded-full border-2 flex items-center justify-center",
        getColor(score),
        getSize(size)
      )}>
        {score}
      </div>
      {showText && (
        <span className={cn(
          "font-medium",
          score >= 80 ? 'text-green-700' : score >= 60 ? 'text-orange-700' : 'text-red-700'
        )}>
          {getRating(score)}
        </span>
      )}
    </div>
  )
}