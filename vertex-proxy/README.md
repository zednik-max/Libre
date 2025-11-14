# Vertex AI OAuth2 Proxy

Custom authentication proxy for GCP Vertex AI Model Garden (MAAS) endpoints.

## Purpose

This proxy provides OpenAI-compatible API access to GCP Vertex AI partner models with automatic OAuth2 authentication using service account credentials.

## Supported Models

- **DeepSeek R1** - Advanced reasoning model
- **DeepSeek V3.1** - Latest DeepSeek model
- **MiniMax M2** - Creative tasks specialist
- **Qwen3 235B** - Massive 235B parameter model
- **Llama 3.3 70B** - Meta's Llama 3.3
- **Qwen3-Next Thinking** - Reasoning-enhanced model
- **Llama 4 Maverick** - Meta's latest (128e variant)
- **Llama 4 Scout** - Meta's latest (16e variant)

## Configuration

### Environment Variables

- `GOOGLE_APPLICATION_CREDENTIALS` - Path to GCP service account JSON file (default: `/app/gcp-sa-key.json`)

### Customization

To add or modify models, edit the `MODEL_ENDPOINTS` dictionary in `app.py`:

```python
MODEL_ENDPOINTS = {
    "your-model-name": {
        "url": "https://[region]-aiplatform.googleapis.com/v1/projects/[project-id]/locations/[location]/endpoints/openapi/chat/completions",
        "model": "provider/model-id-maas"
    }
}
```

## API Endpoints

- `GET /health` - Health check, returns available models
- `GET /token-status` - Check OAuth2 token cache status (shows if cached and time remaining)
- `GET /v1/models` - List available models (OpenAI-compatible)
- `POST /v1/chat/completions` - Chat completions (OpenAI-compatible)
- `POST /chat/completions` - Alternative chat completions endpoint

## Usage

### Health Check

```bash
curl http://localhost:4000/health
```

### Chat Completion

```bash
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-v3",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": false
  }'
```

## Development

### Local Testing

```bash
# Install dependencies
pip install -r requirements.txt

# Set service account path
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account.json

# Run the proxy
python app.py
```

### Docker Build

```bash
docker build -t vertex-proxy .
docker run -p 4000:4000 -v /path/to/sa-key.json:/app/gcp-sa-key.json vertex-proxy
```

## How It Works

1. Receives OpenAI-format requests from LibreChat
2. Generates OAuth2 access token from service account (with 55-minute caching)
3. Maps model name to appropriate Vertex AI endpoint
4. Forwards request with proper authentication
5. Streams or returns response to LibreChat

## Performance Optimizations

### Token Caching

The proxy implements intelligent token caching to reduce latency:

- **OAuth2 tokens are cached for 55 minutes** (GCP tokens expire after 1 hour)
- **First request:** Generates token (~100-150ms)
- **Subsequent requests:** Uses cached token (~instant)
- **Automatic refresh:** New token generated when cache expires
- **Monitoring:** Use `/token-status` endpoint to check cache status

**Benefit:** Reduces auth latency by 50-100ms per request after the first request.

**Example:**
```bash
# Check token cache status
curl http://localhost:4000/token-status

# Response when cached:
{
  "cached": true,
  "expires_in_seconds": 2847,
  "expires_in_minutes": 47.5
}

# Response when not cached:
{
  "cached": false,
  "message": "No cached token or token expired"
}
```

## Troubleshooting

**Token errors**: Verify service account has `roles/aiplatform.user` permission

**Connection errors**: Check firewall and network connectivity to `*.googleapis.com`

**Model not found**: Ensure the model is enabled in your GCP project's Model Garden

## License

Part of LibreChat - see main repository for license information.
