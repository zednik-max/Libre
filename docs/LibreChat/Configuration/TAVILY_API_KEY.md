# TAVILY_API_KEY Configuration Guide

**Version**: v0.8.1-rc1
**Last Updated**: 2025-11-16

---

## What is TAVILY_API_KEY?

**TAVILY_API_KEY** enables the **Tavily Search** tool in LibreChat, which provides AI-optimized web search specifically designed for LLM agents.

### What Users Get

When configured, LibreChat users can:
- ✅ **AI-optimized search** - Results formatted for LLMs
- ✅ **Real-time web data** - Current information from the internet
- ✅ **Structured results** - JSON with titles, snippets, URLs
- ✅ **Fast responses** - Optimized for agent workflows
- ✅ **Automatic invocation** - AI decides when to search
- ✅ **Source citations** - Links to original sources

---

## Quick Setup

**1. Get API Key**:
- Visit: https://app.tavily.com/
- Sign up (free tier: 1,000 requests/month)
- Generate API key (starts with `tvly-`)

**2. Configure**:
```bash
# Add to .env
TAVILY_API_KEY=tvly-your-key-here
```

**3. Restart**:
```bash
docker-compose -f docker-compose.windows.yml restart api
```

**4. Enable in UI**:

**For Agents** (Recommended):
- Go to **Agent Marketplace** (sidebar) or create **New Agent**
- In Agent settings, add "Tavily Search" tool
- Save agent
- [See detailed Agent creation guide](./_UI_NAVIGATION.md#creating-an-agent)

**For Assistants**:
- Go to **Assistants** (sidebar) or create **New Assistant**
- In tools section, enable "Tavily Search"
- Save assistant
- [See detailed Assistant creation guide](./_UI_NAVIGATION.md#creating-an-assistant-openai)

---

## What Users Experience

**Example conversation**:
```
User: "What's the latest news about AI?"

AI: *Invokes Tavily Search*
    Returns: Based on recent sources...
    - OpenAI announced...
    - Google DeepMind released...
    - [Source links provided]
```

**Use cases**:
- Current events and news
- Latest research and developments
- Product information and reviews
- Real-time data queries
- Fact-checking

---

## Pricing

**Free Tier**:
- 1,000 API requests/month
- No credit card required
- Perfect for personal use

**Paid Plans**:
- Starting at $25/month
- Higher request limits
- Priority support
- Visit https://tavily.com/pricing

---

## Configuration Reference

```bash
# In .env
TAVILY_API_KEY=tvly-your-api-key

# Optional: Restrict plugin to specific models
PLUGIN_MODELS=gpt-4o,gpt-4o-mini,gpt-4-turbo-preview
```

---

## Troubleshooting

**Plugin not showing**:
- Ensure ChatGPT/Azure endpoint selected
- Check TAVILY_API_KEY in .env
- Restart: `docker-compose restart api`

**API key invalid**:
- Verify key starts with `tvly-`
- Check key is active on tavily.com
- Generate new key if needed

**Search not working**:
- Enable plugin in Plugin Store
- Check model supports plugins
- View logs: `docker logs LibreChat | grep -i tavily`

---

## Related Documentation

- **Google Search**: See [GOOGLE_SEARCH_API.md](./GOOGLE_SEARCH_API.md)
- **Web Search (Serper)**: See librechat.yaml webSearch config
- **Perplexity AI**: See librechat.yaml Perplexity endpoint

---

*For more info: https://tavily.com/ | https://docs.tavily.com/*
