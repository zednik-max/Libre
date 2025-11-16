# MAILGUN_API_KEY Configuration Guide

**Version**: v0.8.1-rc1
**Last Updated**: 2025-11-16

---

## What is MAILGUN_API_KEY?

**MAILGUN_API_KEY** enables email functionality in LibreChat using the Mailgun email service, primarily for password reset emails.

### What Users Get

When configured, LibreChat users can:
- ✅ **Password reset emails** - Reset forgotten passwords
- ✅ **Account verification** - Email verification links
- ✅ **Notifications** - System notifications via email
- ✅ **Reliable delivery** - Professional email infrastructure
- ✅ **Email tracking** - Delivery and open tracking
- ✅ **Domain reputation** - Better inbox delivery

---

## Quick Setup

**1. Create Mailgun Account**:
- Visit: https://www.mailgun.com/
- Click **"Sign Up"**
- Choose plan (free tier: 5,000 emails/month for 3 months)
- Verify email

**2. Get API Key**:
- Log in to Mailgun dashboard
- Go to: **Settings > API Keys**
- Copy **Private API key**
- Format: starts with `key-...`

**3. Set Up Domain** (recommended):
- Go to **Sending > Domains**
- Click **"Add New Domain"**
- Enter subdomain: `mg.yourdomain.com`
- Add DNS records (Mailgun provides exact records)
- Wait for verification (can take 24-48 hours)

**Or use Sandbox Domain** (testing only):
- Mailgun provides: `sandbox123abc.mailgun.org`
- Limited to 5 authorized recipients
- Good for testing, not production

**4. Configure LibreChat**:
```bash
# Add to .env
MAILGUN_API_KEY=key-your-private-api-key
MAILGUN_DOMAIN=mg.yourdomain.com
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME="LibreChat"

# For EU region (if applicable)
# MAILGUN_HOST=https://api.eu.mailgun.net

# Enable password reset
ALLOW_PASSWORD_RESET=true
```

**5. Restart LibreChat**:
```bash
docker-compose -f docker-compose.windows.yml restart api
```

---

## What Users Experience

**Password Reset Flow**:
```
1. User clicks "Forgot Password"
2. Enters email address
3. Receives password reset email (via Mailgun)
4. Clicks reset link
5. Sets new password
6. Can log in with new password
```

**Email Example**:
```
From: LibreChat <noreply@yourdomain.com>
To: user@example.com
Subject: Password Reset Request

Hi,

You requested a password reset for your LibreChat account.
Click the link below to reset your password:

[Reset Password Button]

This link expires in 1 hour.

If you didn't request this, please ignore this email.

Thanks,
The LibreChat Team
```

---

## Pricing

**Free Tier (Trial)**:
- 5,000 emails/month for 3 months
- Credit card required
- All features included

**Paid Plans**:
- **Foundation**: $35/month (50,000 emails)
- **Growth**: $80/month (100,000 emails)
- **Scale**: Custom pricing
- Visit: https://www.mailgun.com/pricing/

---

## Configuration Reference

```bash
# Required
MAILGUN_API_KEY=key-your-private-api-key
MAILGUN_DOMAIN=mg.yourdomain.com
EMAIL_FROM=noreply@yourdomain.com

# Optional
EMAIL_FROM_NAME="LibreChat"
MAILGUN_HOST=https://api.mailgun.net  # US region (default)
# MAILGUN_HOST=https://api.eu.mailgun.net  # EU region

# Enable password reset feature
ALLOW_PASSWORD_RESET=true
```

---

## Alternative: Generic SMTP

If you prefer not to use Mailgun, you can use any SMTP server:

```bash
# Instead of Mailgun, use generic SMTP
EMAIL_SERVICE=smtp  # or gmail, outlook, etc.
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_ENCRYPTION=tls
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME="LibreChat"

ALLOW_PASSWORD_RESET=true
```

**Popular SMTP services**:
- Gmail (with App Password)
- Outlook/Office 365
- SendGrid
- Amazon SES
- Custom SMTP server

---

## DNS Configuration

**Required DNS records** (for custom domain):

Add these to your domain's DNS:

```
Type: TXT
Host: mg.yourdomain.com
Value: v=spf1 include:mailgun.org ~all

Type: TXT
Host: krs._domainkey.mg.yourdomain.com
Value: [Mailgun provides exact value]

Type: CNAME
Host: email.mg.yourdomain.com
Value: mailgun.org

Type: MX
Host: mg.yourdomain.com
Value: mxa.mailgun.org (Priority: 10)

Type: MX
Host: mg.yourdomain.com
Value: mxb.mailgun.org (Priority: 10)
```

**Verification**:
- Records can take 24-48 hours to propagate
- Check status in Mailgun dashboard
- Domain shows "Active" when verified

---

## Testing

**Test password reset**:
1. Go to LibreChat login page
2. Click **"Forgot Password"**
3. Enter your email
4. Check inbox for reset email
5. Click reset link
6. Set new password

**Check Mailgun logs**:
- Mailgun dashboard > **Sending > Logs**
- View sent, delivered, failed emails
- Debug delivery issues

**Test in LibreChat**:
```bash
# View logs
docker logs LibreChat | grep -i email
docker logs LibreChat | grep -i mailgun
```

---

## Troubleshooting

**No email received**:
- Check spam/junk folder
- Verify MAILGUN_API_KEY is correct
- Ensure ALLOW_PASSWORD_RESET=true
- Check Mailgun logs for delivery status
- Verify domain is verified (not sandbox for production)

**API key invalid**:
- Ensure using **Private API key** (not Public)
- Check for typos
- Regenerate key if needed

**Domain not verified**:
- Wait 24-48 hours for DNS propagation
- Verify DNS records match Mailgun requirements
- Use `dig` or `nslookup` to check DNS
- Use sandbox domain for testing

**Emails go to spam**:
- Verify SPF, DKIM, DMARC records
- Use verified custom domain (not sandbox)
- Add unsubscribe link
- Warm up domain (send gradually increasing volume)

---

## Security Best Practices

**Protect API Key**:
```bash
# Never commit .env to git
echo ".env" >> .gitignore

# Restrict file permissions
chmod 600 .env

# Use different keys for dev/prod
MAILGUN_API_KEY_DEV=key-dev...
MAILGUN_API_KEY_PROD=key-prod...
```

**Rate Limiting**:
- Implement rate limiting on password reset
- Prevent email bombing attacks
- LibreChat has built-in rate limiting

**Email Validation**:
- Verify email addresses before sending
- Check for disposable email domains
- Implement email verification flow

---

## Related Documentation

- **Password Reset**: See ALLOW_PASSWORD_RESET in .env.example
- **Email Service**: See EMAIL_SERVICE alternatives
- **Main Guide**: See [CLAUDE.md](../../../CLAUDE.md)

---

*For more info: https://documentation.mailgun.com/*
