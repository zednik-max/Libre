# Google Search API Configuration Guide

**Version**: v0.8.1-rc1
**Last Updated**: 2025-11-16

---

## What are GOOGLE_SEARCH_API_KEY and GOOGLE_CSE_ID?

**GOOGLE_SEARCH_API_KEY** and **GOOGLE_CSE_ID** are configuration variables for LibreChat's **Google Search** tool, which allows AI models to search the web using Google's Custom Search Engine API.

### Key Differences from Other Search Tools

LibreChat offers multiple search capabilities:

| Feature | Google Search Tool | Web Search (Serper) | Perplexity AI |
|---------|---------------------|---------------------|---------------|
| **Service** | Google Custom Search Engine | Serper API | Perplexity Sonar |
| **API Keys** | GOOGLE_SEARCH_API_KEY + GOOGLE_CSE_ID | SERPER_API_KEY | PERPLEXITY_API_KEY |
| **Usage** | Agent/Assistant tool | Agent web_search tool | Perplexity endpoint |
| **Free Tier** | 100 queries/day | 2,500 queries/month | Limited |
| **Setup Complexity** | High (2 steps) | Low (1 key) | Low (1 key) |
| **Customization** | High (custom search engine) | Low | None |
| **Best For** | Custom search scopes, specific sites | General agent searches | Reasoning with search |

**Recommendation**: For new setups, use **Serper API** (simpler, works with Agents) or **Perplexity AI** (advanced reasoning with search). Google Search requires more setup but offers high customization.

---

## What You Need

### 1. Google Cloud Project
- Free tier available
- Requires Google account
- Credit card required for verification (not charged for free tier)

### 2. Custom Search Engine ID (GOOGLE_CSE_ID)
- Configure what to search (entire web or specific sites)
- Free to create
- Customizable search scope

### 3. Custom Search API Key (GOOGLE_SEARCH_API_KEY)
- Free tier: 100 queries/day
- Paid tier: $5 per 1,000 queries (above 100/day)
- Requires Google Cloud Console

---

## Step-by-Step Setup

### Step 1: Create a Google Cloud Project

**1. Go to Google Cloud Console**:
- Visit: https://console.cloud.google.com/

**2. Create a new project**:
- Click the project dropdown (top bar)
- Click **"New Project"**
- Enter project name: `LibreChat` (or any name)
- Click **"Create"**

**3. Enable Custom Search API**:
- In the Google Cloud Console, search for **"Custom Search API"** in the search bar
- Click **"Custom Search API"**
- Click **"Enable"**
- Wait for API to be enabled

### Step 2: Get Your API Key (GOOGLE_SEARCH_API_KEY)

**1. Create credentials**:
- In Google Cloud Console, go to **APIs & Services > Credentials**
- URL: https://console.cloud.google.com/apis/credentials
- Click **"+ Create Credentials"** at the top
- Select **"API Key"**

**2. Copy your API key**:
- A popup will show your new API key
- Click **"Copy"** to copy the key
- Format: `AIzaSy...` (39 characters)
- **Save this key securely**

**3. Restrict the key (recommended)**:
- Click **"Edit API key"** (pencil icon)
- Under **"API restrictions"**:
  - Select **"Restrict key"**
  - Find and check **"Custom Search API"**
- Click **"Save"**

### Step 3: Create Custom Search Engine (GOOGLE_CSE_ID)

**1. Go to Programmable Search Engine**:
- Visit: https://programmablesearchengine.google.com/
- Sign in with your Google account

**2. Create a new search engine**:
- Click **"Add"** or **"Create a new search engine"**
- Enter a name: `LibreChat Search` (or any name)

**3. Configure search scope**:

**Option A: Search the entire web** (recommended):
- Under **"Sites to search"**, enter: `www.google.com`
- Click **"Create"**
- After creation, click **"Control Panel"**
- Under **"Basics"**, toggle **"Search the entire web"** to **ON**
- Remove `www.google.com` from sites list

**Option B: Search specific sites only**:
- Under **"Sites to search"**, enter domains you want to search:
  ```
  wikipedia.org
  github.com
  stackoverflow.com
  ```
- Click **"Create"**

**4. Enable Image Search** (optional):
- In Control Panel, go to **"Look and feel"** tab
- Toggle **"Image search"** to **ON**
- Click **"Save"**

**5. Get your Search Engine ID**:
- In Control Panel, go to **"Overview"** or **"Basics"** tab
- Find **"Search engine ID"** (under "Basic" section)
- Copy the ID (format: `abc123def456...`)
- **Save this ID securely**

### Step 4: Configure LibreChat

**1. Add to `.env` file**:
```bash
#-----------------
# Google Search
#-----------------

# Your Google Custom Search API Key (from Google Cloud Console)
GOOGLE_SEARCH_API_KEY=AIzaSyYourApiKeyHere

# Your Custom Search Engine ID (from Programmable Search Engine)
GOOGLE_CSE_ID=your-cse-id-here
```

**2. Restart LibreChat**:
```bash
docker-compose -f docker-compose.windows.yml restart api
```

### Step 5: Enable the Plugin in LibreChat

**1. Open LibreChat**:
- Go to http://localhost:3080

**2. Enable in Agent or Assistant**:

**For Agents** (Recommended):
- Create or edit an Agent
- In Agent settings, add "Google Search" tool
- Save agent

**For Assistants**:
- Create or edit an Assistant
- In tools section, enable "Google Search"
- Save assistant

**3. Test the tool**:
- Start a new conversation with the Agent/Assistant
- Ask: "Search for the latest news about AI"
- The model should use the Google Search tool and return results

---

## Configuration Reference

### Environment Variables

```bash
# Required
GOOGLE_SEARCH_API_KEY=AIzaSy...          # Your Google API key (39 chars)
GOOGLE_CSE_ID=abc123def456...             # Your Custom Search Engine ID

# Optional - Enable debug logging
# DEBUG_GOOGLE_SEARCH=true
```

### How It Works Internally

**Location**: `api/app/clients/tools/structured/GoogleSearch.js`

```javascript
class GoogleSearchResults extends Tool {
  constructor(fields = {}) {
    this.apiKey = fields['GOOGLE_SEARCH_API_KEY']
      ?? process.env.GOOGLE_SEARCH_API_KEY;

    this.searchEngineId = fields['GOOGLE_CSE_ID']
      ?? process.env.GOOGLE_CSE_ID;

    if (!this.apiKey || !this.searchEngineId) {
      throw new Error('Missing GOOGLE_SEARCH_API_KEY or GOOGLE_CSE_ID');
    }
  }

  async _call(input) {
    const { query, max_results = 5 } = input;

    // Make request to Google Custom Search API
    const url = `https://www.googleapis.com/customsearch/v1`
      + `?key=${this.apiKey}`
      + `&cx=${this.searchEngineId}`
      + `&q=${encodeURIComponent(query)}`
      + `&num=${max_results}`;

    const response = await fetch(url);
    const json = await response.json();

    return JSON.stringify(json);
  }
}
```

**API Endpoint**: `https://www.googleapis.com/customsearch/v1`

**Query Parameters**:
- `key` - Your GOOGLE_SEARCH_API_KEY
- `cx` - Your GOOGLE_CSE_ID
- `q` - Search query
- `num` - Number of results (1-10, default: 5)

---

## Usage Limits and Pricing

### Free Tier

**Limits**:
- **100 queries per day**
- Resets daily at midnight Pacific Time
- No credit card charged
- Requires Google Cloud account

**Sufficient for**:
- Personal use
- Small teams
- Testing and development

### Paid Tier

**Pricing**:
- **$5 per 1,000 queries** (above the 100/day free tier)
- Billed monthly
- No minimum commitment

**Example costs**:
```
100 queries/day (free tier)           = $0/month
200 queries/day (100 free + 100 paid) = $15/month
500 queries/day                        = $60/month
1,000 queries/day                      = $135/month
```

**To enable billing**:
1. Go to Google Cloud Console
2. Navigate to **Billing**
3. Set up billing account
4. Queries above 100/day will be charged automatically

### Monitoring Usage

**Check quota usage**:
1. Go to Google Cloud Console
2. Navigate to **APIs & Services > Dashboard**
3. Click **"Custom Search API"**
4. View **"Metrics"** tab
5. See daily query count and quota usage

**Set up alerts** (optional):
1. In Google Cloud Console, go to **Billing > Budgets & Alerts**
2. Click **"Create Budget"**
3. Set budget amount (e.g., $10/month)
4. Set alert thresholds (e.g., 50%, 90%, 100%)
5. Enter email for notifications

---

## Customization Options

### Custom Search Scope

**Search specific websites only**:
```
# In Programmable Search Engine Control Panel:
Sites to search:
  - stackoverflow.com
  - github.com
  - docs.python.org
```

**Use case**: Create a coding assistant that only searches programming resources.

### SafeSearch

**Enable SafeSearch**:
1. Go to Programmable Search Engine Control Panel
2. Click **"Basics"** tab
3. Under **"SafeSearch"**, select level:
   - **Moderate** (default)
   - **Strict**
   - **Off**

### Language and Region

**Restrict by language**:
1. In Control Panel, go to **"Advanced"** tab
2. Under **"Language"**, select preferred language
3. Click **"Save"**

**Restrict by region**:
1. In Control Panel, go to **"Advanced"** tab
2. Under **"Region"**, select target country
3. Click **"Save"**

### Image Search

**Enable image search results**:
1. In Control Panel, go to **"Look and feel"** tab
2. Toggle **"Image search"** to **ON**
3. Click **"Save"**

---

## Testing Your Setup

### 1. Test API Key Directly

```bash
# Replace with your actual values
API_KEY="AIzaSy..."
CSE_ID="abc123..."
QUERY="LibreChat AI"

# Test query
curl "https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CSE_ID}&q=${QUERY}"
```

**Expected response**:
```json
{
  "kind": "customsearch#search",
  "url": {...},
  "queries": {...},
  "items": [
    {
      "title": "Result title",
      "link": "https://...",
      "snippet": "Result snippet..."
    }
  ]
}
```

**If you get an error**:
- `"error": { "code": 400, "message": "Invalid Value" }` → Check CSE_ID format
- `"error": { "code": 403, "message": "The API key is invalid" }` → Check API_KEY
- `"error": { "code": 403, "message": "Daily Limit Exceeded" }` → Exceeded 100 queries/day

### 2. Test in LibreChat UI

**Enable debug mode** (optional):
```bash
# Add to .env
DEBUG_PLUGINS=true
```

**Restart LibreChat**:
```bash
docker-compose -f docker-compose.windows.yml restart api
```

**Test query**:
1. Open LibreChat
2. Select ChatGPT endpoint
3. Enable Google plugin
4. Ask: "What's the weather in Tokyo today?"
5. Check if plugin is invoked

**Check logs**:
```bash
docker logs LibreChat | grep -i google
```

**Expected output**:
```
[Google Search] Query: weather Tokyo
[Google Search] Results: 5 items returned
```

### 3. Verify Environment Variables

```bash
# Check if LibreChat container has the variables
docker exec -it LibreChat sh -c "printenv | grep GOOGLE"
```

**Expected output**:
```
GOOGLE_SEARCH_API_KEY=AIzaSy...
GOOGLE_CSE_ID=abc123...
```

---

## Troubleshooting

### Problem: "Missing GOOGLE_SEARCH_API_KEY or GOOGLE_CSE_ID"

**Symptoms**:
- Plugin shows error in UI
- Cannot enable Google Search plugin

**Solutions**:
```bash
# 1. Check .env file
cat .env | grep GOOGLE

# 2. Ensure both variables are set (no comments)
GOOGLE_SEARCH_API_KEY=AIzaSy...
GOOGLE_CSE_ID=abc123...

# 3. Restart LibreChat
docker-compose -f docker-compose.windows.yml restart api

# 4. Verify variables in container
docker exec -it LibreChat printenv | grep GOOGLE
```

### Problem: "API Key Invalid" (403 Error)

**Possible causes**:
1. Wrong API key
2. API key restricted to wrong API
3. Custom Search API not enabled

**Solutions**:

**Test key directly**:
```bash
curl "https://www.googleapis.com/customsearch/v1?key=YOUR_KEY&cx=YOUR_CSE_ID&q=test"
```

**Check API restriction**:
1. Go to Google Cloud Console > Credentials
2. Click your API key
3. Under **"API restrictions"**, ensure **"Custom Search API"** is allowed

**Enable Custom Search API**:
1. Go to Google Cloud Console
2. Search for "Custom Search API"
3. Click **"Enable"**

### Problem: "Invalid Value" (400 Error)

**Cause**: Wrong CSE_ID format

**Solution**:
1. Go to https://programmablesearchengine.google.com/
2. Click your search engine
3. Go to **"Overview"** or **"Basics"**
4. Copy the exact **"Search engine ID"**
5. Update GOOGLE_CSE_ID in .env
6. Restart LibreChat

### Problem: "Daily Limit Exceeded" (429 Error)

**Cause**: Exceeded 100 queries/day free tier

**Solutions**:

**Option A: Wait until reset**:
- Free tier resets daily at midnight Pacific Time
- Quota will refresh automatically

**Option B: Enable billing**:
1. Go to Google Cloud Console > Billing
2. Set up billing account
3. Queries above 100/day will be charged at $5/1000 queries

**Option C: Use alternative**:
- Switch to Serper API (2,500 free queries/month)
- Use Perplexity AI (built-in search)

### Problem: Plugin Not Showing in UI

**Possible causes**:
1. Wrong endpoint selected
2. Model doesn't support plugins
3. Plugin store not enabled

**Solutions**:

**Check endpoint**:
- Plugins work with: ChatGPT, Azure OpenAI, some custom endpoints
- Plugins don't work with: Anthropic, Google, Agents

**Check model**:
- Supported: gpt-4, gpt-4o, gpt-3.5-turbo, gpt-4-turbo
- Not supported: claude-*, gemini-*, other providers

**Check configuration**:
```bash
# In .env, ensure plugin models are set (or commented out for all models)
PLUGIN_MODELS=gpt-4o,gpt-4o-mini,gpt-4,gpt-3.5-turbo
```

### Problem: Search Returns No Results

**Possible causes**:
1. Search engine configured incorrectly
2. Search scope too narrow
3. Query too specific

**Solutions**:

**Check search scope**:
1. Go to Programmable Search Engine Control Panel
2. Ensure **"Search the entire web"** is ON
3. Or expand the list of sites to search

**Test with simple query**:
```bash
curl "https://www.googleapis.com/customsearch/v1?key=YOUR_KEY&cx=YOUR_CSE_ID&q=test"
```

**Check CSE settings**:
- Ensure CSE is not in "sandbox mode"
- Verify SafeSearch settings aren't too strict

---

## Migration Guide

### From Google Search to Serper API

**Why migrate**:
- ✅ Simpler setup (1 key vs 2)
- ✅ Higher free tier (2,500 vs 100 queries/month)
- ✅ Better for agents (native web_search tool)
- ✅ No Google Cloud account needed

**Migration steps**:

**1. Get Serper API key**:
- Go to https://serper.dev/
- Sign up (free tier available)
- Get API key from dashboard

**2. Update .env**:
```bash
# Add Serper key
SERPER_API_KEY=your-serper-key

# Optional: Keep Google Search for legacy plugin support
# GOOGLE_SEARCH_API_KEY=...
# GOOGLE_CSE_ID=...
```

**3. Configure librechat.yaml**:
```yaml
webSearch:
  serperApiKey: '${SERPER_API_KEY}'
  searchProvider: 'serper'
```

**4. Use with agents**:
- Create agent with `web_search` tool enabled
- Agents will use Serper instead of Google Search plugin

### From Google Search to Perplexity AI

**Why migrate**:
- ✅ Search + reasoning in one
- ✅ No separate plugin needed
- ✅ Better answer quality
- ✅ Citation support

**Migration steps**:

**1. Get Perplexity API key**:
- Go to https://www.perplexity.ai/settings/api
- Sign up for API access
- Get API key

**2. Update .env**:
```bash
# Add Perplexity key
PERPLEXITY_API_KEY=your-perplexity-key
```

**3. Configure librechat.yaml**:
```yaml
endpoints:
  custom:
    - name: 'Perplexity'
      apiKey: '${PERPLEXITY_API_KEY}'
      baseURL: 'https://api.perplexity.ai'
      models:
        default:
          - 'sonar'
          - 'sonar-pro'
```

**4. Use Perplexity endpoint**:
- Select "Perplexity" from endpoint dropdown
- Models automatically search when needed
- No plugin configuration required

---

## Security Considerations

### API Key Protection

**Best practices**:
```bash
# 1. Never commit .env to git
echo ".env" >> .gitignore

# 2. Restrict file permissions
chmod 600 .env

# 3. Use environment-specific files
.env.production
.env.development
```

### API Key Restrictions

**Recommended restrictions** (Google Cloud Console):
1. **API restrictions**: Restrict to "Custom Search API" only
2. **Application restrictions**: Set to "IP addresses" (your server IP)
3. **Referrer restrictions**: Not applicable for server-side

### Rate Limiting

**Prevent abuse**:
```yaml
# In librechat.yaml
rateLimits:
  plugins:
    google:
      max: 50              # Max 50 requests
      windowMs: 900000     # Per 15 minutes
```

### Cost Controls

**Set budget alerts**:
1. Google Cloud Console > Billing > Budgets
2. Create budget (e.g., $10/month)
3. Set alerts at 50%, 90%, 100%
4. Receive email notifications

**Monitor usage**:
```bash
# Check daily usage in Google Cloud Console
# APIs & Services > Dashboard > Custom Search API > Metrics
```

---

## Comparison with Alternatives

### Google Search vs Serper vs Perplexity

| Feature | Google Search | Serper API | Perplexity AI |
|---------|---------------|------------|---------------|
| **Setup** | Complex (2 steps) | Simple (1 key) | Simple (1 key) |
| **Free Tier** | 100/day | 2,500/month | Limited |
| **Paid Pricing** | $5/1000 queries | $50/10k searches | Custom |
| **Customization** | High (CSE) | Medium | None |
| **Integration** | Plugin (legacy) | Agent tool | Endpoint |
| **Quality** | Good | Good | Excellent |
| **Speed** | Fast | Very fast | Fast |
| **Citations** | No | No | Yes |
| **Best For** | Custom scopes | Agent searches | Reasoning + search |

### Recommendation Matrix

**Use Google Search Plugin if**:
- ✅ Need custom search scope (specific sites)
- ✅ Already using Google Cloud
- ✅ Want highly customizable search
- ✅ Using Plugins system (legacy)

**Use Serper API if**:
- ✅ Building agents with web search
- ✅ Want simple setup
- ✅ Need higher free tier
- ✅ Want modern agent tools

**Use Perplexity AI if**:
- ✅ Want search + reasoning
- ✅ Need citations in answers
- ✅ Want highest quality results
- ✅ Don't need custom scopes

---

## Related Documentation

- **Web Search (Serper)**: See librechat.yaml webSearch configuration
- **Perplexity AI**: See [librechat.yaml Perplexity endpoint](../../../librechat.yaml)
- **Agents**: See [AGENTS.md](../../../AGENTS.md)
- **Main Guide**: See [CLAUDE.md](../../../CLAUDE.md)
- **Official Docs**: https://www.librechat.ai/docs/features/plugins
- **Google CSE Docs**: https://developers.google.com/custom-search/v1/overview

---

## Quick Reference

### Setup Checklist

- [ ] Create Google Cloud project
- [ ] Enable Custom Search API
- [ ] Create API key (GOOGLE_SEARCH_API_KEY)
- [ ] Restrict API key to Custom Search API
- [ ] Create Programmable Search Engine
- [ ] Get Search Engine ID (GOOGLE_CSE_ID)
- [ ] Configure "Search the entire web"
- [ ] Add both keys to .env
- [ ] Restart LibreChat
- [ ] Enable plugin in UI
- [ ] Test with simple query

### Testing Commands

```bash
# Test API key directly
curl "https://www.googleapis.com/customsearch/v1?key=AIzaSy...&cx=abc123...&q=test"

# Check environment variables
docker exec -it LibreChat printenv | grep GOOGLE

# View logs
docker logs LibreChat | grep -i google

# Restart service
docker-compose -f docker-compose.windows.yml restart api
```

### Useful Links

- **Get API Key**: https://console.cloud.google.com/apis/credentials
- **Create CSE**: https://programmablesearchengine.google.com/
- **Monitor Usage**: https://console.cloud.google.com/apis/dashboard
- **Billing**: https://console.cloud.google.com/billing
- **API Docs**: https://developers.google.com/custom-search/v1/reference/rest/v1/cse/list

---

## FAQ

**Q: Do I need both GOOGLE_SEARCH_API_KEY and GOOGLE_CSE_ID?**

A: Yes, both are required. The API key authenticates with Google, and the CSE ID specifies which search engine to use.

**Q: Can I use the same API key for multiple search engines?**

A: Yes! You can create multiple CSEs with different configurations and use the same API key for all of them.

**Q: What's the difference between Google Search Plugin and Agents web_search?**

A:
- **Google Search Plugin**: Legacy plugin system, uses Google CSE API, requires both keys
- **Agents web_search**: Modern agent tool, uses Serper API, requires only SERPER_API_KEY

**Q: Is there a way to increase the free tier limit?**

A: No, Google's free tier is fixed at 100 queries/day. To get more, you need to enable billing.

**Q: Can I search only specific websites?**

A: Yes! In Programmable Search Engine Control Panel:
1. Disable "Search the entire web"
2. Add specific domains to "Sites to search"

**Q: How do I know if I'm close to the daily limit?**

A: Check in Google Cloud Console > APIs & Services > Dashboard > Custom Search API > Metrics

**Q: Can I use this with Azure OpenAI?**

A: Yes! The Google Search plugin works with any endpoint that supports plugins (ChatGPT, Azure OpenAI, etc.)

---

*Document Version: 1.0.0 | LibreChat v0.8.1-rc1*
