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
