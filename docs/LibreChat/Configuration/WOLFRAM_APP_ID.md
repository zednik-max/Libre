# WOLFRAM_APP_ID Configuration Guide

**Version**: v0.8.1-rc1
**Last Updated**: 2025-11-16

---

## What is WOLFRAM_APP_ID?

**WOLFRAM_APP_ID** enables the **Wolfram|Alpha** plugin in LibreChat, providing access to computational intelligence, mathematics, and curated real-time data.

### What Users Get

When configured, LibreChat users can:
- ✅ **Mathematical computations** - Solve complex equations
- ✅ **Unit conversions** - Convert between any units
- ✅ **Scientific calculations** - Physics, chemistry, engineering
- ✅ **Statistical analysis** - Data analysis and visualization
- ✅ **Real-time data** - Weather, stocks, demographics
- ✅ **Structured knowledge** - Facts, definitions, comparisons
- ✅ **Step-by-step solutions** - Show work for math problems

---

## Quick Setup

**1. Get Wolfram App ID**:
- Visit: http://products.wolframalpha.com/api/
- Click **"Get an AppID"**
- Sign up (free tier: 2,000 queries/month)
- Go to: https://developer.wolframalpha.com/portal/myapps/
- Create new app, get App ID

**2. Configure**:
```bash
# Add to .env
WOLFRAM_APP_ID=YOUR-APP-ID-HERE
```

**3. Restart**:
```bash
docker-compose -f docker-compose.windows.yml restart api
```

**4. Enable in UI**:
- Select ChatGPT/Azure endpoint
- Open Plugin Store
- Enable "Wolfram"

---

## What Users Experience

**Example conversations**:

**Mathematics**:
```
User: "Solve x^2 + 5x + 6 = 0"
AI: *Uses Wolfram*
    Solutions: x = -2, x = -3
    [Shows step-by-step solution]
```

**Unit Conversion**:
```
User: "Convert 100 km/h to mph"
AI: *Uses Wolfram*
    100 km/h ≈ 62.137 mph
```

**Real-time Data**:
```
User: "What's the population of Tokyo?"
AI: *Uses Wolfram*
    Tokyo population: ~14 million (metropolitan area: ~37 million)
```

**Use cases**:
- Math homework and problem-solving
- Scientific calculations
- Unit conversions
- Statistical analysis
- Real-time data queries
- Educational assistance

---

## Pricing

**Free Tier**:
- 2,000 API calls/month
- Full API access
- Non-commercial use

**Paid Plans**:
- Starting at $5/month (25,000 calls)
- Commercial use allowed
- Higher rate limits
- Visit: https://products.wolframalpha.com/api/pricing/

---

## Configuration Reference

```bash
# In .env
WOLFRAM_APP_ID=YOUR-APP-ID

# Optional: Restrict to specific models
PLUGIN_MODELS=gpt-4o,gpt-4,gpt-4-turbo-preview
```

---

## Troubleshooting

**Plugin not showing**:
- Check WOLFRAM_APP_ID in .env
- Restart LibreChat
- Ensure ChatGPT/Azure endpoint selected

**Invalid App ID**:
- Verify App ID from https://developer.wolframalpha.com/portal/myapps/
- Ensure no spaces in ID
- Check ID is active

**Query limit exceeded**:
- Free tier: 2,000/month
- Upgrade plan or wait for reset
- Monitor usage in Developer Portal

---

## Related Documentation

- **Calculator Plugin**: See manifest.json (free, no API key)
- **Main Guide**: See [CLAUDE.md](../../../CLAUDE.md)

---

*For more info: https://products.wolframalpha.com/api/*
