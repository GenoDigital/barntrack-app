// Utility functions for price formatting
import React from 'react'

export function formatPrice(amount: number, currency: string): string {
  // Stripe amounts are in cents, so divide by 100
  const price = amount / 100
  
  switch (currency.toLowerCase()) {
    case 'eur':
      return `€${price.toFixed(0)}`
    case 'usd':
      return `$${price.toFixed(0)}`
    default:
      return `${price.toFixed(2)} ${currency.toUpperCase()}`
  }
}

export function formatPeriod(interval: string): string {
  switch (interval) {
    case 'month':
      return '/Monat'
    case 'year':
      return '/Jahr'
    case 'week':
      return '/Woche'
    case 'day':
      return '/Tag'
    default:
      return `/${interval}`
  }
}

export interface StripePrice {
  price_id: string
  product_name: string
  unit_amount: number
  currency: string
  recurring_interval: string
}

export interface PlanConfig {
  name: string
  description: string
  badge?: string | null
  features: string[]
  icon: React.ComponentType<any>
  popular?: boolean
}

export function matchPriceToConfig(prices: StripePrice[], configs: Record<string, PlanConfig>) {
  return prices.map(price => {
    const config = configs[price.product_name] || configs[price.product_name.toLowerCase()]
    if (!config) {
      console.warn(`No configuration found for product: ${price.product_name}`)
      return null
    }
    
    return {
      name: price.product_name,
      price: formatPrice(price.unit_amount, price.currency),
      period: formatPeriod(price.recurring_interval),
      priceId: price.price_id,
      description: config.description,
      badge: config.badge,
      features: config.features,
      icon: config.icon,
      popular: config.popular || false
    }
  }).filter(Boolean)
}