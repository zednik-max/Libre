# SERPER_API_KEY Configuration

Serper provides Google Search and web scraping capabilities for LibreChat agents.

---

## Overview

| Feature | Description |
|---------|-------------|
| **Service** | Serper.dev |
| **Free Tier** | 2,500 calls/month |
| **Used For** | Web search, content scraping |
| **Website** | https://serper.dev |

---

## Getting API Key

1. Visit https://serper.dev
2. Sign up for free account
3. Navigate to API Keys section
4. Copy your API key

---

## Configuration

### Environment Variable

Add to `.env`:
```bash
SERPER_API_KEY=your-api-key-here
```

### librechat.yaml

```yaml
webSearch:
  serperApiKey: '${SERPER_API_KEY}'
  searchProvider: 'serper'
  scraperProvider: 'serper'
  scraperTimeout: 10000  # 10 seconds
```

---

## MCP Server Integration

Serper is available as an MCP tool for agents:

```yaml
mcpServers:
  serper:
    type: stdio
    command: npx
    args:
      - serper-search-scrape-mcp-server
    env:
      SERPER_API_KEY: '${SERPER_API_KEY}'
```

### Available Tools

| Tool | Description |
|------|-------------|
| `google_search` | Search Google |
| `scrape` | Scrape web page content |

---

## Usage in Agents

When creating an agent with web search capabilities:

1. Enable MCP in agent settings
2. Select "serper" MCP server
3. Agent will have access to `google_search` and `scrape` tools

---

## Pricing

| Plan | Searches | Price |
|------|----------|-------|
| Free | 2,500/month | $0 |
| Starter | 50,000/month | $50 |
| Standard | 100,000/month | $75 |

---

## Troubleshooting

### API Key Not Working
- Verify key is correctly set in `.env`
- Check no trailing spaces
- Restart Docker after changes

### MCP Server Not Showing
- Check `docker logs LibreChat` for MCP initialization
- Verify mcpServers section in `librechat.yaml`

---

## Related Documentation

- [Web Search Setup Guide](../Web%20Search%20Setup%20Guide.md)
- [Custom AI Providers](Custom_AI_Providers.md)

---

*Last updated: 2025-11-21*
