# Custom AI Providers Configuration

This guide covers setup for OpenRouter, HuggingFace, and Z.ai (Zhipu AI) providers in LibreChat.

---

## OpenRouter

OpenRouter provides access to 200+ AI models through a single API.

### Configuration

**Environment Variable (`.env`):**
```bash
OPENROUTER_KEY=sk-or-v1-xxxxxxxxxxxxx
```

**librechat.yaml:**
```yaml
- name: 'OpenRouter'
  apiKey: '${OPENROUTER_KEY}'
  baseURL: 'https://openrouter.ai/api/v1'

  models:
    default:
      - 'google/gemma-3-4b-it:free'
      - 'meta-llama/llama-3.2-3b-instruct:free'
      - 'deepseek/deepseek-chat-v3-0324:free'
    fetch: true

  titleConvo: true
  titleModel: 'google/gemma-3-4b-it:free'  # Free model for title generation
  modelDisplayLabel: 'OpenRouter'
  dropParams: ['stop']
```

### Free Models

OpenRouter offers free models with `:free` suffix:
- `google/gemma-3-4b-it:free` - Fast, good for titles
- `meta-llama/llama-3.2-3b-instruct:free`
- `mistralai/mistral-7b-instruct:free`
- `deepseek/deepseek-chat-v3-0324:free`
- `moonshotai/kimi-k2` - Trillion parameter model

Check current free models: https://openrouter.ai/models?q=free

### Get API Key

1. Visit https://openrouter.ai
2. Sign up / Log in
3. Go to Keys section
4. Create new API key

---

## HuggingFace

HuggingFace Inference API provides access to open-source models.

### Important: 2025 API Change

HuggingFace migrated to a new router endpoint. The old `api-inference.huggingface.co` returns 410 errors.

### Configuration

**Environment Variable (`.env`):**
```bash
HUGGINGFACE_TOKEN=hf_xxxxxxxxxxxxx
```

**librechat.yaml:**
```yaml
- name: 'HuggingFace'
  apiKey: '${HUGGINGFACE_TOKEN}'
  baseURL: 'https://router.huggingface.co/v1'

  models:
    default:
      - 'meta-llama/Llama-3.2-3B-Instruct:together'
      - 'Qwen/Qwen2.5-72B-Instruct:together'
      - 'mistralai/Mistral-7B-Instruct-v0.3:together'
    fetch: false  # Requires :provider suffix, cannot auto-fetch

  titleConvo: true
  titleModel: 'meta-llama/Llama-3.2-3B-Instruct:together'
  modelDisplayLabel: 'HuggingFace'
```

### Model Format

Models MUST include a provider suffix. **`:auto` does NOT work!**

Valid providers:
- `:together` - Together AI (recommended)
- `:fireworks-ai` - Fireworks AI
- `:cerebras` - Cerebras
- `:groq` - Groq
- `:sambanova` - SambaNova
- `:novita` - Novita AI
- `:fastest` - Auto-select fastest provider
- `:cheapest` - Auto-select cheapest provider

Example: `meta-llama/Llama-3.2-3B-Instruct:together`

### Get API Key

1. Visit https://huggingface.co
2. Sign up / Log in
3. Go to Settings > Access Tokens
4. Create new token with "Read" permission

---

## Z.ai (Zhipu AI)

Z.ai provides access to GLM models from Zhipu AI (Chinese AI company).

### Configuration

**Environment Variable (`.env`):**
```bash
ZAI_API_KEY=xxxxxxxxxxxxx
```

**librechat.yaml:**
```yaml
- name: 'Z.ai'
  apiKey: '${ZAI_API_KEY}'
  baseURL: 'https://api.z.ai/api/coding/paas/v4'  # Official Z.ai endpoint

  models:
    default:
      - 'GLM-4.5'
      - 'GLM-4.5-Air'
      - 'GLM-4.6'
    fetch: true

  titleConvo: true
  titleModel: 'GLM-4.5-Air'  # Cheaper model for titles
  modelDisplayLabel: 'Z.ai'
```

### Available Models

| Model | Parameters | Context | Use Case |
|-------|------------|---------|----------|
| GLM-4.5 | 355B total, 32B active | 128K | Flagship model |
| GLM-4.5-Air | 106B total, 12B active | 128K | Fast, cost-effective |
| GLM-4.6 | - | 200K | Extended context |

### Get API Key

1. Visit https://z.ai (global) or https://open.bigmodel.cn (China)
2. Sign up / Log in
3. Navigate to API section
4. Create new API key

---

## Troubleshooting

### Common Issues

| Error | Cause | Solution |
|-------|-------|----------|
| 410 Gone (HuggingFace) | Old API endpoint | Use `router.huggingface.co/v1` |
| Timeout (Z.ai) | Wrong baseURL | Use `api.z.ai/v1` (not `/api/paas/v4`) |
| Models not showing | Missing API key | Check `.env` has the key set |
| ZodError | Invalid config | Check `default` array has at least 1 model |

### Validating Configuration

```bash
# Check YAML syntax
python3 -c "import yaml; yaml.safe_load(open('librechat.yaml'))"

# Check inside Docker container
docker exec LibreChat cat /app/librechat.yaml | head -20
```

### Applying Changes

After modifying `librechat.yaml`:

```powershell
# Windows
docker-compose -f docker-compose.windows.yml down
docker-compose -f docker-compose.windows.yml up -d
```

```bash
# Linux/Mac
docker-compose down
docker-compose up -d
```

---

## Version History

| Date | Change |
|------|--------|
| 2025-11-21 | Added OpenRouter, HuggingFace (new endpoint), Z.ai |
| 2025-11-21 | HuggingFace migrated to router.huggingface.co |
