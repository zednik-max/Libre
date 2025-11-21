# LibreChat Documentation

Welcome to the LibreChat documentation. This guide covers setup, configuration, and customization.

---

## Quick Navigation

| Section | Description |
|---------|-------------|
| [Getting Started](#getting-started) | Initial setup and installation |
| [Configuration](#configuration) | API keys, providers, settings |
| [Custom AI Providers](#custom-ai-providers) | OpenRouter, HuggingFace, Z.ai, etc. |
| [Agents & Assistants](#agents--assistants) | Creating and configuring AI agents |
| [Infrastructure](#infrastructure) | Vertex AI, Judge0, Docker |
| [Development](#development) | Contributing, architecture |

---

## Getting Started

- **[CLAUDE.md](../CLAUDE.md)** - Complete development guide
- **[AGENTS.md](../AGENTS.md)** - AI coding agent instructions
- **[.env.example](../.env.example)** - Environment variables reference

### Prerequisites
- Node.js 18+
- MongoDB 6+
- Redis 6+
- Docker (recommended)

---

## Configuration

### Environment Variables
| File | Description |
|------|-------------|
| [ALLOW_SOCIAL_LOGIN](LibreChat/Configuration/ALLOW_SOCIAL_LOGIN.md) | OAuth/Social login setup |
| [ASSISTANTS_API_KEY](LibreChat/Configuration/ASSISTANTS_API_KEY.md) | OpenAI Assistants API |
| [EMBEDDINGS_PROVIDER](LibreChat/Configuration/EMBEDDINGS_PROVIDER.md) | Embedding model configuration |
| [FIREBASE_API_KEY](LibreChat/Configuration/FIREBASE_API_KEY.md) | Firebase storage setup |

### API Keys & Services
| File | Description |
|------|-------------|
| [GOOGLE_SEARCH_API](LibreChat/Configuration/GOOGLE_SEARCH_API.md) | Google Custom Search |
| [TAVILY_API_KEY](LibreChat/Configuration/TAVILY_API_KEY.md) | Tavily search integration |
| [SERPER_API_KEY](LibreChat/Configuration/SERPER_API_KEY.md) | Serper search & scrape |
| [OPENWEATHER_API_KEY](LibreChat/Configuration/OPENWEATHER_API_KEY.md) | Weather data |
| [WOLFRAM_APP_ID](LibreChat/Configuration/WOLFRAM_APP_ID.md) | Wolfram Alpha |
| [MAILGUN_API_KEY](LibreChat/Configuration/MAILGUN_API_KEY.md) | Email services |

---

## Custom AI Providers

### Provider Configuration Guide
**[Custom_AI_Providers.md](LibreChat/Configuration/Custom_AI_Providers.md)** - Complete setup for:

| Provider | Base URL | Notes |
|----------|----------|-------|
| OpenRouter | `https://openrouter.ai/api/v1` | 200+ models, free tier available |
| HuggingFace | `https://router.huggingface.co/v1` | Requires `:provider` suffix |
| Z.ai (Zhipu) | `https://api.z.ai/api/coding/paas/v4` | GLM models |
| Mistral | `https://api.mistral.ai/v1` | Mistral models |
| Perplexity | `https://api.perplexity.ai` | Search-augmented AI |

### Model Garden
| File | Description |
|------|-------------|
| [Vertex AI Capabilities](VERTEX_AI_MODEL_CAPABILITIES.md) | GCP Vertex AI models |
| [Vertex AI Quota](LibreChat/Configuration/Vertex%20AI%20Quota%20Monitoring%20and%20Cost%20Estimation.md) | Quota monitoring |

---

## Agents & Assistants

### Guides
| File | Description |
|------|-------------|
| [Agent vs Assistant](LibreChat/Agent%20vs%20Assistant.md) | Understanding the differences |
| [LibreChat Agents](LibreChat/LibreChat%20-%20Agents.md) | Agent system overview |
| [Agent Creation Guide](LibreChat/Configuration/Agent_Creation_Guide_by_Claude.md) | Step-by-step agent setup |
| [Assistant Creation Guide](LibreChat/Configuration/Assistant_Creation_Guide_by_Claude.md) | OpenAI Assistants setup |

### Technical Reference
- **[AGENTS_CUSTOMIZATIONS.md](../AGENTS_CUSTOMIZATIONS.md)** - Agent schema and API

---

## Infrastructure

### Vertex AI Proxy
| File | Description |
|------|-------------|
| [Analysis & Recommendations](LibreChat/Vertex%20AI%20Proxy%20-%20Analysis%20and%20Recommendations.md) | Architecture overview |
| [Installation (Windows)](Judge0/INSTALLATION%20GUIDE%20-%20VERTEX%20AI%20(Windows).md) | Windows setup |
| [Custom Icons](Judge0/VERTEX%20AI%20-%20CUSTOM%20ICON%20GUIDE.md) | Model icons |

### Judge0 Code Execution
| File | Description |
|------|-------------|
| [Quick Start](Judge0/QUICK%20START%20-%20JUDGE0%20INTEGRATION.md) | Get started fast |
| [Setup Guide](Judge0/JUDGE0%20MCP%20SERVER%20-%20SETUP%20GUIDE.md) | Detailed setup |
| [Testing Guide](Judge0/JUDGE0%20CODE%20INTERPRETER%20-%20TESTING%20GUIDE.md) | Testing instructions |
| [Troubleshooting](Judge0/TROUBLESHOOTING%20-%20MCP%20NOT%20SHOWING.md) | Common issues |

### Search & RAG
| File | Description |
|------|-------------|
| [Web Search Setup](LibreChat/Web%20Search%20Setup%20Guide.md) | SearXNG, Serper |
| [HuggingFace Embeddings](LibreChat/Setting%20Up%20HuggingFace%20Embeddings.md) | Embedding setup |
| [Ollama Embeddings](LibreChat/Setting%20Up%20Ollama%20Embeddings.md) | Local embeddings |

---

## Development

### Architecture
| File | Description |
|------|-------------|
| [Gemini Integration Plan](LibreChat/Development/PLAN_Gemini_Assistants_Integration.md) | Gemini Assistants |
| [DB Persistence Fix](LibreChat/DB%20Persistence%20Fix.md) | Database fixes |

### Localization
| File | Description |
|------|-------------|
| [Slovak Translation PRD](LibreChat/PRD%20-%20Slovak%20Translation%20Integration.md) | Translation spec |
| [Slovak Review Guide](LibreChat/Slovak%20Translation%20-%20Review%20Guide.md) | Review process |

---

## Docker Deployment

### Windows
```powershell
docker-compose -f docker-compose.windows.yml up -d
docker logs LibreChat --tail 50
```

### Linux/Mac
```bash
docker-compose up -d
docker logs LibreChat --tail 50
```

---

## Related Files

| File | Location | Description |
|------|----------|-------------|
| CLAUDE.md | Root | Complete development guide |
| AGENTS.md | Root | AI agent instructions |
| librechat.yaml | Root | Main configuration |
| .env.example | Root | Environment template |
| docker-compose.windows.yml | Root | Windows Docker config |

---

## External Resources

- **Official Docs**: https://docs.librechat.ai/
- **GitHub**: https://github.com/danny-avila/LibreChat
- **Discord**: https://discord.librechat.ai

---

*Last updated: 2025-11-21*
