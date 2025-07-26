import { AssessmentResult } from "@/lib/seo-analyzer"
import { cn } from "@/lib/utils"
import { CheckCircle, AlertCircle, XCircle, Info } from "lucide-react"

interface AssessmentItemProps {
  assessment: AssessmentResult
  className?: string
}

export function AssessmentItem({ assessment, className }: AssessmentItemProps) {
  const getIcon = (rating: string) => {
    switch (rating) {
      case 'good':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'ok':
        return <AlertCircle className="w-4 h-4 text-orange-600" />
      case 'bad':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Info className="w-4 h-4 text-gray-600" />
    }
  }

  const getBulletColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'bg-green-600'
      case 'ok': return 'bg-orange-600'
      case 'bad': return 'bg-red-600'
      default: return 'bg-gray-600'
    }
  }

  const getTextColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'text-green-700'
      case 'ok': return 'text-orange-700'
      case 'bad': return 'text-red-700'
      default: return 'text-gray-700'
    }
  }

  return (
    <div className={cn("flex items-start gap-3 p-3 rounded-lg border bg-white", className)}>
      <div className="flex-shrink-0 mt-0.5">
        {getIcon(assessment.rating)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <div className={cn("w-2 h-2 rounded-full", getBulletColor(assessment.rating))} />
          <span className="text-sm font-medium text-gray-900 capitalize">
            {assessment.id.replace(/-/g, ' ')}
          </span>
        </div>
        <p className={cn("text-sm", getTextColor(assessment.rating))}>
          {assessment.text}
        </p>
      </div>
    </div>
  )
}