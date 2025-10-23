'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, ArrowRight, Loader2, Tag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'

interface SubscriptionCardProps {
  name: string
  price: string
  period: string
  description: string
  badge?: string
  priceId: string
  features: string[]
  icon: React.ComponentType<{ className?: string }>
  popular?: boolean
  isCurrentPlan?: boolean
  disabled?: boolean
}

export function SubscriptionCard({
  name,
  price,
  period,
  description,
  badge,
  priceId,
  features,
  icon: IconComponent,
  popular = false,
  isCurrentPlan = false,
  disabled = false
}: SubscriptionCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [promotionCode, setPromotionCode] = useState('')
  const [showPromotionInput, setShowPromotionInput] = useState(false)
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()

  const handleSubscribe = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Use wrapper-based subscription creation with optional promotion code
      // No trial days for regular plans - immediate yearly billing
      const { data, error } = await supabase.rpc('create_subscription_via_wrapper', {
        price_id: priceId,
        trial_days: 0,
        coupon_id: promotionCode.trim() || null
      })

      if (error) {
        if (error.message.includes('customer_required')) {
          setError('Please update your profile first to create a Stripe customer.')
          return
        }
        setError(error.message || 'Failed to create subscription')
        return
      }

      if (data?.success) {
        // Subscription created successfully via wrapper
        router.push('/dashboard?subscription_success=true')
      } else {
        setError(data?.error || 'Failed to create subscription')
      }
    } catch (err) {
      console.error('Error creating subscription:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getButtonText = () => {
    if (isCurrentPlan) return 'Aktueller Plan'
    if (loading) return 'Wird erstellt...'
    return 'Plan wählen'
  }

  const getButtonVariant = () => {
    if (isCurrentPlan) return 'secondary'
    if (popular) return 'default'
    return 'outline'
  }

  return (
    <Card className={`relative h-full flex flex-col ${popular ? 'border-2 border-primary shadow-lg scale-105' : ''} ${disabled ? 'opacity-50' : ''}`}>
      {badge && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-3 py-1">
            {badge}
          </Badge>
        </div>
      )}
      
      <CardHeader className="text-center pb-8">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <IconComponent className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">{name}</CardTitle>
        <CardDescription className="text-muted-foreground">
          {description}
        </CardDescription>
        <div className="mt-4">
          <span className="text-4xl font-bold">{price}</span>
          <span className="text-muted-foreground">{period}</span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 flex-1 flex flex-col">
        <ul className="space-y-3 flex-1">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        
        {error && (
          <div className="text-sm text-red-600 p-2 bg-red-50 rounded border border-red-200">
            {error}
          </div>
        )}
        
        {/* Simple Promotion Code Input */}
        {!isCurrentPlan && !disabled && (
          <div className="space-y-3">
            {!showPromotionInput ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPromotionInput(true)}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                <Tag className="mr-2 h-4 w-4" />
                Gutscheincode eingeben
              </Button>
            ) : (
              <div className="space-y-2">
                <Label htmlFor={`promotion-${priceId}`} className="text-sm font-medium">
                  Gutscheincode (optional)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id={`promotion-${priceId}`}
                    placeholder="Gutscheincode eingeben"
                    value={promotionCode}
                    onChange={(e) => setPromotionCode(e.target.value.toLowerCase())}
                    className="flex-1"
                    disabled={loading}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowPromotionInput(false)
                      setPromotionCode('')
                    }}
                    disabled={loading}
                  >
                    ✕
                  </Button>
                </div>
                {promotionCode && (
                  <p className="text-xs text-muted-foreground">
                    Der Gutscheincode wird beim Abonnement angewendet
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        
        <div className="pt-6">
          <Button
            className="w-full"
            size="lg"
            variant={getButtonVariant()}
            onClick={handleSubscribe}
            disabled={loading || isCurrentPlan || disabled}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {getButtonText()}
            {!loading && !isCurrentPlan && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}