# Testing Guide - Vertex AI Proxy Features

**Version**: 1.0
**Date**: 2025-11-14
**Features to Test**: Token Caching, Model Pooling, Exponential Backoff Retries

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Test Environment Setup](#test-environment-setup)
3. [Test 1: Token Caching](#test-1-token-caching)
4. [Test 2: Model Pooling & Load Balancing](#test-2-model-pooling--load-balancing)
5. [Test 3: Exponential Backoff Retries](#test-3-exponential-backoff-retries)
6. [Test 4: Integration Testing](#test-4-integration-testing)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

✅ **Required**:
- Docker Desktop installed and running
- GCP service account JSON key with Vertex AI permissions
- PowerShell (Windows) or Bash (Linux/Mac)
- `curl` or Postman for API testing
- Text editor for viewing logs

✅ **Verify Before Testing**:
```powershell
# Check Docker is running
docker --version
docker ps

# Verify service account file exists
Test-Path "C:\path\to\your\service-account-key.json"
```

---

## Test Environment Setup

### Step 1: Rebuild the Docker Image

```powershell
# Navigate to vertex-proxy directory
cd C:\path\to\Libre\vertex-proxy

# Build the image
docker build -t vertex-proxy:latest .

# Verify build
docker images | Select-String vertex-proxy
```

**Expected Output**:
```
vertex-proxy   latest   abc123def456   Just now   150MB
```

### Step 2: Stop Existing Container (if running)

```powershell
# Stop and remove old container
docker stop vertex-proxy
docker rm vertex-proxy
```

### Step 3: Start Fresh Container

```powershell
# Run with volume mount for service account
docker run -d `
  --name vertex-proxy `
  -p 8080:8080 `
  -v "C:\path\to\your\service-account-key.json:/app/service-account-key.json" `
  -e GOOGLE_APPLICATION_CREDENTIALS=/app/service-account-key.json `
  vertex-proxy:latest

# Verify container is running
docker ps | Select-String vertex-proxy
```

**Expected Output**:
```
CONTAINER ID   IMAGE                  STATUS         PORTS
abc123def456   vertex-proxy:latest    Up 5 seconds   0.0.0.0:8080->8080/tcp
```

### Step 4: Check Container Logs

```powershell
# View startup logs
docker logs vertex-proxy

# Follow logs in real-time (for testing)
docker logs -f vertex-proxy
```

**Expected Startup Logs**:
```
INFO:     Started server process [1]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8080
```

---

## Test 1: Token Caching

**Purpose**: Verify OAuth2 tokens are cached and reused for 55 minutes.

### Test 1.1: Check Token Status (Empty Cache)

```powershell
# Check initial token status
curl http://localhost:8080/token-status
```

**Expected Response** (fresh start):
```json
{
  "cached_tokens": 0,
  "tokens": {}
}
```

### Test 1.2: Trigger Token Generation

```powershell
# Make a chat completion request
curl http://localhost:8080/v1/chat/completions `
  -H "Content-Type: application/json" `
  -d '{
    "model": "deepseek-v3",
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 10
  }'
```

**Watch Container Logs**:
```
🔑 Generating new OAuth2 token for region: us-central1 (expires in 3600s, cached for 3300s)
🎯 Using deepseek-v3 [us-central1] (70.0% weight) - Attempt 1/4
✓ Request successful (200)
```

### Test 1.3: Verify Token is Cached

```powershell
# Check token status again
curl http://localhost:8080/token-status
```

**Expected Response** (with cached token):
```json
{
  "cached_tokens": 1,
  "tokens": {
    "us-central1": {
      "expires_at": "2025-11-14T12:34:56.789Z",
      "expires_in_seconds": 3285,
      "is_valid": true
    }
  }
}
```

### Test 1.4: Verify Token Reuse

```powershell
# Make another request immediately
curl http://localhost:8080/v1/chat/completions `
  -H "Content-Type: application/json" `
  -d '{
    "model": "deepseek-v3",
    "messages": [{"role": "user", "content": "Hi again!"}],
    "max_tokens": 10
  }'
```

**Watch Container Logs**:
```
✓ Using cached OAuth2 token for region: us-central1 (valid for 3280s)
🎯 Using deepseek-v3 [us-central1] (70.0% weight) - Attempt 1/4
✓ Request successful (200)
```

**✅ Success Criteria**:
- First request generates new token
- Second request uses cached token (no "Generating new" message)
- Token status shows valid cached token
- Response time improves on subsequent requests (~50-100ms faster)

---

## Test 2: Model Pooling & Load Balancing

**Purpose**: Verify weighted load balancing distributes requests across regions.

### Test 2.1: Check Pool Configuration

```powershell
# Make a request to verify pooling is active
curl http://localhost:8080/v1/chat/completions `
  -H "Content-Type: application/json" `
  -d '{
    "model": "deepseek-v3",
    "messages": [{"role": "user", "content": "Test"}],
    "max_tokens": 5
  }'
```

**Watch Container Logs for Region Selection**:
```
🎯 Using deepseek-v3 [us-central1] (70.0% weight) - Attempt 1/4
```
or
```
🎯 Using deepseek-v3 [europe-west4] (30.0% weight) - Attempt 1/4
```

### Test 2.2: Statistical Load Distribution Test

**Run Multiple Requests** (PowerShell script):

```powershell
# Test load distribution with 20 requests
$regions = @{}
1..20 | ForEach-Object {
    Write-Host "Request $_..."

    $response = docker logs vertex-proxy --tail 5 2>&1 | Select-String "Using deepseek-v3"

    curl -s http://localhost:8080/v1/chat/completions `
      -H "Content-Type: application/json" `
      -d '{
        "model": "deepseek-v3",
        "messages": [{"role": "user", "content": "Test"}],
        "max_tokens": 5
      }' | Out-Null

    Start-Sleep -Milliseconds 500
}

# Count region distribution from logs
docker logs vertex-proxy 2>&1 | Select-String "Using deepseek-v3" | ForEach-Object {
    if ($_ -match '\[(.*?)\]') {
        $region = $matches[1]
        if ($regions.ContainsKey($region)) {
            $regions[$region]++
        } else {
            $regions[$region] = 1
        }
    }
}

# Display results
Write-Host "`nRegion Distribution:"
$regions.GetEnumerator() | Sort-Object Name | ForEach-Object {
    $percentage = ($_.Value / ($regions.Values | Measure-Object -Sum).Sum * 100)
    Write-Host "$($_.Key): $($_.Value) requests ($([math]::Round($percentage, 1))%)"
}
```

**Expected Distribution** (approximate):
```
Region Distribution:
us-central1: 14 requests (70.0%)
europe-west4: 6 requests (30.0%)
```

**✅ Success Criteria**:
- Requests distributed across both regions
- Rough approximation of 70/30 split (±10% variance is normal)
- No errors in logs

### Test 2.3: Failover Testing

**Simulate Region Failure** by using invalid endpoint:

1. **Temporarily modify `app.py`** to add a fake bad region:

```python
# Add this to POOLED_MODELS for testing
"deepseek-v3": [
    {
        "region": "us-central1",
        "publisher": "deepseek-ai",
        "weight": 70
    },
    {
        "region": "invalid-region-999",  # Will fail
        "publisher": "deepseek-ai",
        "weight": 30
    }
]
```

2. **Rebuild and restart**:

```powershell
docker build -t vertex-proxy:latest .
docker stop vertex-proxy
docker rm vertex-proxy
docker run -d --name vertex-proxy -p 8080:8080 `
  -v "C:\path\to\service-account-key.json:/app/service-account-key.json" `
  -e GOOGLE_APPLICATION_CREDENTIALS=/app/service-account-key.json `
  vertex-proxy:latest
```

3. **Make request**:

```powershell
curl http://localhost:8080/v1/chat/completions `
  -H "Content-Type: application/json" `
  -d '{
    "model": "deepseek-v3",
    "messages": [{"role": "user", "content": "Test failover"}],
    "max_tokens": 10
  }'
```

**Watch Container Logs**:
```
🎯 Using deepseek-v3 [invalid-region-999] (30.0% weight) - Attempt 1/4
⚠ Attempt 1 failed (HTTP 404): Endpoint not found
Waiting 1.8s before retry...
⚠ Attempt 2 failed (HTTP 404): Endpoint not found
Waiting 4.7s before retry...
⚠ Attempt 3 failed (HTTP 404): Endpoint not found
Waiting 11.9s before retry...
⚠ All retries exhausted for invalid-region-999
🔄 Trying next endpoint: us-central1
🎯 Using deepseek-v3 [us-central1] (70.0% weight) - Attempt 1/4
✓ Request successful (200)
```

**✅ Success Criteria**:
- Failed region retries with exponential backoff
- Automatic failover to next endpoint
- Request succeeds on fallback region
- User receives response without error

4. **Restore original configuration** and rebuild.

---

## Test 3: Exponential Backoff Retries

**Purpose**: Verify retry logic with exponential delays on transient failures.

### Test 3.1: Check Retry Configuration

```powershell
# View current retry settings
curl http://localhost:8080/retry-config
```

**Expected Response**:
```json
{
  "max_retries": 3,
  "base_delay": 2,
  "multiplier": 2.5,
  "max_delay": 60,
  "jitter": true,
  "jitter_factor": 0.2,
  "description": "Exponential backoff: delay = min(base_delay * (multiplier^attempt), max_delay) ± jitter"
}
```

### Test 3.2: Simulate Transient Failure

**Option A: Temporarily Disable Network** (simulates timeout):

1. **Modify `app.py`** to add artificial failure:

```python
# In chat_completions function, before making the request:
if retry_attempt < 2:  # Fail first 2 attempts
    raise Exception("Simulated transient error")
```

2. **Rebuild and test**:

```powershell
docker build -t vertex-proxy:latest .
docker stop vertex-proxy && docker rm vertex-proxy
docker run -d --name vertex-proxy -p 8080:8080 `
  -v "C:\path\to\service-account-key.json:/app/service-account-key.json" `
  -e GOOGLE_APPLICATION_CREDENTIALS=/app/service-account-key.json `
  vertex-proxy:latest

curl http://localhost:8080/v1/chat/completions `
  -H "Content-Type: application/json" `
  -d '{
    "model": "deepseek-v3",
    "messages": [{"role": "user", "content": "Test retries"}],
    "max_tokens": 10
  }'
```

**Watch Container Logs**:
```
🎯 Using deepseek-v3 [us-central1] (70.0% weight) - Attempt 1/4
⚠ Attempt 1 failed: Simulated transient error
Waiting 1.9s before retry...
⚠ Attempt 2 failed: Simulated transient error
Waiting 5.2s before retry...
🎯 Using deepseek-v3 [us-central1] (70.0% weight) - Attempt 3/4
✓ Request successful (200)
```

**✅ Success Criteria**:
- First attempts fail as expected
- Delays increase exponentially (~2s, ~5s, ~12s)
- Jitter adds variation (±20%)
- Request eventually succeeds on retry
- Total delay matches exponential formula

**Option B: Test with Invalid Model** (will retry then fail):

```powershell
curl http://localhost:8080/v1/chat/completions `
  -H "Content-Type: application/json" `
  -d '{
    "model": "nonexistent-model-xyz",
    "messages": [{"role": "user", "content": "Test"}],
    "max_tokens": 10
  }'
```

**Expected Logs**:
```
🎯 Using nonexistent-model-xyz [us-central1] - Attempt 1/4
⚠ Attempt 1 failed (HTTP 404): Model not found
Waiting 2.1s before retry...
⚠ Attempt 2 failed (HTTP 404): Model not found
Waiting 4.8s before retry...
⚠ Attempt 3 failed (HTTP 404): Model not found
Waiting 12.7s before retry...
⚠ Attempt 4 failed (HTTP 404): Model not found
⚠ All retries exhausted for us-central1
❌ All endpoints failed after retries
```

**Expected Response**:
```json
{
  "error": {
    "message": "All endpoints failed: Model not found",
    "type": "model_not_found",
    "code": 404
  }
}
```

### Test 3.3: Measure Retry Delays

**PowerShell Script** to measure actual delays:

```powershell
# Clear logs
docker logs vertex-proxy 2>&1 | Out-Null

# Make request that will trigger retries
$startTime = Get-Date
curl http://localhost:8080/v1/chat/completions `
  -H "Content-Type: application/json" `
  -d '{
    "model": "nonexistent-model-xyz",
    "messages": [{"role": "user", "content": "Test"}],
    "max_tokens": 10
  }' | Out-Null
$endTime = Get-Date

# Calculate total time
$totalSeconds = ($endTime - $startTime).TotalSeconds
Write-Host "Total retry sequence: $([math]::Round($totalSeconds, 1))s"

# Expected: ~2s + ~5s + ~12.5s = ~19.5s (±20% jitter)
```

**Expected Total Time**: 19-24 seconds (with jitter variation)

**✅ Success Criteria**:
- Delays follow exponential pattern
- Jitter adds ±20% variation to each delay
- Total time matches sum of calculated delays
- Logs show exact delay before each retry

---

## Test 4: Integration Testing

**Purpose**: Test all features working together in realistic scenarios.

### Test 4.1: Load Test with Pooling + Caching

**PowerShell Script**:

```powershell
Write-Host "Starting integration test: 50 requests across pooled endpoints"
$startTime = Get-Date

1..50 | ForEach-Object {
    Write-Host "Request $_ ..." -NoNewline

    $response = curl -s http://localhost:8080/v1/chat/completions `
      -H "Content-Type: application/json" `
      -d '{
        "model": "deepseek-v3",
        "messages": [{"role": "user", "content": "Hello"}],
        "max_tokens": 5
      }'

    if ($response -match '"choices"') {
        Write-Host " ✓" -ForegroundColor Green
    } else {
        Write-Host " ✗" -ForegroundColor Red
    }

    Start-Sleep -Milliseconds 200
}

$endTime = Get-Date
$totalTime = ($endTime - $startTime).TotalSeconds
Write-Host "`nCompleted in $([math]::Round($totalTime, 1))s"
Write-Host "Average: $([math]::Round($totalTime/50, 2))s per request"
```

**Expected Behavior**:
- All 50 requests succeed
- Token generated once at start, then cached
- Requests distributed ~70/30 across regions
- Average response time: 1-3 seconds per request
- No authentication errors (token caching works)

### Test 4.2: Monitor Token Cache During Load Test

**In separate PowerShell window**:

```powershell
while ($true) {
    Clear-Host
    Write-Host "=== Token Cache Status ===" -ForegroundColor Cyan
    curl -s http://localhost:8080/token-status | ConvertFrom-Json | ConvertTo-Json -Depth 10
    Start-Sleep -Seconds 3
}
```

**Expected Observation**:
- Single token cached for primary region
- Token remains valid throughout test
- `expires_in_seconds` decreases over time
- No token regeneration during 50-request sequence

### Test 4.3: End-to-End Test from LibreChat

1. **Configure LibreChat** (`librechat.yaml`):

```yaml
endpoints:
  custom:
    - name: "Vertex AI (Deepseek)"
      apiKey: "dummy-key"
      baseURL: "http://localhost:8080/v1"
      models:
        default: ["deepseek-v3"]
      titleModel: "deepseek-v3"
```

2. **Start LibreChat**:

```powershell
cd C:\path\to\Libre
npm run backend:dev  # Terminal 1
npm run frontend:dev # Terminal 2
```

3. **Test from UI**:
   - Open http://localhost:3090
   - Select "Vertex AI (Deepseek)" endpoint
   - Send message: "Hello, test pooling and retries"
   - Observe response

4. **Monitor vertex-proxy logs**:

```powershell
docker logs -f vertex-proxy
```

**Expected Logs**:
```
✓ Using cached OAuth2 token for region: us-central1 (valid for 3145s)
🎯 Using deepseek-v3 [us-central1] (70.0% weight) - Attempt 1/4
✓ Request successful (200)
```

**✅ Success Criteria**:
- Message sent successfully
- Response streams back to UI
- Logs show token caching + pooling
- No errors in vertex-proxy or LibreChat logs

---

## Troubleshooting

### Issue: "Token cache always shows 0 tokens"

**Cause**: Container restarted or no requests made yet

**Solution**:
```powershell
# Make a test request to populate cache
curl http://localhost:8080/v1/chat/completions `
  -H "Content-Type: application/json" `
  -d '{"model":"deepseek-v3","messages":[{"role":"user","content":"Hi"}],"max_tokens":5}'

# Check again
curl http://localhost:8080/token-status
```

### Issue: "All requests go to same region"

**Cause**: Weighted random selection may cluster in small samples

**Solution**:
- Increase test sample size (50+ requests)
- Check `POOLED_MODELS` configuration in `app.py`
- Verify weights add up correctly

### Issue: "Retries don't show exponential delays"

**Cause**: May need to trigger actual failures

**Solution**:
```powershell
# Use invalid model to force retries
curl http://localhost:8080/v1/chat/completions `
  -H "Content-Type: application/json" `
  -d '{"model":"invalid-model","messages":[{"role":"user","content":"Test"}],"max_tokens":5}'

# Watch logs carefully
docker logs -f vertex-proxy
```

### Issue: "Container won't start"

**Diagnostic Steps**:

```powershell
# Check container logs
docker logs vertex-proxy

# Common issues:
# 1. Service account file not found
docker run -d --name vertex-proxy -p 8080:8080 `
  -v "C:\full\path\to\service-account-key.json:/app/service-account-key.json" `
  -e GOOGLE_APPLICATION_CREDENTIALS=/app/service-account-key.json `
  vertex-proxy:latest

# 2. Port already in use
netstat -ano | findstr :8080  # Find process using port
Stop-Process -Id <PID>        # Kill it

# 3. Docker out of resources
docker system prune -a
```

### Issue: "HTTP 403 Forbidden from Vertex AI"

**Cause**: Service account lacks permissions

**Solution**:
1. Verify service account has roles:
   - `Vertex AI User` (roles/aiplatform.user)
   - `Service Account Token Creator` (roles/iam.serviceAccountTokenCreator)

2. Test authentication:
```powershell
docker exec vertex-proxy python -c "
from google.auth import default
credentials, project = default()
print(f'Project: {project}')
print(f'Service Account: {credentials.service_account_email}')
"
```

### Issue: "Requests timing out"

**Diagnostic**:

```powershell
# Check network connectivity
docker exec vertex-proxy curl -I https://us-central1-aiplatform.googleapis.com

# Check firewall/proxy settings
# Vertex AI requires outbound HTTPS access

# Increase timeout in app.py if needed
timeout = aiohttp.ClientTimeout(total=60)  # Default is 30s
```

---

## Success Checklist

After completing all tests, verify:

- ✅ Token caching works (status shows cached tokens)
- ✅ Token reuse confirmed (logs show "Using cached" messages)
- ✅ Load balancing distributes requests (statistical distribution ~70/30)
- ✅ Failover works when region fails (falls back to next endpoint)
- ✅ Retries use exponential backoff (delays: ~2s, ~5s, ~12s, ~30s)
- ✅ Jitter adds variation (±20% visible in logs)
- ✅ Integration with LibreChat works end-to-end
- ✅ All monitoring endpoints return valid data
- ✅ No errors in logs during normal operation
- ✅ Performance improvement observed vs. before changes

---

## Performance Benchmarks

**Expected Improvements**:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Token generation per request | Every request | Once per 55min | 50-100ms saved |
| Single region failure | Request fails | Automatic failover | 100% → ~0% failure |
| Transient errors | Immediate failure | 3 retries + failover | ~90% recovery |
| Load distribution | Single endpoint | Weighted pooling | Better availability |

---

## Next Steps

After successful testing:

1. **Production Deployment**:
   - Update `docker-compose.yml` with new image
   - Configure production pooled endpoints
   - Set up monitoring/alerting

2. **Monitoring**:
   - Track token cache hit rate
   - Monitor region distribution
   - Alert on excessive retries

3. **Optimization**:
   - Tune retry delays based on observed patterns
   - Adjust pool weights based on regional latency
   - Configure per-model timeout values

---

**Testing Completed**: [Date]
**Tested By**: [Your Name]
**All Tests Passed**: ☐ Yes ☐ No
**Notes**: _____________________________________________
