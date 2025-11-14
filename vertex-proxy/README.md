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
- `GET /retry-config` - View retry configuration and exponential backoff settings
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

### Model Pooling (Load Balancing & Failover)

The proxy supports multiple endpoints per model for improved availability and performance:

- **Weighted load balancing:** Distribute traffic across regions based on weights
- **Automatic failover:** If one endpoint fails, automatically tries the next one
- **Lower latency:** Route to closer regions
- **Better availability:** Continue working even if one region is down

**Example Configuration:**

```python
"deepseek-v3": [
    {
        "url": "https://us-west2-aiplatform.googleapis.com/...",
        "model": "deepseek-ai/deepseek-v3.1-maas",
        "region": "us-west2",
        "weight": 70  # Gets 70% of traffic
    },
    {
        "url": "https://us-central1-aiplatform.googleapis.com/...",
        "model": "deepseek-ai/deepseek-v3.1-maas",
        "region": "us-central1",
        "weight": 30  # Gets 30% of traffic
    }
]
```

**Benefits:**
- **Load distribution:** 70% of requests go to us-west2, 30% to us-central1
- **Automatic failover:** If us-west2 is down, all requests automatically go to us-central1
- **Geographic optimization:** Route more traffic to your closest region

**Backward Compatible:** Single endpoints still work exactly as before:
```python
"deepseek-r1": {
    "url": "https://...",
    "model": "deepseek-ai/deepseek-r1-0528-maas"
}
```

### Exponential Backoff Retries

The proxy implements intelligent retry logic with exponential backoff to handle transient failures:

- **Configurable retries:** Default 3 retry attempts per endpoint
- **Exponential delays:** Delays increase exponentially (2s → 5s → 12.5s → 31.25s)
- **Jitter:** Random ±20% variation prevents thundering herd
- **Per-endpoint retries:** Each regional endpoint gets full retry attempts
- **Maximum delay cap:** Configurable maximum delay (default: 60s)

**Configuration in app.py:**
```python
RETRY_CONFIG = {
    "max_retries": 3,          # Number of retry attempts
    "base_delay": 2,           # Base delay in seconds
    "multiplier": 2.5,         # Exponential multiplier
    "max_delay": 60,           # Maximum delay cap
    "jitter": True,            # Enable jitter
    "jitter_factor": 0.2       # ±20% variation
}
```

**Formula:**
```
delay = min(base_delay * (multiplier^attempt), max_delay) ± jitter
```

**Example Delays (with base=2, multiplier=2.5):**
- Attempt 1: ~2.0s (±0.4s)
- Attempt 2: ~5.0s (±1.0s)
- Attempt 3: ~12.5s (±2.5s)
- Attempt 4: ~31.25s (±6.25s)

**Check Configuration:**
```bash
curl http://localhost:4000/retry-config
```

**Response:**
```json
{
  "config": {
    "max_retries": 3,
    "base_delay": 2,
    "multiplier": 2.5,
    "max_delay": 60,
    "jitter": true,
    "jitter_factor": 0.2
  },
  "example_delays": [
    {"attempt": 0, "delay_seconds": 1.92, "description": "First retry"},
    {"attempt": 1, "delay_seconds": 5.24, "description": "Retry 2"},
    {"attempt": 2, "delay_seconds": 11.87, "description": "Retry 3"}
  ],
  "formula": "delay = min(2 * (2.5^attempt), 60)",
  "jitter_info": "±20% random variation"
}
```

**Benefits:**
- **Handles transient failures:** Network blips, temporary unavailability
- **Prevents overwhelming servers:** Exponential delays give services time to recover
- **Avoids thundering herd:** Jitter prevents synchronized retries
- **Configurable:** Adjust retry behavior per your needs

## Troubleshooting

**Token errors**: Verify service account has `roles/aiplatform.user` permission

**Connection errors**: Check firewall and network connectivity to `*.googleapis.com`

**Model not found**: Ensure the model is enabled in your GCP project's Model Garden

## License

Part of LibreChat - see main repository for license information.
