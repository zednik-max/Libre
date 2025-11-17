# ASSISTANTS_API_KEY Configuration Guide

**Version**: v0.8.1-rc1
**Last Updated**: 2025-11-16

---

## What is ASSISTANTS_API_KEY?

**ASSISTANTS_API_KEY** is the configuration for LibreChat's **Assistants** endpoint, which uses OpenAI's [Assistants API](https://platform.openai.com/docs/assistants/overview). This is different from:
- **Regular chat** (uses `OPENAI_API_KEY`)
- **Agents** (LibreChat's custom agent framework)

### Assistants vs Agents

| Feature | OpenAI Assistants | LibreChat Agents |
|---------|------------------|------------------|
| **API Key** | ASSISTANTS_API_KEY | Varies by provider |
| **Provider** | OpenAI only | OpenAI, Anthropic, Google, Vertex AI, etc. |
| **Tools** | code_interpreter, file_search, function calling | execute_code (Judge0), web_search, file_search, MCP |
| **Framework** | OpenAI's Assistants API | LibreChat's custom framework |
| **Config** | .env ASSISTANTS_API_KEY | Agent configuration per agent |

---

## Configuration Options

### Option 1: User-Provided Keys (Default)

**When to use**: Each user provides their own OpenAI API key

**Configuration**:
```bash
# In .env file
ASSISTANTS_API_KEY=user_provided
```

**How it works**:
1. Users click on the **Assistants** endpoint in LibreChat
2. System prompts them to enter their OpenAI API key
3. Each user's key is stored in the database (encrypted)
4. Users pay for their own usage

**Pros**:
- ✅ No server cost for API calls
- ✅ Users control their own usage
- ✅ Each user can use different OpenAI accounts

**Cons**:
- ❌ Users must have OpenAI API accounts
- ❌ Less convenient (requires setup per user)

### Option 2: System-Wide API Key

**When to use**: Admin provides one API key for all users

**Configuration**:
```bash
# In .env file
ASSISTANTS_API_KEY=sk-proj-your-actual-openai-key-here
```

**How it works**:
1. Admin sets the API key in .env
2. All users share the same API key
3. Server pays for all API usage

**Pros**:
- ✅ Convenient for users (no setup required)
- ✅ Centralized billing and control

**Cons**:
- ❌ Server pays for all usage
- ❌ Potential for abuse if not rate-limited
- ❌ Single point of failure if key is revoked

### Option 3: Blank/Commented Out (Same as user_provided)

**Configuration**:
```bash
# In .env file
# ASSISTANTS_API_KEY=
```
or
```bash
ASSISTANTS_API_KEY=
```

**This behaves the same as Option 1** - users will be prompted to provide their own keys.

---

## How It Works Internally

### Code Flow

**Location**: `api/server/services/Endpoints/assistants/initalize.js`

```javascript
const initializeClient = async ({ req, res, endpointOption, version }) => {
  const { ASSISTANTS_API_KEY, ASSISTANTS_BASE_URL } = process.env;

  // Check if user should provide key
  const userProvidesKey = isUserProvided(ASSISTANTS_API_KEY);

  if (userProvidesKey) {
    // Fetch user's stored API key from database
    const userValues = await getUserKeyValues({
      userId: req.user.id,
      name: 'assistants'
    });
    apiKey = userValues.apiKey;
  } else {
    // Use system-wide key
    apiKey = ASSISTANTS_API_KEY;
  }

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey,
    defaultHeaders: {
      'OpenAI-Beta': `assistants=${version}`,
    },
  });

  return { openai, openAIApiKey: apiKey };
};
```

### User-Provided Key Detection

**Function**: `isUserProvided(value)`

**Location**: `api/server/utils/handleText.js`

```javascript
const isUserProvided = (value) => value === 'user_provided';
```

This checks if the environment variable is set to the literal string `"user_provided"`.

---

## Step-by-Step Setup

### Setup Option A: System-Wide API Key

**1. Get OpenAI API Key**:
- Go to https://platform.openai.com/api-keys
- Create a new API key
- Copy the key (starts with `sk-proj-...` or `sk-...`)

**2. Add to `.env` file**:
```bash
#====================#
#   Assistants API   #
#====================#

# System-wide OpenAI API key for Assistants
ASSISTANTS_API_KEY=sk-proj-your-actual-openai-key

# Optional: Specify which models to show
ASSISTANTS_MODELS=gpt-4o,gpt-4o-mini,gpt-4-turbo-preview

# Optional: Use custom OpenAI-compatible endpoint
# ASSISTANTS_BASE_URL=https://api.openai.com/v1
```

**3. Restart LibreChat**:
```bash
docker-compose -f docker-compose.windows.yml restart api
```

**4. Test**:
- Open LibreChat: http://localhost:3080
- Click endpoint dropdown
- Select **"Assistants"**
- Should work immediately (no key prompt)

### Setup Option B: User-Provided Keys

**1. Configure `.env` file**:
```bash
ASSISTANTS_API_KEY=user_provided
```

**2. Restart LibreChat**:
```bash
docker-compose -f docker-compose.windows.yml restart api
```

**3. User Setup** (each user must do this):
- Open LibreChat: http://localhost:3080
- Click endpoint dropdown
- Select **"Assistants"**
- When prompted, enter personal OpenAI API key
- Key is saved to database (encrypted)

---

## Additional Configuration (Optional)

### Enable Assistants Endpoint in librechat.yaml

Add to `/home/user/Libre/librechat.yaml`:

```yaml
endpoints:
  assistants:
    # Disable the assistant builder UI (false = enabled, true = disabled)
    disableBuilder: false

    # Polling interval for checking assistant updates (milliseconds)
    pollIntervalMs: 3000

    # Timeout for assistant operations (milliseconds)
    timeoutMs: 180000

    # Only show specific assistants by ID (optional)
    # supportedIds: ["asst_abc123", "asst_xyz789"]

    # Exclude specific assistants (optional, don't use with supportedIds)
    # excludedIds: ["asst_unwanted123"]

    # Only show user-created assistants (optional)
    # privateAssistants: false

    # Models that support retrieval/file search
    retrievalModels: ["gpt-4o", "gpt-4-turbo-preview"]

    # Available capabilities
    capabilities: ["code_interpreter", "retrieval", "actions", "tools", "image_vision"]
```

### Available Configuration Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `disableBuilder` | boolean | Disable assistant builder UI | `false` |
| `pollIntervalMs` | number | Polling interval for updates (ms) | `3000` |
| `timeoutMs` | number | Operation timeout (ms) | `180000` |
| `supportedIds` | string[] | Whitelist specific assistant IDs | All |
| `excludedIds` | string[] | Blacklist specific assistant IDs | None |
| `privateAssistants` | boolean | Only show user-created assistants | `false` |
| `retrievalModels` | string[] | Models supporting file search | Latest GPT-4 models |
| `capabilities` | string[] | Available assistant capabilities | All |

### Environment Variables Reference

```bash
# Required (choose one approach)
ASSISTANTS_API_KEY=user_provided           # User-provided keys
ASSISTANTS_API_KEY=sk-proj-your-key       # System-wide key

# Optional
ASSISTANTS_BASE_URL=https://api.openai.com/v1  # Custom endpoint
ASSISTANTS_MODELS=gpt-4o,gpt-4o-mini           # Specific models

# OpenAI Organization (optional)
OPENAI_ORGANIZATION=org-your-org-id
```

---

## Testing Your Setup

### 1. Check Environment Variable

```powershell
# Check if container has the variable
docker exec -it LibreChat sh -c "printenv | grep ASSISTANTS_API_KEY"
```

**Expected output**:
- System-wide: `ASSISTANTS_API_KEY=sk-proj-...`
- User-provided: `ASSISTANTS_API_KEY=user_provided`

### 2. Check Logs

```powershell
docker-compose -f docker-compose.windows.yml logs -f api | Select-String "Assistant"
```

**Look for**:
- `[Assistants] Endpoint initialized`
- No errors about missing API keys

### 3. Test in UI

**System-wide setup**:
1. Open http://localhost:3080
2. Click endpoint dropdown
3. Select **"Assistants"**
4. Should work immediately ✅

**User-provided setup**:
1. Open http://localhost:3080
2. Click endpoint dropdown
3. Select **"Assistants"**
4. See API key prompt ✅
5. Enter OpenAI API key
6. Key is saved, endpoint works ✅

---

## Troubleshooting

### Problem: "Assistants endpoint not showing"

**Possible causes**:
1. ASSISTANTS_API_KEY not set in .env
2. LibreChat needs restart
3. Configuration error in librechat.yaml

**Solutions**:
```bash
# 1. Check .env file
cat .env | grep ASSISTANTS_API_KEY

# 2. Restart LibreChat
docker-compose -f docker-compose.windows.yml restart api

# 3. Check logs
docker logs LibreChat | grep -i assistant

# 4. Verify librechat.yaml syntax
docker exec -it LibreChat sh -c "cat librechat.yaml"
```

### Problem: "API key invalid" error

**Possible causes**:
1. Wrong API key format
2. API key revoked/expired
3. OpenAI account has no credits

**Solutions**:
```bash
# 1. Verify key format
# Valid: sk-proj-... or sk-...
# Invalid: Any other format

# 2. Test key directly
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer sk-proj-your-key"

# 3. Check OpenAI account
# Visit: https://platform.openai.com/account/billing
```

### Problem: "No assistants found"

**Cause**: No assistants created yet

**Solution**:

**Option A: Create via OpenAI Platform**:
1. Go to https://platform.openai.com/assistants
2. Click **"Create"**
3. Configure assistant (name, instructions, tools)
4. Save
5. Refresh LibreChat

**Option B: Create via LibreChat**:
1. Select **"Assistants"** endpoint
2. Open side panel
3. Click **"+ Create Assistant"**
4. Configure and save

### Problem: User sees key prompt every time (user_provided mode)

**Cause**: User hasn't saved their API key

**Solution**:
1. When prompted, enter API key
2. **Check** "Remember this key" or "Save"
3. Click "Submit"
4. Key is stored in database (encrypted)
5. Won't be prompted again

### Problem: User's saved key not working

**Cause**: Key expired or was revoked

**Solutions**:
```bash
# Check user's stored keys in database
docker exec -it chat-mongodb mongosh LibreChat --eval "
  db.users.findOne(
    { email: 'user@example.com' },
    { 'plugins.assistants': 1 }
  )
"

# User can update key via UI:
# 1. Click user menu
# 2. Settings
# 3. API Keys
# 4. Update Assistants API Key
```

---

## Security Considerations

### API Key Storage

**System-wide keys**:
- Stored in `.env` file (plaintext)
- ⚠️ Never commit `.env` to git
- ⚠️ Restrict file permissions: `chmod 600 .env`

**User-provided keys**:
- Stored in MongoDB (encrypted)
- Encryption key: `JWT_SECRET` from `.env`
- 🔒 Keep `JWT_SECRET` secure

### Rate Limiting

**Recommendations**:
```yaml
# In librechat.yaml
rateLimits:
  assistants:
    # Max requests per window
    max: 100
    # Time window in milliseconds (15 minutes)
    windowMs: 900000
    # Message shown when rate limit hit
    message: "Too many requests, please try again later."
```

### Cost Control

**System-wide setup**:
- Set usage limits on OpenAI account
- Monitor costs: https://platform.openai.com/usage
- Consider rate limiting per user

**User-provided setup**:
- Users control their own costs
- Users responsible for their API usage
- Server has no API cost burden

---

## Comparison Table

### System-Wide vs User-Provided

| Aspect | System-Wide | User-Provided |
|--------|-------------|---------------|
| **Setup Complexity** | Simple (one-time) | Complex (per-user) |
| **User Experience** | Excellent (no setup) | Fair (requires API key) |
| **Cost** | Server pays | Users pay |
| **Cost Control** | Centralized | Distributed |
| **Security Risk** | High (single key exposed) | Low (keys distributed) |
| **Billing** | Admin account | Individual accounts |
| **Recommended For** | Private/team instances | Public/multi-tenant |
| **Rate Limiting** | Required | Optional |

---

## Related Documentation

- **Agents**: See [AGENTS.md](../../../AGENTS.md) for LibreChat's agent framework (different from Assistants)
- **Agent Customization**: See [AGENTS_CUSTOMIZATIONS.md](../../../AGENTS_CUSTOMIZATIONS.md)
- **Main Guide**: See [CLAUDE.md](../../../CLAUDE.md)
- **Official Docs**: https://www.librechat.ai/docs/configuration/pre_configured_ai/assistants
- **OpenAI Assistants Docs**: https://platform.openai.com/docs/assistants/overview

---

## Quick Reference

### Configuration Examples

**System-wide (simple)**:
```bash
# .env
ASSISTANTS_API_KEY=sk-proj-your-key
ASSISTANTS_MODELS=gpt-4o,gpt-4o-mini
```

**User-provided (secure)**:
```bash
# .env
ASSISTANTS_API_KEY=user_provided
```

**With librechat.yaml**:
```yaml
# librechat.yaml
endpoints:
  assistants:
    disableBuilder: false
    pollIntervalMs: 3000
    timeoutMs: 180000
    retrievalModels: ["gpt-4o"]
    capabilities: ["code_interpreter", "retrieval", "tools"]
```

### Testing Commands

```bash
# Check environment variable
docker exec -it LibreChat printenv | grep ASSISTANTS_API_KEY

# Check logs
docker logs LibreChat | grep -i assistant

# Restart service
docker-compose -f docker-compose.windows.yml restart api

# Test OpenAI API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_KEY"
```

---

## FAQ

**Q: What's the difference between OPENAI_API_KEY and ASSISTANTS_API_KEY?**

A:
- `OPENAI_API_KEY` → Regular chat endpoint (ChatGPT-style)
- `ASSISTANTS_API_KEY` → OpenAI Assistants API (stateful assistants with tools)

They can be the same key or different keys from the same OpenAI account.

**Q: Can I use Azure OpenAI for Assistants?**

A: Yes! See [Azure Assistants configuration](https://www.librechat.ai/docs/configuration/librechat_yaml/ai_endpoints/azure#using-assistants-with-azure).

**Q: Do I need ASSISTANTS_API_KEY for LibreChat Agents?**

A: No! LibreChat Agents use their own provider-specific API keys (OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.). ASSISTANTS_API_KEY is only for the OpenAI Assistants API endpoint.

**Q: Can users have different assistants?**

A: Yes, with `privateAssistants: true` in librechat.yaml. Each user only sees assistants they created.

**Q: How do I migrate from system-wide to user-provided?**

A:
```bash
# 1. Change .env
ASSISTANTS_API_KEY=user_provided

# 2. Restart
docker-compose restart api

# 3. Notify users to add their keys via UI
```

---

*Document Version: 1.0.0 | LibreChat v0.8.1-rc1*
