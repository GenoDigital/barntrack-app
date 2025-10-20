'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'

const sponsorshipFormSchema = z.object({
  company_name: z.string().min(2, 'Firmenname muss mindestens 2 Zeichen lang sein'),
  contact_name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  email: z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
  phone: z.string().optional(),
  message: z.string().optional(),
})

type SponsorshipFormData = z.infer<typeof sponsorshipFormSchema>

export function SponsorshipForm() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const supabase = createClient()
  const { executeRecaptcha } = useGoogleReCaptcha()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SponsorshipFormData>({
    resolver: zodResolver(sponsorshipFormSchema),
  })

  const onSubmit = async (data: SponsorshipFormData) => {
    if (!executeRecaptcha) {
      toast.error('reCAPTCHA ist noch nicht geladen. Bitte warten Sie einen Moment.')
      return
    }

    setLoading(true)

    try {
      // Get reCAPTCHA token
      const recaptchaToken = await executeRecaptcha('partnership_form')

      // Save to database
      const { error: dbError } = await supabase
        .from('sponsorship_inquiries')
        .insert([
          {
            company_name: data.company_name,
            contact_name: data.contact_name,
            email: data.email,
            phone: data.phone || null,
            message: data.message || null,
            status: 'new',
          },
        ])

      if (dbError) {
        console.error('Error saving partnership inquiry to database:', dbError)
        toast.error('Es gab einen Fehler beim Speichern. Bitte versuchen Sie es erneut.')
        return
      }

      // Send email via Edge Function
      const { error: emailError } = await supabase.functions.invoke('send-contact-form', {
        body: {
          formType: 'partnership',
          formData: data,
          recaptchaToken,
        },
      })

      if (emailError) {
        console.error('Error sending email:', emailError)
        // Don't fail the form submission if email fails
        toast.warning('Anfrage gespeichert, aber E-Mail konnte nicht gesendet werden.')
      }

      setSubmitted(true)
      toast.success('Vielen Dank! Wir melden uns in Kürze bei Ihnen.')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Es gab einen Fehler beim Absenden des Formulars. Bitte versuchen Sie es erneut.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-12 pb-12 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold">Anfrage erfolgreich gesendet!</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Vielen Dank für Ihr Interesse an einer Partnerschaft mit barntrack. Unser Team wird sich innerhalb der nächsten 48 Stunden bei Ihnen melden, um die Möglichkeiten einer Zusammenarbeit zu besprechen.
          </p>
          <Button
            variant="outline"
            onClick={() => setSubmitted(false)}
            className="mt-6"
          >
            Weitere Anfrage senden
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Partnerschafts-Anfrage</CardTitle>
        <CardDescription>
          Werden Sie Partner und gestalten Sie die Zukunft der Tierhaltung mit
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="company_name">Firmenname *</Label>
            <Input
              id="company_name"
              placeholder="Ihr Unternehmen"
              {...register('company_name')}
              disabled={loading}
            />
            {errors.company_name && (
              <p className="text-sm text-red-600">{errors.company_name.message}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_name">Ansprechpartner *</Label>
              <Input
                id="contact_name"
                placeholder="Ihr Name"
                {...register('contact_name')}
                disabled={loading}
              />
              {errors.contact_name && (
                <p className="text-sm text-red-600">{errors.contact_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-Mail *</Label>
              <Input
                id="email"
                type="email"
                placeholder="ihre@firma.de"
                {...register('email')}
                disabled={loading}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefon (optional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+49 123 456789"
              {...register('phone')}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Nachricht (optional)</Label>
            <Textarea
              id="message"
              placeholder="Teilen Sie uns mit, wie Sie mit barntrack zusammenarbeiten möchten..."
              rows={4}
              {...register('message')}
              disabled={loading}
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Partnerschafts-Anfrage senden
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Mit dem Absenden stimmen Sie unserer Datenschutzerklärung zu. Diese Seite ist durch reCAPTCHA geschützt.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
