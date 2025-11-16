# ALLOW_SOCIAL_LOGIN Configuration Guide

**Version**: v0.8.1-rc1
**Last Updated**: 2025-11-16

---

## What is ALLOW_SOCIAL_LOGIN?

**ALLOW_SOCIAL_LOGIN** enables OAuth-based social authentication in LibreChat, allowing users to log in with their Google, GitHub, Discord, or other OAuth provider accounts.

### What Users Get

When enabled, LibreChat users can:
- ✅ **One-click login** - Sign in with existing accounts
- ✅ **No password management** - No passwords to remember
- ✅ **Faster registration** - Quick account creation
- ✅ **Secure authentication** - OAuth 2.0 security
- ✅ **Multiple providers** - Google, GitHub, Discord, OpenID
- ✅ **Better UX** - Simplified login experience

---

## Quick Setup

**1. Enable Social Login**:
```bash
# In .env
ALLOW_SOCIAL_LOGIN=true
ALLOW_SOCIAL_REGISTRATION=true  # Allow new users via social login
```

**2. Configure Providers**:

**Choose which providers to enable** in `librechat.yaml`:
```yaml
registration:
  socialLogins: ['google', 'github', 'discord', 'openid']
```

**3. Set Up OAuth Credentials**:

Each provider requires OAuth app configuration. See sections below.

**4. Restart LibreChat**:
```bash
docker-compose -f docker-compose.windows.yml restart api
```

---

## Supported Providers

### 1. Google OAuth

**Setup**:
1. Go to: https://console.cloud.google.com/
2. Create new project or select existing
3. Go to **APIs & Services > Credentials**
4. Click **"+ Create Credentials" > "OAuth 2.0 Client ID"**
5. Configure consent screen if prompted
6. Application type: **Web application**
7. Authorized redirect URIs:
   ```
   http://localhost:3080/oauth/google/callback
   https://yourdomain.com/oauth/google/callback
   ```
8. Copy Client ID and Client Secret

**Configure**:
```bash
# In .env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3080/oauth/google/callback
```

**What users see**:
- "Sign in with Google" button on login page
- Google account picker
- Permission consent screen
- Automatic login after first consent

---

### 2. GitHub OAuth

**Setup**:
1. Go to: https://github.com/settings/developers
2. Click **"New OAuth App"**
3. Fill in:
   - Application name: `LibreChat`
   - Homepage URL: `http://localhost:3080`
   - Authorization callback URL: `http://localhost:3080/oauth/github/callback`
4. Click **"Register application"**
5. Click **"Generate a new client secret"**
6. Copy Client ID and Client Secret

**Configure**:
```bash
# In .env
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3080/oauth/github/callback
```

**What users see**:
- "Sign in with GitHub" button
- GitHub authorization page
- Automatic login

---

### 3. Discord OAuth

**Setup**:
1. Go to: https://discord.com/developers/applications
2. Click **"New Application"**
3. Enter name: `LibreChat`
4. Go to **OAuth2** tab
5. Add redirect URL: `http://localhost:3080/oauth/discord/callback`
6. Copy Client ID and Client Secret

**Configure**:
```bash
# In .env
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
DISCORD_CALLBACK_URL=http://localhost:3080/oauth/discord/callback
```

**What users see**:
- "Sign in with Discord" button
- Discord authorization
- Automatic login

---

### 4. OpenID Connect

**For generic OAuth2/OpenID providers**:
```bash
# In .env
OPENID_CLIENT_ID=your-openid-client-id
OPENID_CLIENT_SECRET=your-openid-client-secret
OPENID_ISSUER=https://your-provider.com
OPENID_CALLBACK_URL=http://localhost:3080/oauth/openid/callback

# Optional
OPENID_SCOPE=openid profile email
OPENID_BUTTON_LABEL="Sign in with SSO"
```

**Supported providers**:
- Keycloak
- Auth0
- Okta
- Azure AD
- Any OAuth2/OpenID Connect provider

---

## Configuration Reference

### Environment Variables

```bash
# Enable social login
ALLOW_SOCIAL_LOGIN=true
ALLOW_SOCIAL_REGISTRATION=true

# Session settings
SESSION_EXPIRY=900000  # 15 minutes
REFRESH_TOKEN_EXPIRY=604800000  # 7 days

# Domain settings (for production)
DOMAIN_CLIENT=https://yourdomain.com
DOMAIN_SERVER=https://yourdomain.com
```

### librechat.yaml

```yaml
registration:
  # Specify which social login providers to enable
  socialLogins: ['google', 'github', 'discord', 'openid']
  
  # Optional: Allow social registration
  # If false, users must be created manually first
  allowSocialRegistration: true
```

---

## What Users Experience

### Login Page

**With social login enabled**:
```
┌─────────────────────────────┐
│      Login to LibreChat     │
├─────────────────────────────┤
│                             │
│  Email: ___________________│
│  Password: ________________│
│                             │
│     [Sign In]               │
│                             │
│  ─────── Or ─────────      │
│                             │
│  [Sign in with Google]      │
│  [Sign in with GitHub]      │
│  [Sign in with Discord]     │
│                             │
│  Don't have account? Sign up│
└─────────────────────────────┘
```

### First-Time Social Login Flow

1. User clicks "Sign in with Google"
2. Redirected to Google
3. Selects Google account
4. Grants permissions
5. Redirected back to LibreChat
6. Account automatically created
7. Logged in immediately

### Subsequent Logins

1. User clicks "Sign in with Google"
2. Automatically logged in (if session exists)
3. Or quick authentication and redirect

---

## Security Considerations

### OAuth Security

**Best practices**:
- Use HTTPS in production
- Validate redirect URIs strictly
- Keep client secrets secure
- Implement CSRF protection (built-in)
- Use short session expiry

**Production requirements**:
```bash
# Must use HTTPS for OAuth callbacks
DOMAIN_CLIENT=https://yourdomain.com
DOMAIN_SERVER=https://yourdomain.com

# Update OAuth callback URLs to HTTPS
GOOGLE_CALLBACK_URL=https://yourdomain.com/oauth/google/callback
GITHUB_CALLBACK_URL=https://yourdomain.com/oauth/github/callback
```

### Account Linking

**If user exists with same email**:
- Social login links to existing account
- User can log in with email/password OR social
- No duplicate accounts created

**If email doesn't exist**:
- New account created (if ALLOW_SOCIAL_REGISTRATION=true)
- Or login denied (if ALLOW_SOCIAL_REGISTRATION=false)

---

## Disable Social Login (After Enabled)

**To disable**:
```bash
# In .env
ALLOW_SOCIAL_LOGIN=false
ALLOW_SOCIAL_REGISTRATION=false
```

**Effect**:
- Social login buttons hidden
- Existing social-linked accounts can still log in
- No new social registrations allowed

**To completely remove**:
- Set `ALLOW_SOCIAL_LOGIN=false`
- Remove provider credentials from .env
- Remove socialLogins from librechat.yaml
- Restart LibreChat

---

## Troubleshooting

### OAuth Errors

**"Redirect URI mismatch"**:
- Ensure callback URL in .env matches OAuth app config
- Check for http vs https
- Verify port number (3080)
- No trailing slash in URLs

**"Invalid client"**:
- Check CLIENT_ID is correct
- Verify CLIENT_SECRET has no spaces
- Ensure OAuth app is enabled
- Regenerate credentials if needed

**"Access denied"**:
- User cancelled authorization
- Check OAuth app has required permissions
- Verify app is not restricted

### Buttons Not Showing

**Social login buttons not visible**:
- Check `ALLOW_SOCIAL_LOGIN=true` in .env
- Verify provider in librechat.yaml socialLogins array
- Ensure provider credentials configured
- Restart LibreChat
- Check browser console for errors

### Account Issues

**Can't link social account**:
- Email already used by different account
- Social email not verified
- Provider not enabled

**Multiple accounts for same user**:
- Different email addresses used
- Manual account deletion required
- Consider account merging feature request

---

## Migration Guide

### Enabling Social Login on Existing Instance

**1. Backup database**:
```bash
docker exec chat-mongodb mongodump --out /backup
```

**2. Configure OAuth providers**:
- Set up Google/GitHub/Discord OAuth apps
- Add credentials to .env

**3. Enable feature**:
```bash
ALLOW_SOCIAL_LOGIN=true
ALLOW_SOCIAL_REGISTRATION=true
```

**4. Update librechat.yaml**:
```yaml
registration:
  socialLogins: ['google', 'github']
```

**5. Test**:
- Create test account
- Try social login
- Verify existing accounts still work

**6. Inform users**:
- Announce new login options
- Provide migration guide
- Offer support

---

## Related Documentation

- **Registration Settings**: See ALLOW_REGISTRATION in .env.example
- **Session Config**: See SESSION_EXPIRY in .env.example
- **Main Guide**: See [CLAUDE.md](../../../CLAUDE.md)
- **OAuth Providers**:
  - Google: https://console.cloud.google.com/
  - GitHub: https://github.com/settings/developers
  - Discord: https://discord.com/developers/applications

---

## FAQ

**Q: Can users use both email and social login?**
A: Yes, if emails match, both methods work for same account.

**Q: What if I want only social login (no email/password)?**
A: Set `ALLOW_EMAIL_LOGIN=false` in .env.

**Q: Can I force users to use only specific social providers?**
A: Yes, only configure those providers and set `ALLOW_EMAIL_LOGIN=false`.

**Q: Is social login more secure than email/password?**
A: Generally yes - OAuth providers handle authentication, often with 2FA.

**Q: Can I customize the social login button labels?**
A: For OpenID, yes (`OPENID_BUTTON_LABEL`). Others use default labels.

**Q: What data does LibreChat get from social providers?**
A: Typically: email, name, profile picture. No passwords stored.

---

*Document Version: 1.0.0 | LibreChat v0.8.1-rc1*
