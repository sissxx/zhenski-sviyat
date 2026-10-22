# Accounts and login

Supabase Auth with email and password. All pages are Bulgarian.

| Page | Path |
| --- | --- |
| Sign-up (`?plan=<slug>` continues to subscriptions after confirming) | `/registratsiya` |
| Login (`?next=` returns to the page that asked for it) | `/vhod` |
| Forgot password | `/zabravena-parola` |
| New password (from the reset email, or "Смени паролата" in the profile) | `/nova-parola` |
| Email link landing (confirm, reset, email change) | `/auth/confirm` |
| Account area: overview, details, events, consultations, subscriptions | `/profil/*` |
| Privacy policy and terms (placeholders until NSJS sends the final text) | `/poveritelnost`, `/obshti-usloviya` |

- Forms validate in the browser and again in the server actions (`src/lib/auth/actions.ts`) with the same Zod schemas.
- Sign-up passes `first_name`, `last_name`, `phone`, `terms_accepted`, `privacy_accepted` and `marketing_consent`
  as user metadata; the `handle_new_auth_user` trigger turns them into the `profiles` row.
- `src/proxy.ts` refreshes the session, sends visitors from `/profil/*` to login and signed-in users past login and
  sign-up. The account layout checks the user again with `auth.getUser()`, which is the real guard.
- Supabase Auth error codes map to Bulgarian in `src/lib/auth/errors.ts`.
- Password reset always answers "if there is an account…", so the form doesn't reveal which emails are registered.

## Supabase settings this needs

Authentication → URL Configuration:
- **Site URL**: the production address once the domain is known.
- **Redirect URLs**: `http://localhost:3000/auth/confirm**`, the production `https://<domain>/auth/confirm**` and the
  Vercel preview pattern `https://*-<team>.vercel.app/auth/confirm**`. Links to an address not on the list fall back to the Site URL.

`/auth/confirm` accepts both the default email templates (PKCE `?code=`, which only works in the browser that signed up)
and the recommended templates that link straight to the site, which work on any device:

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next={{ .RedirectTo }}
```

(`type=recovery` for the reset template, `type=email_change` for email change). The built-in Supabase mailer sends only a
few emails an hour; production should send through Brevo SMTP (Authentication → SMTP Settings), with Bulgarian templates.
