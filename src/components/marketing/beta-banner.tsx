import { Lightbulb, Users, Sparkles } from 'lucide-react'
import Link from 'next/link'

export function BetaBanner() {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              BETA
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <p className="text-sm md:text-base text-gray-700 leading-relaxed">
              <strong className="text-gray-900">Unser Ziel:</strong> Eine Plattform zu schaffen, mit der Tierhaltern transparente Kostenverfolgung, Preisentwicklung und Monitoring relevanter Erfolgskennzahlen ermöglicht wird.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-blue-600" />
                <span>Wir suchen Partner</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lightbulb className="h-4 w-4 text-blue-600" />
                <span>Offen für innovative Ideen & Kooperationen</span>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Demo anfragen
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
