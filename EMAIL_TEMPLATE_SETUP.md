# Email Template Setup for PKCE Flow

This application uses Supabase's PKCE authentication flow (required for Next.js SSR). You need to update your Supabase email templates to use the token hash format.

## Required Email Template Updates

### 1. Confirm Signup Email Template

Go to: **Supabase Dashboard → Authentication → Email Templates → Confirm signup**

Replace the template with:

```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your user:</p>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next={{ .RedirectTo }}">
    Confirm your email
  </a>
</p>
```

**Important Variables:**
- `{{ .SiteURL }}` - Your app's URL (e.g., https://barntrack.app)
- `{{ .TokenHash }}` - The token hash for PKCE verification
- `{{ .RedirectTo }}` - The `emailRedirectTo` URL specified in signUp() call
- `type=email` - Tells verifyOtp this is an email confirmation

### 2. Magic Link Email Template (Optional)

If you use magic links, update similarly:

```html
<h2>Magic Link</h2>

<p>Follow this link to login:</p>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next={{ .RedirectTo }}">
    Log In
  </a>
</p>
```

### 3. Reset Password Email Template (Optional)

If you use password reset:

```html
<h2>Reset Password</h2>

<p>Follow this link to reset the password for your user:</p>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/account/update-password">
    Reset Password
  </a>
</p>
```

## How It Works

1. User signs up with `emailRedirectTo: '/accept-invitation?token=...'`
2. Supabase sends email with link: `/auth/confirm?token_hash=ABC&type=email&next=/accept-invitation?token=...`
3. User clicks link → hits `/app/auth/confirm/route.ts`
4. Route calls `supabase.auth.verifyOtp()` to exchange token for session
5. Route redirects to `next` parameter (`/accept-invitation?token=...`)
6. Accept invitation page processes invitation and creates farm membership

## Testing

After updating the templates:

1. Create a new test user with an invitation
2. Check the confirmation email - verify the link format matches above
3. Click the link - should redirect through `/auth/confirm` to `/accept-invitation`
4. Verify invitation is marked as used and farm membership is created

## Troubleshooting

**Link doesn't work:**
- Check that Site URL is configured correctly in Supabase dashboard
- Verify `/auth/confirm/route.ts` exists
- Check browser console and server logs for errors

**Redirects to wrong page:**
- Verify `emailRedirectTo` is set correctly in signUp() call
- Check that `{{ .RedirectTo }}` is in the email template

**Token verification fails:**
- Email links expire after a certain time
- User may have clicked an old link - request new confirmation email
