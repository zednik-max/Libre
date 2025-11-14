# LibreChat + GCP Vertex AI Integration Guide (Windows 11)

**Complete step-by-step guide for integrating Google Cloud Platform Vertex AI Model Garden with LibreChat on Windows 11**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [GCP Service Account Setup](#gcp-service-account-setup)
4. [File Setup](#file-setup)
5. [Configuration](#configuration)
6. [Deployment](#deployment)
7. [Verification & Testing](#verification--testing)
8. [Troubleshooting](#troubleshooting)
9. [Available Models](#available-models)
10. [Performance Features](#performance-features)
11. [Adding New Partner Models](#adding-new-partner-models)
12. [Rebuilding the Docker Image](#rebuilding-the-docker-image)
13. [Maintenance](#maintenance)
14. [Security Best Practices](#security-best-practices)
15. [Cost Management](#cost-management)
16. [Support & Resources](#support--resources)

---

## Overview

This guide will help you integrate **8 premium AI models** from Google Cloud Platform's Vertex AI Model Garden into LibreChat:

- DeepSeek R1 (Reasoning)
- DeepSeek V3.1
- MiniMax M2
- Qwen3 235B Instruct
- Llama 3.3 70B
- Qwen3-Next Thinking
- Llama 4 Maverick
- Llama 4 Scout

**What you'll build:**
```
LibreChat → Custom OAuth2 Proxy → GCP Vertex AI → 8 Premium Models
```

---

## Prerequisites

### Software Requirements

✅ **Windows 11 Pro** (or Windows 10 Pro)
✅ **Docker Desktop** installed and running
✅ **PowerShell** (comes with Windows)
✅ **GCP Account** with billing enabled
✅ **LibreChat** cloned locally

### GCP Requirements

✅ **Active GCP Project** with Vertex AI API enabled
✅ **Model Garden models** enabled in your project
✅ **Service Account** with appropriate permissions

---

## GCP Service Account Setup

### Step 1: Enable Vertex AI API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (e.g., `vertex-ai-project-skorec`)
3. Navigate to **APIs & Services** → **Enable APIs and Services**
4. Search for **"Vertex AI API"** and click **Enable**

### Step 2: Enable Model Garden Models

1. Go to **Vertex AI** → **Model Garden**
2. Find and enable these models:
   - DeepSeek R1
   - DeepSeek V3.1
   - MiniMax M2
   - Qwen3 235B Instruct
   - Llama 3.3 70B
   - Qwen3-Next Thinking
   - Llama 4 (Maverick & Scout)

3. Click **Enable** on each model you want to use

### Step 3: Create Service Account

Open **Cloud Shell** or your local terminal with `gcloud` installed:

```bash
# Set your project ID
gcloud config set project vertex-ai-project-skorec

# Create service account
gcloud iam service-accounts create librechat-vertex-ai \
    --display-name="LibreChat Vertex AI Access" \
    --description="Service account for LibreChat to access Vertex AI models"

# Grant Vertex AI User role
gcloud projects add-iam-policy-binding vertex-ai-project-skorec \
    --member="serviceAccount:librechat-vertex-ai@vertex-ai-project-skorec.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"

# Create and download JSON key
gcloud iam service-accounts keys create librechat-vertex-sa-key.json \
    --iam-account=librechat-vertex-ai@vertex-ai-project-skorec.iam.gserviceaccount.com
```

**Download the JSON file** to your computer.

---

## File Setup

### Step 1: Directory Structure

Your LibreChat directory should have:

```
LibreChat/
├── .env
├── docker-compose.windows.yml          ← New file
├── librechat.yaml                      ← Update this
├── gcp-sa-key.json                     ← Your service account key
└── vertex-proxy/                       ← New directory
    ├── app.py
    ├── requirements.txt
    ├── Dockerfile
    └── README.md
```

### Step 2: Create vertex-proxy Directory

Open **PowerShell** in your LibreChat directory:

```powershell
# Create the directory
New-Item -ItemType Directory -Force -Path vertex-proxy
```

### Step 3: Copy Files

Copy these files from the repository:

1. **vertex-proxy/app.py** - The OAuth2 proxy application
2. **vertex-proxy/requirements.txt** - Python dependencies
3. **vertex-proxy/Dockerfile** - Docker build configuration
4. **docker-compose.windows.yml** - Windows-optimized Docker Compose
5. **librechat.vertex-ai.yaml** - Example LibreChat configuration

### Step 4: Place Service Account Key

1. Rename your downloaded service account JSON to `gcp-sa-key.json`
2. Place it in the LibreChat root directory
3. **IMPORTANT**: Add to `.gitignore`:

```bash
# Add to .gitignore
gcp-sa-key.json
.env
```

---

## Configuration

### Step 1: Update Project ID

Edit `vertex-proxy/app.py` and update line 11:

```python
# Change this line:
PROJECT_ID = "vertex-ai-project-skorec"

# To your actual project ID:
PROJECT_ID = "your-actual-project-id"
```

### Step 2: Configure Environment Variables

Create or update `.env` file:

```bash
# GCP Service Account Authentication
GOOGLE_SERVICE_KEY_FILE=/app/gcp-sa-key.json

# Optional: Comment these out on Windows to avoid warnings
# UID=
# GID=

# Your other API keys (if any)
# OPENAI_API_KEY=...
# ANTHROPIC_API_KEY=...
```

### Step 3: Update librechat.yaml

Copy the content from `librechat.vertex-ai.yaml` or add this section to your existing `librechat.yaml`:

```yaml
version: 1.2.1

cache: true

interface:
  # ... your existing interface config ...

endpoints:
  custom:
    # GCP Vertex AI Models via Custom OAuth2 Proxy
    - name: 'Vertex-AI'
      apiKey: 'dummy'
      baseURL: 'http://vertex-proxy:4000'

      models:
        default:
          - 'deepseek-r1'
          - 'deepseek-v3'
          - 'minimax-m2'
          - 'qwen3-235b'
          - 'llama-3.3-70b'
          - 'qwen3-thinking'
          - 'llama-4-maverick'
          - 'llama-4-scout'
        fetch: false

      titleConvo: true
      titleModel: 'deepseek-v3'
      modelDisplayLabel: 'GCP Vertex AI'

      dropParams: []
```

---

## Deployment

### Step 1: Stop Existing Containers (if running)

```powershell
docker-compose down
```

### Step 2: Start with Windows Configuration

```powershell
# Start all services using Windows-optimized compose file
docker-compose -f docker-compose.windows.yml up -d

# Wait for containers to start (30 seconds)
Start-Sleep -Seconds 30
```

### Step 3: Verify Containers Are Running

```powershell
# Check all containers
docker ps

# You should see:
# - LibreChat
# - vertex-proxy
# - chat-mongodb
# - chat-meilisearch
# - rag_api
# - vectordb
```

### Step 4: Check Logs

```powershell
# Check vertex-proxy logs
docker-compose -f docker-compose.windows.yml logs vertex-proxy

# Should see: "Uvicorn running on http://0.0.0.0:4000"

# Check LibreChat logs
docker-compose -f docker-compose.windows.yml logs api | Select-Object -Last 50

# Should see: "Server listening on all interfaces at port 3080"
```

---

## Verification & Testing

### Test 1: Proxy Health Check

```powershell
curl http://localhost:4000/health
```

**Expected output:**
```json
{"status":"healthy","models":["deepseek-r1","deepseek-v3","minimax-m2","qwen3-235b","llama-3.3-70b","qwen3-thinking","llama-4-maverick","llama-4-scout"]}
```

### Test 1.5: Token Cache Status

Check if OAuth2 token caching is working:

```powershell
curl http://localhost:4000/token-status
```

**Expected output (after first request):**
```json
{"cached":true,"expires_in_seconds":3295,"expires_in_minutes":54.9}
```

**Note:** The proxy caches OAuth2 tokens for 55 minutes to reduce latency by 50-100ms per request.

### Test 1.6: Retry Configuration

Check the exponential backoff retry settings:

```powershell
curl http://localhost:4000/retry-config
```

**Expected output:**
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

**Note:** The proxy uses exponential backoff to retry failed requests (2s → 5s → 12.5s → 31.25s) with jitter to prevent thundering herd.

### Test 2: Direct Proxy Test

```powershell
curl -X POST http://localhost:4000/v1/chat/completions `
  -H "Content-Type: application/json" `
  -d '{
    "model": "deepseek-v3",
    "messages": [{"role": "user", "content": "Say hello in one word"}],
    "stream": false
  }'
```

**Expected:** JSON response with completion

### Test 3: LibreChat UI Test

1. Open browser: `http://localhost:3080`
2. Login or create account
3. Click **model selector** dropdown (top of chat)
4. Look for **"Vertex-AI"** or **"GCP Vertex AI"** section
5. Select **deepseek-v3** (or any model)
6. Send message: `"Hello! Introduce yourself."`
7. **You should get a response!** ✅

---

## Troubleshooting

### Issue: "permission denied" errors in logs

**Solution:** The Windows-optimized compose file should prevent this. If it persists:

```powershell
# Remove logs volume
docker volume rm librechat_logs

# Restart
docker-compose -f docker-compose.windows.yml restart
```

### Issue: Proxy shows "401 Unauthorized"

**Causes:**
- Service account doesn't have `roles/aiplatform.user` permission
- Wrong project ID in `app.py`
- Service account key not mounted correctly

**Solution:**

```powershell
# Verify service account key is mounted
docker exec vertex-proxy ls -la /app/gcp-sa-key.json

# Check proxy logs for auth errors
docker-compose -f docker-compose.windows.yml logs vertex-proxy | Select-String "error"
```

### Issue: Models not appearing in UI

**Solutions:**

1. **Check config loaded:**
```powershell
docker-compose -f docker-compose.windows.yml logs api | Select-String "custom config"
```

2. **Verify librechat.yaml is mounted:**
```powershell
docker exec LibreChat ls -la /app/librechat.yaml
```

3. **Restart LibreChat:**
```powershell
docker-compose -f docker-compose.windows.yml restart api
```

### Issue: "Cannot send a request, as the client has been closed"

**Solution:** Make sure you're using the latest `vertex-proxy/app.py` with the streaming fix.

```powershell
# Copy the updated app.py if needed
docker cp vertex-proxy/app.py vertex-proxy:/app/app.py

# Restart proxy
docker-compose -f docker-compose.windows.yml restart vertex-proxy
```

### Issue: Docker build fails with credential errors

**Solution:** Use the pre-built container approach:

```powershell
# Start containers
docker-compose -f docker-compose.windows.yml up -d

# Copy code directly to running container
docker cp vertex-proxy/app.py vertex-proxy:/app/app.py

# Restart to load new code
docker-compose -f docker-compose.windows.yml restart vertex-proxy
```

### Issue: Can't use `tail` command

**PowerShell alternatives:**

```powershell
# Instead of: tail -n 50
# Use:
docker-compose -f docker-compose.windows.yml logs vertex-proxy | Select-Object -Last 50

# Instead of: tail -f
# Use:
docker-compose -f docker-compose.windows.yml logs -f vertex-proxy

# Instead of: grep "error"
# Use:
docker-compose -f docker-compose.windows.yml logs api | Select-String "error"
```

---

## Available Models

### DeepSeek R1
- **Type:** Reasoning model
- **Best for:** Complex problem-solving, multi-step reasoning
- **Region:** US Central

### DeepSeek V3.1
- **Type:** General purpose
- **Best for:** Balanced performance, general tasks
- **Region:** US West

### MiniMax M2
- **Type:** Creative specialist
- **Best for:** Creative writing, content generation
- **Region:** Global

### Qwen3 235B Instruct
- **Type:** Massive model (235B parameters)
- **Best for:** Complex tasks requiring deep understanding
- **Region:** US South

### Llama 3.3 70B
- **Type:** Meta's latest Llama 3 series
- **Best for:** General purpose, instruction following
- **Region:** US Central

### Qwen3-Next Thinking
- **Type:** Reasoning-enhanced
- **Best for:** Analytical tasks, problem decomposition
- **Region:** Global

### Llama 4 Maverick
- **Type:** Meta's latest (128e variant)
- **Best for:** Complex reasoning, detailed analysis, code generation
- **Region:** US East

### Llama 4 Scout
- **Type:** Meta's latest (16e variant)
- **Best for:** Quick responses, general chat, faster inference
- **Region:** US East

---

## Performance Features

### Model Pooling (Load Balancing & Failover)

The vertex-proxy supports **model pooling**, which allows you to configure multiple endpoints for the same model across different regions. This provides:

✅ **Load Balancing:** Distribute traffic across regions using weighted routing
✅ **Automatic Failover:** If one region fails, requests automatically go to backup regions
✅ **Lower Latency:** Route more traffic to regions closer to you
✅ **Better Availability:** System continues working even if one region is down

**Example:** The pre-configured `deepseek-v3` model uses pooling with two regions:
- **70% of traffic** → us-west2 (primary)
- **30% of traffic** → us-central1 (backup)

If us-west2 goes down, **100% of traffic automatically goes to us-central1**.

**Logs show which region was selected:**
```
Selected endpoint in region: us-west2
```

**During failover:**
```
Error from Vertex AI (us-west2): 503 - Service Unavailable
Failover attempt 1: trying region us-central1
Selected endpoint in region: us-central1
```

**To add pooling to other models,** edit `vertex-proxy/app.py`:

```python
"your-model": [
    {
        "url": "https://region1-aiplatform.googleapis.com/...",
        "model": "provider/model-id-maas",
        "region": "region1",
        "weight": 80  # Primary
    },
    {
        "url": "https://region2-aiplatform.googleapis.com/...",
        "model": "provider/model-id-maas",
        "region": "region2",
        "weight": 20  # Backup
    }
]
```

### Exponential Backoff Retries

The vertex-proxy implements **intelligent retry logic** with exponential backoff to handle transient failures gracefully:

✅ **Automatic Retries:** Failed requests are automatically retried up to 3 times
✅ **Exponential Delays:** Retry delays increase exponentially (2s → 5s → 12.5s)
✅ **Jitter:** Random variation (±20%) prevents synchronized retries (thundering herd)
✅ **Per-Endpoint:** Each regional endpoint gets full retry attempts
✅ **Configurable:** Easily adjust retry behavior in `app.py`

**Default Configuration:**
```python
RETRY_CONFIG = {
    "max_retries": 3,      # 3 retry attempts
    "base_delay": 2,       # Start with 2 seconds
    "multiplier": 2.5,     # Exponential increase
    "max_delay": 60,       # Cap at 60 seconds
    "jitter": True,        # Add ±20% randomness
}
```

**Example Retry Sequence:**
```
Request 1: Fails instantly
↓
Wait ~2.0s (±0.4s jitter)
Request 2: Fails
↓
Wait ~5.0s (±1.0s jitter)
Request 3: Fails
↓
Wait ~12.5s (±2.5s jitter)
Request 4: Succeeds! ✅
```

**Logs During Retries:**
```
Error from Vertex AI (us-west2): 503 - Service Unavailable
Retry attempt 1/3 for region us-west2
Waiting 2.1s before retry (exponential backoff)...
Error from Vertex AI (us-west2): 503 - Service Unavailable
Retry attempt 2/3 for region us-west2
Waiting 5.3s before retry (exponential backoff)...
Request succeeded after 3 total attempt(s)
```

**Benefits:**
- **Resilient:** Handles temporary network issues and API throttling
- **Efficient:** Gives failing services time to recover
- **Prevents overload:** Exponential delays prevent hammering failing endpoints

**To customize,** edit `RETRY_CONFIG` in `vertex-proxy/app.py`:
```python
# Example: More aggressive retries
RETRY_CONFIG = {
    "max_retries": 5,      # 5 retries instead of 3
    "base_delay": 1,       # Start with 1 second
    "multiplier": 2,       # Double each time
    "max_delay": 30,       # Max 30 seconds
    "jitter": True,
}
# Results in: 1s → 2s → 4s → 8s → 16s → 30s (capped)
```

---

## Adding New Partner Models

Want to add more models from Vertex AI Model Garden? Follow these steps:

### Step 1: Enable the Model in GCP

1. Go to **GCP Console** → **Vertex AI** → **Model Garden**
2. Search for the model you want to add (e.g., "Gemini 2.0 Flash")
3. Click on the model and click **Enable**
4. Note the following information:
   - **Model ID** (e.g., `google/gemini-2.0-flash-001-maas`)
   - **Region** where it's available (e.g., `us-central1`)
   - **Endpoint URL** format

### Step 2: Add Model to vertex-proxy

Edit `vertex-proxy/app.py` and add your new model to the `MODEL_ENDPOINTS` dictionary:

```python
MODEL_ENDPOINTS = {
    # ... existing models ...

    # Add your new model here
    "gemini-2-flash": {
        "url": f"https://us-central1-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/us-central1/endpoints/openapi/chat/completions",
        "model": "google/gemini-2.0-flash-001-maas"
    }
}
```

**Important fields:**
- **Key** (`"gemini-2-flash"`): Friendly name you'll use in LibreChat
- **url**: Vertex AI endpoint URL (region-specific)
- **model**: Actual model ID from Model Garden (must end with `-maas`)

**Region endpoints:**
- `us-central1`: `https://us-central1-aiplatform.googleapis.com/v1/...`
- `us-west2`: `https://us-west2-aiplatform.googleapis.com/v1/...`
- `us-east5`: `https://us-east5-aiplatform.googleapis.com/v1/...`
- `global`: `https://aiplatform.googleapis.com/v1/...`

### Step 3: Add Model to LibreChat Configuration

Edit `librechat.yaml` and add the new model to the models list:

```yaml
endpoints:
  custom:
    - name: 'Vertex-AI'
      apiKey: 'dummy'
      baseURL: 'http://vertex-proxy:4000'

      models:
        default:
          - 'deepseek-r1'
          - 'deepseek-v3'
          - 'minimax-m2'
          - 'qwen3-235b'
          - 'llama-3.3-70b'
          - 'qwen3-thinking'
          - 'llama-4-maverick'
          - 'llama-4-scout'
          - 'gemini-2-flash'  # ← Add your new model here
```

### Step 4: Rebuild and Restart

After adding the model, you need to rebuild the vertex-proxy Docker image:

```powershell
# Stop the vertex-proxy container
docker-compose -f docker-compose.windows.yml stop vertex-proxy

# Rebuild the vertex-proxy image
docker-compose -f docker-compose.windows.yml build vertex-proxy

# Start the vertex-proxy container
docker-compose -f docker-compose.windows.yml up -d vertex-proxy

# Verify the model is available
curl http://localhost:4000/health
```

### Step 5: Test Your New Model

1. Restart LibreChat to reload configuration:
   ```powershell
   docker-compose -f docker-compose.windows.yml restart api
   ```

2. Open LibreChat UI: `http://localhost:3080`

3. Select your new model from the dropdown

4. Send a test message

### Example: Adding Claude 3.5 Sonnet

If Claude 3.5 Sonnet becomes available in Vertex AI Model Garden:

**1. Edit `vertex-proxy/app.py`:**
```python
"claude-3.5-sonnet": {
    "url": f"https://us-east5-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/us-east5/endpoints/openapi/chat/completions",
    "model": "anthropic/claude-3-5-sonnet-20250514-maas"
}
```

**2. Edit `librechat.yaml`:**
```yaml
models:
  default:
    - 'claude-3.5-sonnet'  # Add to list
```

**3. Rebuild:**
```powershell
docker-compose -f docker-compose.windows.yml build vertex-proxy
docker-compose -f docker-compose.windows.yml up -d vertex-proxy
docker-compose -f docker-compose.windows.yml restart api
```

---

## Rebuilding the Docker Image

There are several scenarios where you might need to rebuild the vertex-proxy Docker image:

### When to Rebuild

✅ **You added a new model** to `MODEL_ENDPOINTS` in `app.py`
✅ **You modified the proxy logic** in `app.py`
✅ **You updated dependencies** in `requirements.txt`
✅ **You changed the project ID** in `app.py`
✅ **You want to apply bug fixes** or improvements

### Method 1: Full Rebuild (Recommended)

This method ensures a clean build with no cached layers:

```powershell
# Stop the vertex-proxy container
docker-compose -f docker-compose.windows.yml stop vertex-proxy

# Remove the existing image
docker rmi vertex-proxy

# Rebuild from scratch (no cache)
docker-compose -f docker-compose.windows.yml build --no-cache vertex-proxy

# Start the new container
docker-compose -f docker-compose.windows.yml up -d vertex-proxy

# Verify it's running
docker ps | Select-String "vertex-proxy"

# Check logs
docker-compose -f docker-compose.windows.yml logs vertex-proxy
```

### Method 2: Quick Rebuild (Faster)

This method uses Docker's layer caching for faster rebuilds:

```powershell
# Rebuild with cache
docker-compose -f docker-compose.windows.yml build vertex-proxy

# Restart the container
docker-compose -f docker-compose.windows.yml up -d vertex-proxy
```

### Method 3: Hot Reload (Development Only)

For quick testing without rebuilding, you can copy the updated file directly into the running container:

```powershell
# Edit app.py, then:
docker cp vertex-proxy/app.py vertex-proxy:/app/app.py

# Restart the container to reload
docker-compose -f docker-compose.windows.yml restart vertex-proxy

# Watch logs to verify it loaded
docker-compose -f docker-compose.windows.yml logs -f vertex-proxy
```

**Warning:** This method is only for testing. Always do a proper rebuild for production.

### Method 4: Automated Rebuild Script

Create a PowerShell script for one-command rebuilds:

**rebuild-vertex-proxy.ps1:**
```powershell
# Vertex Proxy Rebuild Script
Write-Host "🔧 Stopping vertex-proxy..." -ForegroundColor Yellow
docker-compose -f docker-compose.windows.yml stop vertex-proxy

Write-Host "🗑️  Removing old image..." -ForegroundColor Yellow
docker rmi vertex-proxy -f

Write-Host "🔨 Building new image (no cache)..." -ForegroundColor Cyan
docker-compose -f docker-compose.windows.yml build --no-cache vertex-proxy

Write-Host "🚀 Starting vertex-proxy..." -ForegroundColor Green
docker-compose -f docker-compose.windows.yml up -d vertex-proxy

Write-Host "⏳ Waiting 5 seconds for startup..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "✅ Testing health endpoint..." -ForegroundColor Green
curl http://localhost:4000/health

Write-Host "📋 Recent logs:" -ForegroundColor Cyan
docker-compose -f docker-compose.windows.yml logs vertex-proxy | Select-Object -Last 20

Write-Host "`n✨ Rebuild complete!" -ForegroundColor Green
```

**Usage:**
```powershell
# Make script executable (first time only)
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

# Run the script
.\rebuild-vertex-proxy.ps1
```

### Verifying the Rebuild

After rebuilding, always verify the changes took effect:

**1. Check image build date:**
```powershell
docker images | Select-String "vertex-proxy"
```

**2. Verify container is running:**
```powershell
docker ps | Select-String "vertex-proxy"
```

**3. Test health endpoint:**
```powershell
curl http://localhost:4000/health
```

**Expected output:**
```json
{
  "status": "healthy",
  "models": ["deepseek-r1", "deepseek-v3", "minimax-m2", "qwen3-235b", "llama-3.3-70b", "qwen3-thinking", "llama-4-maverick", "llama-4-scout", "your-new-model"]
}
```

**4. Check logs for errors:**
```powershell
docker-compose -f docker-compose.windows.yml logs vertex-proxy | Select-Object -Last 50
```

**5. Test with a real request:**
```powershell
curl -X POST http://localhost:4000/v1/chat/completions `
  -H "Content-Type: application/json" `
  -d '{
    "model": "your-new-model",
    "messages": [{"role": "user", "content": "Test"}],
    "stream": false
  }'
```

### Troubleshooting Rebuild Issues

**Issue: Build fails with "no such file or directory"**

**Solution:** Ensure you're in the LibreChat root directory and `vertex-proxy/` exists:
```powershell
# Check current directory
Get-Location

# List vertex-proxy files
Get-ChildItem vertex-proxy
```

**Issue: Old code still running after rebuild**

**Solution:** Force remove the container and image:
```powershell
docker-compose -f docker-compose.windows.yml down vertex-proxy
docker rmi vertex-proxy -f
docker-compose -f docker-compose.windows.yml build --no-cache vertex-proxy
docker-compose -f docker-compose.windows.yml up -d vertex-proxy
```

**Issue: Port 4000 already in use**

**Solution:** Stop the existing container first:
```powershell
# Find process using port 4000
Get-NetTCPConnection -LocalPort 4000

# Stop vertex-proxy
docker-compose -f docker-compose.windows.yml stop vertex-proxy

# Or kill the process
Stop-Process -Id <PID>
```

**Issue: Python dependencies fail to install**

**Solution:** Check `requirements.txt` for typos and rebuild:
```powershell
# Validate requirements.txt
Get-Content vertex-proxy/requirements.txt

# Rebuild with verbose output
docker-compose -f docker-compose.windows.yml build --no-cache --progress=plain vertex-proxy
```

### Best Practices

1. **Always test locally** before deploying to production
2. **Document your changes** in comments within `app.py`
3. **Keep backups** of working configurations
4. **Use version control** (git) to track changes
5. **Test with the health endpoint** after every rebuild
6. **Monitor logs** for errors after deployment
7. **Update documentation** when adding new models

---

## Maintenance

### Restart All Services

```powershell
docker-compose -f docker-compose.windows.yml restart
```

### Stop All Services

```powershell
docker-compose -f docker-compose.windows.yml down
```

### View Logs

```powershell
# Proxy logs
docker-compose -f docker-compose.windows.yml logs -f vertex-proxy

# LibreChat logs
docker-compose -f docker-compose.windows.yml logs -f api

# All logs
docker-compose -f docker-compose.windows.yml logs -f
```

### Update Proxy Code

```powershell
# Edit app.py, then:
docker cp vertex-proxy/app.py vertex-proxy:/app/app.py
docker-compose -f docker-compose.windows.yml restart vertex-proxy
```

---

## Security Best Practices

1. **Never commit** `gcp-sa-key.json` to git
2. **Add to .gitignore**:
   ```
   gcp-sa-key.json
   .env
   ```

3. **Rotate service account keys** periodically in GCP Console

4. **Use least privilege** - only grant `roles/aiplatform.user` role

5. **Monitor usage** in GCP Console to detect unauthorized access

---

## Cost Management

- Check costs in **GCP Console** → **Billing**
- Set up **budget alerts** to avoid surprises
- Each model has different pricing - check Vertex AI pricing page
- Models are billed **per token** (input + output)

---

## Support & Resources

- **LibreChat Documentation:** https://docs.librechat.ai/
- **GCP Vertex AI Docs:** https://cloud.google.com/vertex-ai/docs
- **Model Garden:** https://cloud.google.com/model-garden
- **LibreChat GitHub:** https://github.com/danny-avila/LibreChat
- **LibreChat Discord:** https://discord.librechat.ai

---

## Summary

You've successfully integrated 8 premium AI models from GCP Vertex AI into LibreChat! 🎉

**What you accomplished:**
- ✅ Created custom OAuth2 proxy for GCP authentication
- ✅ Configured Windows-optimized Docker setup
- ✅ Integrated 8 cutting-edge AI models
- ✅ Set up automatic token refresh
- ✅ Enabled streaming responses

**Enjoy your new AI models!** 🚀
