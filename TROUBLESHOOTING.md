# Troubleshooting

## Database connection errors

If you see Prisma or MongoDB connection errors, check your `.env.local` file:

```env
DATABASE_URL=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority
```

### Common fixes

**"Authentication failed"**
- Verify the username and password in the connection string
- URL-encode special characters in the password (e.g. `@` → `%40`, `$` → `%24`)

**"Server selection timed out" / connection refused**
- In MongoDB Atlas → Network Access, allow your IP or `0.0.0.0/0` for development
- Confirm the cluster is running and the connection string matches your cluster

**Schema out of date**
- Run `pnpm prisma:push` after pulling schema changes

**Reset all data**
- Drop collections in MongoDB Atlas, or delete documents via Prisma Studio (`pnpm prisma:studio`)
- Restart the dev server — default admin passwords will be re-seeded if no admin records exist

## Email not sending

The app sends all email via **Resend**. Check your `.env.local`:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM=Secret Santa <onboarding@resend.dev>
```

### Common Resend errors

**"RESEND_API_KEY is missing"**
- Set `RESEND_API_KEY` in `.env.local` (local) or Vercel environment variables (production)
- Restart the dev server after changing env vars

**Invalid `from` address**
- The `from` email must match a verified domain in Resend
- For testing, use `onboarding@resend.dev` as the sender

**Rate limits**
- Resend free tier has sending limits — check the [Resend dashboard](https://resend.com)

**On Vercel**
- Go to Project → Settings → Environment Variables
- Ensure `RESEND_API_KEY` and `RESEND_FROM` are set for the Production environment
- Redeploy after adding or changing variables
- Check function logs for `[Email]` prefixed messages

## Turnstile verification failing

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-site-key-here
TURNSTILE_SECRET_KEY=your-secret-key-here
```

- Both keys must come from the same Turnstile site in the Cloudflare dashboard
- For local development, Cloudflare provides test keys that always pass — see [Turnstile docs](https://developers.cloudflare.com/turnstile/reference/testing/)
- Restart the dev server after changing env vars

## Admin login not working

- Default passwords on first run: `admin123` (admin) and `superadmin123` (superadmin)
- If you changed passwords via the superadmin panel, use the updated credentials
- Complete the Turnstile challenge before submitting the login form

## OTP not received

1. Confirm the participant email was added by an admin
2. Check spam/junk folders
3. Verify Resend configuration (see Email section above)
4. Check server logs for `[Email]` error messages when requesting an OTP
