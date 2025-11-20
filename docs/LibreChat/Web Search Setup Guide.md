# Web Search Tool Setup Guide

**Issue**: Models don't see the Web Search tool
**Status**: Configuration incomplete - API keys missing ❌

---

## 🔍 Problem Diagnosis

Your `librechat.yaml` has web search configured, but the required API keys are **not set** in `.env`:

```yaml
# librechat.yaml (lines 189-204)
webSearch:
  serperApiKey: '${SERPER_API_KEY}'    # ❌ Not in .env
  searchProvider: 'serper'

  jinaApiKey: '${JINA_API_KEY}'        # ❌ Not in .env
  rerankerType: 'jina'
```

**Root cause**: Missing environment variables → Web Search tool disabled

---

## ✅ Solution: Add API Keys

You need **two API keys** for web search:

### 1. Serper API Key (Required)
- **What**: Google Search API wrapper
- **Why**: Performs actual web searches
- **Cost**: **FREE tier available** (2,500 searches/month)
- **Where**: https://serper.dev

### 2. Jina AI API Key (Optional but Recommended)
- **What**: Result reranker for better relevance
- **Why**: Improves search result quality
- **Cost**: **FREE tier available** (1 million tokens/month)
- **Where**: https://jina.ai

---

## 🚀 Setup Instructions

### Step 1: Get Serper API Key (Required)

1. **Sign up**: Go to https://serper.dev
2. **Create account**: Use Google/GitHub or email
3. **Get API key**: Dashboard → Copy your API key
4. **Free tier**: 2,500 searches/month (sufficient for most users)

**Pricing** (if you exceed free tier):
- $5/month = 5,000 searches
- $50/month = 50,000 searches

### Step 2: Get Jina AI API Key (Recommended)

1. **Sign up**: Go to https://jina.ai
2. **Create account**
3. **Get API key**: Dashboard → API Keys → Create key
4. **Free tier**: 1 million tokens/month

**Note**: Jina is optional - web search works without it, but with lower quality results.

### Step 3: Add Keys to .env

**Open `D:\java\LibreChat\.env`** and add these lines:

```bash
# Web Search Configuration
SERPER_API_KEY=your_serper_api_key_here
JINA_API_KEY=your_jina_api_key_here
```

**Example .env section:**
```bash
# LibreChat Environment Configuration

# Server Configuration
HOST=0.0.0.0
PORT=3080
MONGO_URI=mongodb://mongodb:27017/LibreChat
REDIS_URI=redis://redis:6379

# Web Search Configuration
SERPER_API_KEY=abc123xyz456def789ghi012jkl345  # Your actual key
JINA_API_KEY=jina_1234567890abcdefghijklmnop  # Your actual key

# Domain Configuration
DOMAIN_CLIENT=http://localhost:3080
DOMAIN_SERVER=http://localhost:3080
```

### Step 4: Restart LibreChat

```powershell
# Restart container to load new env vars
docker restart LibreChat

# Or full rebuild if needed
docker compose -f docker-compose.windows.yml down
docker compose -f docker-compose.windows.yml up -d
```

---

## 🧪 Test Web Search

### Option 1: Using Agents

1. **Create an agent**: Click "New Agent" in LibreChat
2. **Enable tools**: In agent configuration, select "Web Search"
3. **Chat with agent**: Ask something like:
   - "Search for the latest news about AI"
   - "What's the current weather in Bratislava?"
   - "Find recent research papers on LLMs"
4. ✅ Agent should use web search and return results

### Option 2: Using Tool Calling Models

Some models support tool calling directly (Anthropic, OpenAI):

1. **Start chat** with Claude or GPT-4
2. **Ask search query**: "Search the web for..."
3. ✅ Model should invoke web_search tool

---

## 🔧 Troubleshooting

### Issue: Tool still not appearing

**Check logs:**
```powershell
docker logs LibreChat | findstr -i "search\|serper\|jina"
```

**Look for:**
- ❌ "SERPER_API_KEY not set" → Add key to .env
- ❌ "Invalid API key" → Check key is correct
- ✅ "Web search initialized" → Working correctly

### Issue: "web_search capability disabled" warning

**Check librechat.yaml:**
```yaml
endpoints:
  agents:
    capabilities: ["execute_code", "file_search", "actions", "tools"]
    #                                                        ^^^^^^
    # Must include "tools" for web search
```

### Issue: Search returns no results

**Possible causes:**
1. **API key invalid** - Check Serper dashboard for key status
2. **Rate limit exceeded** - Check Serper usage (free tier = 2,500/month)
3. **Query too broad** - Try more specific searches
4. **Safe search blocking** - Adjust `safeSearch` in librechat.yaml

### Issue: Search results are low quality

**Solution**: Add Jina AI reranker
- Get Jina API key (free)
- Add to .env: `JINA_API_KEY=...`
- Restart LibreChat

---

## 📋 Alternative: Use Without Jina

If you don't want to use Jina reranker:

**Option 1: Disable reranker in librechat.yaml**
```yaml
webSearch:
  serperApiKey: '${SERPER_API_KEY}'
  searchProvider: 'serper'
  # jinaApiKey: '${JINA_API_KEY}'     # Comment out
  # rerankerType: 'jina'              # Comment out
```

**Option 2: Just don't set JINA_API_KEY**
- LibreChat will work with just Serper
- Results won't be reranked but search still works

---

## 💡 Free Alternatives to Serper

If you don't want to use Serper, alternatives:

### 1. Tavily (Alternative search provider)
```bash
# .env
TAVILY_API_KEY=your_tavily_key
```
```yaml
# librechat.yaml
webSearch:
  searchProvider: 'tavily'
  tavilyApiKey: '${TAVILY_API_KEY}'
```

**Free tier**: 1,000 searches/month
**Where**: https://tavily.com

### 2. DuckDuckGo (No API key needed!)
```yaml
# librechat.yaml
webSearch:
  searchProvider: 'duckduckgo'
  # No API key needed!
```

**Pros**: Free, no signup required
**Cons**: Lower quality results, rate limits

---

## 📊 Current Configuration Summary

**Your librechat.yaml web search config:**
```yaml
webSearch:
  searchProvider: 'serper'      # ✅ Configured
  scraperProvider: 'serper'     # ✅ Configured
  rerankerType: 'jina'          # ✅ Configured

  # Missing in .env:
  serperApiKey: '${SERPER_API_KEY}'  # ❌ Not set
  jinaApiKey: '${JINA_API_KEY}'      # ❌ Not set
```

**Agent capabilities:**
```yaml
agents:
  capabilities: ["execute_code", "file_search", "actions", "tools"]
  # "tools" includes web_search ✅
```

**Status**:
- Configuration: ✅ Correct
- API Keys: ❌ Missing
- Action required: Add SERPER_API_KEY and JINA_API_KEY to .env

---

## ✅ Quick Setup Checklist

- [ ] Sign up for Serper.dev (required)
- [ ] Copy Serper API key
- [ ] Sign up for Jina.ai (recommended)
- [ ] Copy Jina API key
- [ ] Add both keys to `.env` file
- [ ] Restart LibreChat: `docker restart LibreChat`
- [ ] Test web search in agent or chat
- [ ] Verify search results appear

---

## 🎯 Expected Behavior After Setup

**Before (current state):**
- ❌ Web search tool not visible in agent builder
- ❌ Models can't search the web
- ⚠️ Warning in logs: "web_search capability disabled"

**After (with API keys):**
- ✅ Web search tool appears in agent builder
- ✅ Agents can search the web
- ✅ Real-time information retrieval works
- ✅ Models can find current news, weather, facts
- ✅ No warnings in logs

---

## 💰 Cost Estimate

**Free tier (sufficient for personal use):**
- Serper: 2,500 searches/month = ~83 searches/day
- Jina: 1 million tokens/month = very generous

**Typical usage:**
- Average user: 50-200 searches/month = **FREE**
- Heavy user: 500-1,000 searches/month = **FREE**
- Power user: 2,000+ searches/month = **FREE** (just within limit)

**Only upgrade if you consistently exceed 2,500 searches/month**

---

**Quick start**: Get Serper key → Add to .env → Restart → Done!
