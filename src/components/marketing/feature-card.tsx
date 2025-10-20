import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  badge?: string
}

export function FeatureCard({ icon: Icon, title, description, badge }: FeatureCardProps) {
  return (
    <Card className="relative h-full border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group">
      {badge && (
        <div className="absolute -top-3 right-4">
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
            {badge}
          </span>
        </div>
      )}
      <CardContent className="pt-8 pb-6 space-y-4">
        <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <Icon className="h-7 w-7 text-primary" />
        </div>
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  )
}
