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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useGoogleReCaptcha, GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'

const demoFormSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  email: z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
  phone: z.string().optional(),
  company: z.string().optional(),
  farm_size: z.string().optional(),
  message: z.string().optional(),
})

type DemoFormData = z.infer<typeof demoFormSchema>

// Inner form component that uses the reCAPTCHA hook
function DemoFormInner() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const supabase = createClient()
  const { executeRecaptcha } = useGoogleReCaptcha()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<DemoFormData>({
    resolver: zodResolver(demoFormSchema),
  })

  const farmSize = watch('farm_size')

  const onSubmit = async (data: DemoFormData) => {
    if (!executeRecaptcha) {
      toast.error('reCAPTCHA ist noch nicht geladen. Bitte warten Sie einen Moment.')
      return
    }

    setLoading(true)

    try {
      // Get reCAPTCHA token
      const recaptchaToken = await executeRecaptcha('demo_form')

      // Save to database
      const { error: dbError } = await supabase
        .from('demo_requests')
        .insert([
          {
            name: data.name,
            email: data.email,
            phone: data.phone || null,
            company: data.company || null,
            farm_size: data.farm_size || null,
            message: data.message || null,
            status: 'new',
          },
        ])

      if (dbError) {
        console.error('Error saving demo request to database:', dbError)
        toast.error('Es gab einen Fehler beim Speichern. Bitte versuchen Sie es erneut.')
        return
      }

      // Send email via Edge Function
      const { error: emailError } = await supabase.functions.invoke('send-contact-form', {
        body: {
          formType: 'demo',
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
            Vielen Dank für Ihr Interesse an barntrack. Wir werden uns innerhalb der nächsten 24 Stunden bei Ihnen melden, um einen Demo-Termin zu vereinbaren.
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
        <CardTitle className="text-2xl">Demo anfragen</CardTitle>
        <CardDescription>
          Füllen Sie das Formular aus und wir melden uns bei Ihnen für eine persönliche Demo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Ihr vollständiger Name"
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

          <div className="grid md:grid-cols-2 gap-4">
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
              <Label htmlFor="company">Betrieb (optional)</Label>
              <Input
                id="company"
                placeholder="Name Ihres Betriebs"
                {...register('company')}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="farm_size">Betriebsgröße (optional)</Label>
            <Select
              value={farmSize}
              onValueChange={(value) => setValue('farm_size', value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Wählen Sie eine Größe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-50">1-50 Tiere</SelectItem>
                <SelectItem value="51-100">51-100 Tiere</SelectItem>
                <SelectItem value="101-500">101-500 Tiere</SelectItem>
                <SelectItem value="501-1000">501-1000 Tiere</SelectItem>
                <SelectItem value="1000+">Über 1000 Tiere</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Nachricht (optional)</Label>
            <Textarea
              id="message"
              placeholder="Teilen Sie uns mit, was Sie besonders interessiert..."
              rows={4}
              {...register('message')}
              disabled={loading}
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Demo anfragen
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Mit dem Absenden stimmen Sie unserer Datenschutzerklärung zu. Diese Seite ist durch reCAPTCHA geschützt.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

// Exported component with reCAPTCHA provider wrapper
export function DemoForm() {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

  if (!recaptchaSiteKey) {
    console.warn('NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set. reCAPTCHA will not work.')
    return <DemoFormInner />
  }

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={recaptchaSiteKey}
      scriptProps={{ async: true, defer: true, appendTo: 'head' }}
    >
      <DemoFormInner />
    </GoogleReCaptchaProvider>
  )
}
