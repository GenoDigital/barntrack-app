import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Play } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.primary.100),transparent)]" />

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-background/50 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium">Jetzt verfügbar</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            Futtermittelverwaltung
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              neu gedacht
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Verwalten Sie Ihre Futterdaten, berechnen Sie Kosten automatisch und behalten Sie den Überblick über alle Ihre Ställe – alles in einer intelligenten Plattform.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link href="/signup">
              <Button size="lg" className="gap-2 text-base px-8">
                Kostenlos starten <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="gap-2 text-base px-8">
                <Play className="h-5 w-5" />
                Demo buchen
              </Button>
            </Link>
          </div>

          {/* Social Proof */}
          <div className="pt-8 flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Bereits vertraut von landwirtschaftlichen Betrieben in ganz Deutschland
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">14</span>
                <span>Tage kostenlos testen</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">DSGVO</span>
                <span>konform</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">🇪🇺</span>
                <span>EU Hosting</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
