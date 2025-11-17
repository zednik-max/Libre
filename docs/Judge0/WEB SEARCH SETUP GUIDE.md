# Web Search Setup Guide for LibreChat

This guide explains how to enable web search functionality in LibreChat using Serper and Jina APIs.

## Overview

LibreChat's web search feature requires three components:

1. **Search Provider** - For finding web results (using Serper)
2. **Content Scraper** - For extracting content from web pages (using Serper)
3. **Reranker** - For ranking and improving result relevance (using Jina AI)

**Good News**: With Serper and Jina APIs, you have everything you need! Serper can handle both search and scraping.

## Prerequisites

- ✅ Serper API key (you have this)
- ✅ Jina API key (you have this)
- LibreChat installed and running

## API Keys Setup

### 1. Get Your API Keys

**Serper API** (Google Search):
- Website: https://serper.dev/
- Sign up for a free account
- Get your API key from the dashboard
- Free tier: 2,500 searches/month

**Jina AI** (Reranking):
- Website: https://jina.ai/
- Sign up for a free account
- Get your API key from the dashboard
- Free tier: 1M tokens/month

### 2. Add API Keys to .env File

On your local LibreChat installation, edit your `.env` file:

```bash
# Web Search Configuration
SERPER_API_KEY=your_actual_serper_api_key_here
JINA_API_KEY=your_actual_jina_api_key_here
```

**Important**:
- Replace `your_actual_serper_api_key_here` with your real Serper API key
- Replace `your_actual_jina_api_key_here` with your real Jina API key
- Do NOT use quotes around the values
- Do NOT commit your .env file with real keys to git

## Configuration

### Option 1: Use the Pre-configured File (Recommended)

The `librechat.vertex-ai.yaml` file already includes web search configuration:

```yaml
webSearch:
  # Search Provider: Serper (Google Search API)
  serperApiKey: '${SERPER_API_KEY}'
  searchProvider: 'serper'

  # Content Scraper: Also using Serper
  scraperProvider: 'serper'
  scraperTimeout: 10000  # 10 seconds timeout

  # Reranker: Jina AI
  jinaApiKey: '${JINA_API_KEY}'
  rerankerType: 'jina'

  # Safe search level
  safeSearch: 'moderate'
```

Just copy this file to your local directory as `librechat.yaml`.

### Option 2: Add to Existing librechat.yaml

If you already have a `librechat.yaml` file, add this section at the end:

```yaml
webSearch:
  serperApiKey: '${SERPER_API_KEY}'
  searchProvider: 'serper'
  scraperProvider: 'serper'
  scraperTimeout: 10000
  jinaApiKey: '${JINA_API_KEY}'
  rerankerType: 'jina'
  safeSearch: 'moderate'
```

## How It Works

### Search Flow

1. **User asks question** requiring web information
2. **Serper searches Google** and returns relevant URLs
3. **Serper scrapes content** from those URLs
4. **Jina reranks results** based on relevance to the query
5. **AI model synthesizes answer** using the web content

### Component Roles

**Serper as Search Provider**:
- Queries Google Search API
- Returns top results with titles, snippets, URLs
- Fast and reliable search results

**Serper as Scraper**:
- Extracts full content from web pages
- Returns clean text without ads/navigation
- No need for separate Firecrawl subscription!

**Jina as Reranker**:
- Analyzes search results for relevance
- Reorders results based on semantic similarity
- Improves answer quality by prioritizing best sources

## Testing Web Search

### 1. Restart LibreChat

After adding the API keys and configuration:

```powershell
# Windows
docker-compose -f docker-compose.windows.yml restart

# Or if using standard docker-compose
docker-compose restart
```

### 2. Create an Agent with Web Search

In LibreChat:

1. **Go to Agents** (in the left sidebar)
2. **Click "Create Agent"**
3. **Enable "Web Search" tool**
4. **Configure the agent**:
   - Name: "Web Research Assistant"
   - Provider: Choose any (OpenAI, Anthropic, Google, or Vertex-AI)
   - Model: Select a capable model (e.g., `deepseek-v3`, `gpt-4o`, `claude-sonnet-4.5`)
   - Instructions: "You are a helpful assistant that can search the web for current information."
5. **Save the agent**

### 3. Test Web Search

Start a conversation with your agent and ask questions that require web search:

**Example queries**:
- "What are the latest news about AI in 2025?"
- "Find recent information about [your topic]"
- "Search for the current price of Bitcoin"
- "What happened in the world today?"

The agent will automatically use web search when needed!

## Configuration Options

### Safe Search Levels

```yaml
safeSearch: 'off'       # No filtering
safeSearch: 'moderate'  # Default - filters explicit content
safeSearch: 'strict'    # Strict filtering
```

### Scraper Timeout

```yaml
scraperTimeout: 5000   # 5 seconds (faster, might miss slow sites)
scraperTimeout: 10000  # 10 seconds (default - balanced)
scraperTimeout: 15000  # 15 seconds (slower, more thorough)
```

### Custom Jina Endpoint (Optional)

If you're using a custom Jina deployment:

```yaml
jinaApiKey: '${JINA_API_KEY}'
jinaApiUrl: 'https://your-custom-jina-endpoint.com/v1/rerank'
```

Then add to .env:
```bash
JINA_API_URL=https://your-custom-jina-endpoint.com/v1/rerank
```

## Alternative Configurations

### Using Firecrawl Instead of Serper for Scraping

If you prefer Firecrawl for content extraction:

```yaml
webSearch:
  serperApiKey: '${SERPER_API_KEY}'
  searchProvider: 'serper'

  # Use Firecrawl for scraping
  firecrawlApiKey: '${FIRECRAWL_API_KEY}'
  scraperProvider: 'firecrawl'

  jinaApiKey: '${JINA_API_KEY}'
  rerankerType: 'jina'
```

And add to .env:
```bash
FIRECRAWL_API_KEY=your_firecrawl_api_key
```

### Using SearXNG (Self-hosted Search)

For privacy-focused self-hosted search:

```yaml
webSearch:
  # Self-hosted SearXNG instance
  searxngInstanceUrl: '${SEARXNG_INSTANCE_URL}'
  searxngApiKey: '${SEARXNG_API_KEY}'  # Optional
  searchProvider: 'searxng'

  serperApiKey: '${SERPER_API_KEY}'
  scraperProvider: 'serper'

  jinaApiKey: '${JINA_API_KEY}'
  rerankerType: 'jina'
```

### Using Cohere Instead of Jina for Reranking

If you prefer Cohere:

```yaml
webSearch:
  serperApiKey: '${SERPER_API_KEY}'
  searchProvider: 'serper'
  scraperProvider: 'serper'

  # Use Cohere for reranking
  cohereApiKey: '${COHERE_API_KEY}'
  rerankerType: 'cohere'
```

## Troubleshooting

### Web Search Not Available

**Symptoms**: Web search tool doesn't appear in agent configuration

**Solutions**:
1. Check that `librechat.yaml` has `webSearch:` section
2. Verify API keys are set in `.env` file
3. Restart LibreChat completely
4. Check docker logs for errors:
   ```powershell
   docker-compose logs api | Select-String -Pattern "web search"
   ```

### "Authentication Failed" Errors

**Symptoms**: Agent can't use web search, shows authentication error

**Solutions**:
1. Verify API keys are correct (no extra spaces, quotes)
2. Check API key validity:
   - Serper: https://serper.dev/dashboard
   - Jina: https://jina.ai/dashboard
3. Ensure keys are not expired or rate-limited
4. Check .env file is in the correct location
5. Restart LibreChat after changing .env

### Search Results Empty or Poor Quality

**Symptoms**: Web search returns no results or irrelevant content

**Solutions**:
1. Increase `scraperTimeout` to 15000 (15 seconds)
2. Try different `safeSearch` settings
3. Check Serper dashboard for rate limits
4. Verify search queries are clear and specific

### Slow Response Times

**Symptoms**: Web search takes very long to respond

**Solutions**:
1. Reduce `scraperTimeout` to 7500 (7.5 seconds)
2. Check internet connection speed
3. Monitor Serper API response times
4. Consider using faster models (e.g., `deepseek-v3` instead of larger models)

### Jina Reranking Errors

**Symptoms**: Search works but results aren't well-ranked

**Solutions**:
1. Verify Jina API key is valid
2. Check Jina API rate limits
3. Try using Cohere as alternative reranker
4. Check Jina API logs:
   ```powershell
   docker-compose logs api | Select-String -Pattern "jina"
   ```

## Cost Considerations

### Serper API

**Free Tier**:
- 2,500 searches per month
- Good for personal use and testing

**Paid Plans**:
- Starts at $50/month for 30,000 searches
- Pay-as-you-go: $5 per 1,000 searches

**Cost per search**: ~$0.005

### Jina AI

**Free Tier**:
- 1M tokens per month
- Sufficient for most personal use

**Paid Plans**:
- $10/month for 10M tokens
- Enterprise plans available

**Cost per rerank**: Very low (~$0.0001 per query)

### Total Estimated Costs

For moderate usage (100 searches/day):
- **Free tier**: ~$0/month (within limits)
- **Heavy usage**: ~$15-20/month

**Tip**: Monitor your usage on provider dashboards to avoid surprises!

## API Key Security

### Best Practices

1. **Never commit .env to git**:
   ```bash
   # Add to .gitignore
   echo ".env" >> .gitignore
   ```

2. **Use environment-specific files**:
   - `.env.example` - Template (commit this)
   - `.env` - Real keys (never commit)

3. **Rotate keys regularly**: Generate new API keys every 3-6 months

4. **Set up rate limits**: Configure limits in provider dashboards

5. **Monitor usage**: Check dashboards weekly for unusual activity

### Example .env Structure

```bash
# GCP Vertex AI
GOOGLE_SERVICE_KEY_FILE=/app/gcp-sa-key.json

# Web Search
SERPER_API_KEY=SrP_1234567890abcdefghijklmnopqrstuvwxyz
JINA_API_KEY=jina_1234567890abcdefghijklmnopqrstuvwxyz

# Other providers (optional)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

## Advanced: Using Web Search Programmatically

### In Agent Instructions

You can guide agents when to use web search:

```yaml
agent:
  name: "Research Assistant"
  instructions: |
    You are a research assistant with web search capabilities.

    Use web search when:
    - User asks about current events or recent information
    - You need to verify facts or get latest data
    - The question is about something after your knowledge cutoff

    Don't use web search when:
    - You have reliable knowledge from training
    - User asks for creative writing or opinions
    - The question is about general knowledge
```

### Search Quality Tips

**Good search queries** (agent will generate):
- Specific, focused questions
- Include relevant keywords
- Time-bound when needed ("2025", "latest", "current")

**Poor search queries**:
- Too broad or vague
- Multiple unrelated topics
- Extremely long queries

## Complete Working Example

### 1. .env File

```bash
# GCP Vertex AI
GOOGLE_SERVICE_KEY_FILE=/app/gcp-sa-key.json

# Web Search APIs
SERPER_API_KEY=SrP_YourActualSerperKeyHere
JINA_API_KEY=jina_YourActualJinaKeyHere

# Optional
OPENAI_API_KEY=sk-YourOpenAIKey
```

### 2. librechat.yaml

```yaml
version: 1.2.1

endpoints:
  custom:
    - name: 'Vertex-AI'
      apiKey: 'dummy'
      baseURL: 'http://vertex-proxy:4000'
      iconURL: '/assets/google.svg'
      models:
        default:
          - 'deepseek-r1'
          - 'deepseek-v3'
          - 'llama-4-scout'
        fetch: false
      titleConvo: true
      titleModel: 'deepseek-v3'
      modelDisplayLabel: 'GCP Vertex AI'

webSearch:
  serperApiKey: '${SERPER_API_KEY}'
  searchProvider: 'serper'
  scraperProvider: 'serper'
  scraperTimeout: 10000
  jinaApiKey: '${JINA_API_KEY}'
  rerankerType: 'jina'
  safeSearch: 'moderate'
```

### 3. Start LibreChat

```powershell
docker-compose -f docker-compose.windows.yml up -d
```

### 4. Create Agent

- Name: "News Researcher"
- Provider: Vertex-AI
- Model: deepseek-v3
- Tools: ✅ Web Search
- Instructions: "Search the web for current information and provide well-sourced answers."

### 5. Test

Ask: "What are the top AI developments in January 2025?"

The agent will:
1. Use Serper to search Google
2. Scrape relevant articles
3. Use Jina to rank results
4. Synthesize a comprehensive answer with sources

## Next Steps

1. ✅ Add API keys to your `.env` file
2. ✅ Copy `librechat.vertex-ai.yaml` to `librechat.yaml`
3. ✅ Restart LibreChat
4. ✅ Create an agent with web search enabled
5. ✅ Test with a current events question
6. 📊 Monitor usage on provider dashboards

## Resources

- **LibreChat Web Search Docs**: https://librechat.ai/docs/features/web_search
- **Serper API Docs**: https://serper.dev/docs
- **Jina AI Docs**: https://docs.jina.ai/
- **LibreChat Discord**: https://discord.librechat.ai

## Support

If you encounter issues:

1. Check LibreChat logs: `docker-compose logs api`
2. Verify configuration with examples above
3. Test API keys on provider dashboards
4. Ask on LibreChat Discord
5. Check GitHub issues: https://github.com/danny-avila/LibreChat/issues

---

**Happy Searching! 🔍**
