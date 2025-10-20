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

const contactFormSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  email: z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
  subject: z.string().min(3, 'Betreff muss mindestens 3 Zeichen lang sein'),
  message: z.string().min(10, 'Nachricht muss mindestens 10 Zeichen lang sein'),
})

type ContactFormData = z.infer<typeof contactFormSchema>

export function ContactForm() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const supabase = createClient()
  const { executeRecaptcha } = useGoogleReCaptcha()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
  })

  const onSubmit = async (data: ContactFormData) => {
    if (!executeRecaptcha) {
      toast.error('reCAPTCHA ist noch nicht geladen. Bitte warten Sie einen Moment.')
      return
    }

    setLoading(true)

    try {
      // Get reCAPTCHA token
      const recaptchaToken = await executeRecaptcha('contact_form')

      // Send email via Edge Function
      const { error: emailError } = await supabase.functions.invoke('send-contact-form', {
        body: {
          formType: 'contact',
          formData: data,
          recaptchaToken,
        },
      })

      if (emailError) {
        console.error('Error sending contact email:', emailError)
        toast.error('Es gab einen Fehler beim Absenden. Bitte versuchen Sie es erneut.')
        return
      }

      setSubmitted(true)
      toast.success('Vielen Dank! Ihre Nachricht wurde gesendet.')
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
          <h3 className="text-2xl font-bold">Nachricht erfolgreich gesendet!</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Vielen Dank für Ihre Nachricht. Wir werden uns so schnell wie möglich bei Ihnen melden.
          </p>
          <Button
            variant="outline"
            onClick={() => setSubmitted(false)}
            className="mt-6"
          >
            Weitere Nachricht senden
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Kontaktieren Sie uns</CardTitle>
        <CardDescription>
          Haben Sie Fragen? Wir helfen Ihnen gerne weiter
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Ihr Name"
                {...register('name')}
                disabled={loading}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-Mail *</Label>
              <Input
                id="email"
                type="email"
                placeholder="ihre@email.de"
                {...register('email')}
                disabled={loading}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Betreff *</Label>
            <Input
              id="subject"
              placeholder="Worum geht es?"
              {...register('subject')}
              disabled={loading}
            />
            {errors.subject && (
              <p className="text-sm text-red-600">{errors.subject.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Nachricht *</Label>
            <Textarea
              id="message"
              placeholder="Ihre Nachricht an uns..."
              rows={6}
              {...register('message')}
              disabled={loading}
            />
            {errors.message && (
              <p className="text-sm text-red-600">{errors.message.message}</p>
            )}
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Nachricht senden
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Mit dem Absenden stimmen Sie unserer Datenschutzerklärung zu. Diese Seite ist durch reCAPTCHA geschützt.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
