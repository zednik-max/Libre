# OPENWEATHER_API_KEY Configuration Guide

**Version**: v0.8.1-rc1
**Last Updated**: 2025-11-16

---

## What is OPENWEATHER_API_KEY?

**OPENWEATHER_API_KEY** enables the **OpenWeather** tool in LibreChat, providing real-time weather data and forecasts from the OpenWeather API.

### What Users Get

When configured, LibreChat users can:
- ✅ **Current weather** - Temperature, humidity, conditions
- ✅ **Weather forecasts** - 5-day hourly forecasts
- ✅ **Historical data** - Past weather information
- ✅ **Multiple locations** - Weather for any city worldwide
- ✅ **Detailed metrics** - Wind, pressure, visibility, UV index
- ✅ **Real-time updates** - Fresh data every conversation

---

## Quick Setup

**1. Get API Key**:
- Visit: https://home.openweathermap.org/users/sign_up
- Sign up (free tier: 1,000 calls/day)
- Verify email
- Get API key: https://home.openweathermap.org/api_keys
- Wait 10-120 minutes for activation

**2. Configure**:
```bash
# Add to .env
OPENWEATHER_API_KEY=your-api-key-here
```

**3. Restart**:
```bash
docker-compose -f docker-compose.windows.yml restart api
```

**4. Enable in UI**:

**For Agents** (Recommended):
- Go to **Agent Marketplace** (sidebar) or create **New Agent**
- In Agent settings, add "OpenWeather" tool
- Save agent
- [See detailed Agent creation guide](./_UI_NAVIGATION.md#creating-an-agent)

**For Assistants**:
- Go to **Assistants** (sidebar) or create **New Assistant**
- In tools section, enable "OpenWeather"
- Save assistant
- [See detailed Assistant creation guide](./_UI_NAVIGATION.md#creating-an-assistant-openai)

---

## What Users Experience

**Example conversations**:

**Current weather**:
```
User: "What's the weather in London?"
AI: *Uses OpenWeather*
    London: 12°C, partly cloudy
    Humidity: 75%, Wind: 15 km/h NW
```

**Forecast**:
```
User: "Will it rain in Tokyo tomorrow?"
AI: *Uses OpenWeather*
    Tokyo tomorrow: 18°C, light rain expected in afternoon
    Precipitation: 60% chance
```

**Planning**:
```
User: "Should I bring an umbrella to Paris this weekend?"
AI: *Uses OpenWeather*
    Paris weekend forecast shows rain Saturday afternoon.
    Yes, bring an umbrella for Saturday!
```

**Use cases**:
- Trip planning
- Daily weather checks
- Sports/outdoor activities
- Travel decisions
- Clothing recommendations

---

## Pricing

**Free Tier**:
- 1,000 API calls/day
- 60 calls/minute
- Current weather + 5-day forecast
- Perfect for personal use

**Paid Plans**:
- Starting at $40/month
- Higher limits
- Historical data
- More frequent updates
- Visit: https://openweathermap.org/price

---

## Configuration Reference

```bash
# In .env
OPENWEATHER_API_KEY=your-api-key

# Optional: Default units (metric, imperial, standard)
OPENWEATHER_API_UNITS=metric
```

---

## Troubleshooting

**API key not working (401 error)**:
- Wait 10-120 minutes after signup (activation delay)
- Verify key at https://home.openweathermap.org/api_keys
- Ensure key is active (not expired)

**Tool not showing in Agent/Assistant**:
- Check OPENWEATHER_API_KEY in .env
- Restart LibreChat: `docker-compose restart api`
- Refresh browser to clear cache
- Tool appears in Agent/Assistant tools list when key configured

**No weather data**:
- Check city name spelling
- Try coordinates: "weather at 51.5074,-0.1278"
- Verify API key has permissions

---

## Related Documentation

- **Main Guide**: See [CLAUDE.md](../../../CLAUDE.md)

---

*For more info: https://openweathermap.org/api | https://openweathermap.org/appid*
