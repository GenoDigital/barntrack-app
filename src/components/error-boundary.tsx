'use client'

import React, { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught:', error, errorInfo)

    // Call optional error handler
    this.props.onError?.(error, errorInfo)

    // TODO: Log to error monitoring service in production
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error, {
    //     contexts: { react: { componentStack: errorInfo.componentStack } }
    //   })
    // }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center p-2 bg-destructive/10 rounded-full">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-lg">Ein Fehler ist aufgetreten</CardTitle>
                <CardDescription>
                  Dieser Bereich konnte nicht geladen werden
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-4 p-3 bg-muted rounded text-xs font-mono break-all">
                {this.state.error.message}
              </div>
            )}
            <Button onClick={this.handleReset} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

// Functional wrapper for easier usage with hooks
export function ErrorBoundaryWrapper({
  children,
  fallback,
  onError,
}: {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}) {
  return (
    <ErrorBoundary fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundary>
  )
}
