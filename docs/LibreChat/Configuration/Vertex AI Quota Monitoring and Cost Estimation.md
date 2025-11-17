# Vertex AI Quota Monitoring and Cost Estimation

**Version**: 1.0
**Last Updated**: November 2025
**Target Audience**: LibreChat Administrators, DevOps Engineers, Developers
**Applies To**: Vertex AI and Google Gemini API integrations

---

## Table of Contents

1. [Introduction](#introduction)
2. [Overview](#overview)
3. [Vertex AI vs Gemini API Pricing](#vertex-ai-vs-gemini-api-pricing)
4. [Quota Monitoring System](#quota-monitoring-system)
5. [Cost Estimation](#cost-estimation)
6. [Configuration](#configuration)
7. [Usage Examples](#usage-examples)
8. [API Reference](#api-reference)
9. [Monitoring and Alerting](#monitoring-and-alerting)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)
12. [FAQ](#faq)

---

## Introduction

LibreChat now includes comprehensive quota monitoring and cost estimation for Google's Vertex AI and Gemini API. This feature helps administrators and users track usage, prevent quota exhaustion, and estimate costs in real-time.

### Why Is This Important?

**Quota Management**:
- Vertex AI has strict rate limits (Requests Per Minute, Tokens Per Minute)
- Exceeding quotas results in API errors and service disruptions
- Proactive monitoring prevents user-facing failures

**Cost Control**:
- Vertex AI pricing differs significantly from the free-tier Gemini API
- Real-time cost estimation enables budget tracking
- Differentiated pricing per model helps optimize costs

### Key Features

✅ **Automatic Quota Tracking**: RPM, TPM, RPD, TPD monitoring
✅ **Differentiated Pricing**: Vertex AI vs Gemini API pricing tables
✅ **Real-time Cost Estimation**: Per-request cost calculations
✅ **Proactive Warnings**: Alerts at 80% quota threshold (configurable)
✅ **Per-Project Tracking**: Separate monitoring per GCP project
✅ **Redis-Backed Caching**: Efficient storage with automatic TTL

---

## Overview

### Architecture

```
┌─────────────────┐
│   User Request  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  GoogleClient Instance  │
│  - recordTokenUsage()   │
│  - trackQuotaUsage()    │
│  - estimateCost()       │
└────────┬────────────────┘
         │
         ├──► Redis Cache (Quota Counters)
         │    ├── RPM: 1min TTL
         │    ├── TPM: 1min TTL
         │    ├── RPD: 24hr TTL
         │    └── TPD: 24hr TTL
         │
         └──► Transaction System (Cost Tracking)
              └── Differentiated Pricing
```

### Data Flow

1. **Request Execution**: User sends message to Vertex AI/Gemini API
2. **Token Usage Recording**: System captures input/output tokens
3. **Quota Tracking**: Updates Redis counters (RPM, TPM, RPD, TPD)
4. **Cost Calculation**: Applies correct pricing (Vertex AI or Gemini API)
5. **Transaction Creation**: Records cost against user balance
6. **Warning System**: Checks thresholds and logs warnings

---

## Vertex AI vs Gemini API Pricing

### Pricing Differences

LibreChat automatically detects whether you're using **Vertex AI** (GCP service account) or **Gemini API** (API key) and applies the correct pricing.

#### Gemini API (Free Tier)
- **Access**: Via API key
- **Pricing**: Free tier with generous quotas
- **Cost**: $0.50 input / $1.50 output per 1M tokens (generic estimate)
- **Use Case**: Development, testing, low-volume production

#### Vertex AI (GCP)
- **Access**: Via service account / project ID
- **Pricing**: Pay-per-use, varies by model
- **Cost**: See table below
- **Use Case**: Production, enterprise, high-volume

### Vertex AI Pricing Table

**Source**: [Google Cloud Vertex AI Pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing)

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Context Window |
|-------|----------------------|------------------------|----------------|
| **Gemini 2.5 Pro** | $1.25 | $10.00 | ≤200K tokens |
| **Gemini 2.5 Pro (Long)** | $2.50 | $15.00 | >200K tokens |
| **Gemini 2.5 Flash** | $0.30 | $2.50 | Standard |
| **Gemini 2.5 Flash Lite** | $0.10 | $0.40 | Standard |
| **Gemini 2.0 Flash** | $0.15 | $0.60 | Standard |
| **Gemini 2.0 Flash Lite** | $0.075 | $0.30 | Standard |
| **Gemini 1.5 Pro** | $1.25 | $5.00 | ≤200K tokens |
| **Gemini 1.5 Flash** | $0.075 | $0.30 | Standard |
| **Gemini 1.5 Flash 8B** | $0.0375 | $0.15 | Standard |

**Example Cost Calculation**:
```
Request: 10,000 input tokens + 5,000 output tokens
Model: Gemini 1.5 Pro (Vertex AI)

Input cost:  (10,000 / 1,000,000) × $1.25 = $0.0125
Output cost: (5,000 / 1,000,000) × $5.00 = $0.0250
Total cost:  $0.0375
```

**vs Gemini API (Free Tier)**:
```
Same request: 10,000 input + 5,000 output
Model: Gemini 1.5 Pro (Gemini API)

Cost: $0.00 (within free tier limits)
```

### How Pricing Is Applied

The system automatically prefixes model names for Vertex AI requests:

```javascript
// Gemini API (no project_id)
model: "gemini-1.5-pro"
→ Uses Gemini API pricing (free tier)

// Vertex AI (project_id present)
model: "gemini-1.5-pro"
→ Transformed to "vertex-gemini-1.5-pro"
→ Uses Vertex AI pricing ($1.25 / $5.00 per 1M tokens)
```

This happens automatically in `GoogleClient.recordTokenUsage()`.

---

## Quota Monitoring System

### Metrics Tracked

LibreChat tracks four key metrics for Vertex AI:

| Metric | Description | TTL | Cache Key Format |
|--------|-------------|-----|------------------|
| **RPM** | Requests Per Minute | 1 minute | `{project}:{model}` |
| **TPM** | Tokens Per Minute | 1 minute | `{project}:{model}` |
| **RPD** | Requests Per Day | 24 hours | `{project}:{model}:{YYYY-MM-DD}` |
| **TPD** | Tokens Per Day | 24 hours | `{project}:{model}:{YYYY-MM-DD}` |

### Default Vertex AI Quotas

**Note**: Actual quotas vary by project, region, and model. Check your GCP Console for exact limits.

| Model | RPM (Default) | TPM (Default) | RPD (Default) |
|-------|---------------|---------------|---------------|
| Gemini 1.5 Pro | 300 | 4,000,000 | No limit* |
| Gemini 1.5 Flash | 2,000 | 4,000,000 | No limit* |
| Gemini 2.0 Flash | 1,000 | 4,000,000 | No limit* |

*Daily quotas exist but are typically very high. Monitor your GCP Console.

### Redis Cache Structure

**RPM/TPM Cache (1 minute TTL)**:
```
Key:   "vertex-quota-rpm:{project-id}:gemini-1.5-pro"
Value: 45 (number of requests in current minute)

Key:   "vertex-quota-tpm:{project-id}:gemini-1.5-pro"
Value: 67500 (total tokens in current minute)
```

**RPD/TPD Cache (24 hour TTL)**:
```
Key:   "vertex-quota-rpd:{project-id}:gemini-1.5-pro:2025-11-17"
Value: 1250 (requests today)

Key:   "vertex-quota-tpd:{project-id}:gemini-1.5-pro:2025-11-17"
Value: 3500000 (tokens today)
```

### Automatic Tracking

Every Vertex AI request automatically updates quota counters:

```javascript
// Happens automatically in GoogleClient
await this.recordTokenUsage({
  promptTokens: 1000,
  completionTokens: 500,
  context: 'message'
});

// This internally calls:
await this.trackQuotaUsage({
  promptTokens: 1000,
  completionTokens: 500
});
```

### Warning Thresholds

By default, warnings are logged when usage exceeds **80%** of quota limits:

```javascript
// Check quota status
const status = await client.checkQuotaLimits({
  rpm: 1000,        // Your RPM limit
  tpm: 4000000,     // Your TPM limit
  threshold: 0.8    // 80% warning threshold
});

// If usage > 80%, warnings are logged:
// [GoogleClient] Vertex AI RPM quota at 85.5% (855/1000)
// [GoogleClient] Vertex AI TPM quota at 92.3% (3692000/4000000)
```

---

## Cost Estimation

### Real-Time Cost Calculation

Every request can estimate costs before or after execution:

```javascript
const client = new GoogleClient(credentials, options);

// Estimate cost for a planned request
const estimate = client.estimateCost({
  promptTokens: 10000,
  completionTokens: 5000,
  model: 'gemini-1.5-pro'  // Optional, defaults to client's model
});

console.log(estimate);
```

**Output**:
```json
{
  "promptTokens": 10000,
  "completionTokens": 5000,
  "totalTokens": 15000,
  "promptCost": 0.0125,
  "completionCost": 0.025,
  "totalCost": 0.0375,
  "currency": "USD",
  "model": "vertex-gemini-1.5-pro",
  "provider": "Vertex AI"
}
```

### Cost Tracking in Transactions

All costs are automatically recorded in the LibreChat transaction system:

```javascript
// User balance tracking
const transactions = await getTransactions({
  user: userId,
  conversationId: conversationId
});

// Each transaction includes:
{
  user: "user-id",
  conversationId: "conv-id",
  model: "vertex-gemini-1.5-pro",
  context: "message",
  tokenType: "prompt" | "completion",
  rawAmount: -1000,  // Negative = deduction
  rate: 1.25,        // Cost per 1M tokens
  tokenUsage: 1000,
  balance: 9850.50   // Remaining balance
}
```

### Cumulative Cost Queries

Query total spending by user, conversation, or model:

```javascript
// Example: Get total Vertex AI spend for a user
const userTransactions = await Transaction.find({
  user: userId,
  model: { $regex: /^vertex-/ }
});

const totalCost = userTransactions.reduce((sum, tx) => {
  return sum + (Math.abs(tx.rawAmount) / 1000000) * tx.rate;
}, 0);

console.log(`Total Vertex AI spend: $${totalCost.toFixed(4)}`);
```

---

## Configuration

### Environment Variables

**Required for Vertex AI**:
```bash
# Service account credentials (JSON)
GOOGLE_SERVICE_KEY=/path/to/service-account.json

# Or inline JSON
GOOGLE_SERVICE_KEY='{"type":"service_account","project_id":"my-project",...}'
```

**Optional Configuration**:
```bash
# Vertex AI region (default: us-central1)
GOOGLE_LOC=us-central1

# Options: us-central1, us-east1, us-west1, europe-west1, asia-northeast1, global
```

### librechat.yaml Configuration

Configure quota limits and warnings in your `librechat.yaml`:

```yaml
endpoints:
  google:
    # Vertex AI configuration
    vertexAI:
      enabled: true
      projectId: ${GOOGLE_PROJECT_ID}
      serviceKey: ${GOOGLE_SERVICE_KEY}
      location: us-central1

      # Quota limits (optional - defaults shown)
      quotaLimits:
        rpm: 1000           # Requests per minute
        tpm: 4000000        # Tokens per minute
        rpd: 1000000        # Requests per day (if limited)
        tpd: 100000000      # Tokens per day (if limited)

      # Warning threshold (0.0-1.0, default: 0.8 = 80%)
      quotaWarningThreshold: 0.8

      # Enable cost estimation logging
      logCostEstimates: true

    # Gemini API configuration (free tier)
    apiKey: ${GOOGLE_API_KEY}
```

**Note**: The `quotaLimits` section is for your reference and warning configuration. Actual quotas are enforced by Google Cloud.

### Redis Configuration

Ensure Redis is configured and running:

```yaml
# .env or docker-compose.yml
REDIS_URI=redis://localhost:6379
# Or for Docker
REDIS_URI=redis://redis:6379
```

LibreChat automatically creates the following cache stores:
- `VERTEX_QUOTA_RPM` (1 minute TTL)
- `VERTEX_QUOTA_TPM` (1 minute TTL)
- `VERTEX_QUOTA_RPD` (24 hour TTL)
- `VERTEX_QUOTA_TPD` (24 hour TTL)

---

## Usage Examples

### Example 1: Check Current Quota Usage

```javascript
const { GoogleClient } = require('~/app/clients');

// Initialize client with Vertex AI credentials
const client = new GoogleClient(credentials, {
  modelOptions: { model: 'gemini-1.5-pro' }
});

// Get current quota usage
const usage = await client.getQuotaUsage();

console.log('Vertex AI Quota Usage:');
console.log(`  Requests/Minute: ${usage.requestsPerMinute}`);
console.log(`  Tokens/Minute:   ${usage.tokensPerMinute}`);
console.log(`  Requests/Day:    ${usage.requestsPerDay}`);
console.log(`  Tokens/Day:      ${usage.tokensPerDay}`);
console.log(`  Project:         ${usage.project}`);
console.log(`  Model:           ${usage.model}`);
```

**Output**:
```
Vertex AI Quota Usage:
  Requests/Minute: 45
  Tokens/Minute:   67500
  Requests/Day:    1250
  Tokens/Day:      3500000
  Project:         my-gcp-project
  Model:           gemini-1.5-pro
```

### Example 2: Proactive Quota Checking

```javascript
// Before making a high-volume request batch
const status = await client.checkQuotaLimits({
  rpm: 1000,
  tpm: 4000000,
  threshold: 0.8  // Warn at 80%
});

if (status.rpm.approaching || status.tpm.approaching) {
  console.warn('WARNING: Approaching quota limits!');
  console.warn('RPM:', status.rpm);
  console.warn('TPM:', status.tpm);
  console.warn('Warnings:', status.warnings);

  // Implement backoff strategy
  await sleep(60000); // Wait 1 minute for quota reset
}

// Proceed with request
await client.sendMessage(message);
```

**Output** (when approaching limit):
```
WARNING: Approaching quota limits!
RPM: { current: 850, limit: 1000, percentage: 85.0, approaching: true }
TPM: { current: 3200000, limit: 4000000, percentage: 80.0, approaching: true }
Warnings: [
  '[GoogleClient] Vertex AI RPM quota at 85.0% (850/1000)',
  '[GoogleClient] Vertex AI TPM quota at 80.0% (3200000/4000000)'
]
```

### Example 3: Cost Estimation Before Request

```javascript
// Estimate cost before making request
const tokenEstimate = await client.getTokenCount(messageText);
const promptTokens = tokenEstimate;
const estimatedCompletionTokens = promptTokens * 0.5; // Rough estimate

const costEstimate = client.estimateCost({
  promptTokens: promptTokens,
  completionTokens: estimatedCompletionTokens
});

console.log('Estimated Cost:', costEstimate);

if (costEstimate.totalCost > 0.10) {
  console.warn('⚠️  High cost request: $' + costEstimate.totalCost.toFixed(4));
  // Implement approval workflow
  const approved = await requestApproval(costEstimate);
  if (!approved) {
    return { error: 'Request rejected due to high cost' };
  }
}

// Proceed with request
const response = await client.sendMessage(message);
```

### Example 4: Daily Cost Reporting

```javascript
const { getLogStores } = require('~/cache');
const { CacheKeys } = require('librechat-data-provider');

// Get today's token usage
const tpdCache = getLogStores(CacheKeys.VERTEX_QUOTA_TPD);
const projectId = 'my-gcp-project';
const model = 'gemini-1.5-pro';
const today = new Date().toISOString().split('T')[0];
const cacheKey = `${projectId}:${model}:${today}`;

const tokensToday = await tpdCache.get(cacheKey);

// Estimate daily cost
const estimatedDailyCost = (tokensToday / 1000000) * 1.25; // Using input rate as approximation

console.log(`Daily Usage Report (${today}):`);
console.log(`  Tokens Used: ${tokensToday.toLocaleString()}`);
console.log(`  Est. Cost:   $${estimatedDailyCost.toFixed(4)}`);
```

### Example 5: Multi-Model Cost Comparison

```javascript
const models = [
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-2.0-flash'
];

const promptTokens = 10000;
const completionTokens = 5000;

console.log('Cost Comparison for 10K input + 5K output tokens:\n');

models.forEach(model => {
  const client = new GoogleClient(credentials, {
    modelOptions: { model }
  });

  const cost = client.estimateCost({ promptTokens, completionTokens, model });

  console.log(`${model}:`);
  console.log(`  Input:  $${cost.promptCost.toFixed(6)}`);
  console.log(`  Output: $${cost.completionCost.toFixed(6)}`);
  console.log(`  Total:  $${cost.totalCost.toFixed(6)}\n`);
});
```

**Output**:
```
Cost Comparison for 10K input + 5K output tokens:

gemini-1.5-pro:
  Input:  $0.012500
  Output: $0.025000
  Total:  $0.037500

gemini-1.5-flash:
  Input:  $0.000750
  Output: $0.001500
  Total:  $0.002250

gemini-2.0-flash:
  Input:  $0.001500
  Output: $0.003000
  Total:  $0.004500
```

---

## API Reference

### GoogleClient Methods

#### `trackQuotaUsage({ promptTokens, completionTokens })`

Tracks quota usage for Vertex AI requests. Called automatically by `recordTokenUsage()`.

**Parameters**:
- `promptTokens` (number): Input tokens
- `completionTokens` (number): Output tokens

**Returns**: `Promise<void>`

**Example**:
```javascript
await client.trackQuotaUsage({
  promptTokens: 1000,
  completionTokens: 500
});
```

**Side Effects**:
- Updates RPM cache counter
- Updates TPM cache counter
- Updates RPD cache counter
- Updates TPD cache counter
- Logs quota metrics (debug level)

---

#### `getQuotaUsage()`

Retrieves current quota usage statistics from Redis cache.

**Parameters**: None

**Returns**: `Promise<Object | null>`

**Return Object**:
```typescript
{
  requestsPerMinute: number;
  tokensPerMinute: number;
  requestsPerDay: number;
  tokensPerDay: number;
  project: string;
  model: string;
}
```

**Returns `null`** if:
- Not using Vertex AI (`project_id` is absent)
- Cache read fails

**Example**:
```javascript
const usage = await client.getQuotaUsage();
if (usage) {
  console.log(`Current RPM: ${usage.requestsPerMinute}`);
}
```

---

#### `checkQuotaLimits({ rpm, tpm, threshold })`

Checks if quota usage is approaching limits and logs warnings.

**Parameters**:
- `rpm` (number, optional): RPM limit. Default: `1000`
- `tpm` (number, optional): TPM limit. Default: `4000000`
- `threshold` (number, optional): Warning threshold (0.0-1.0). Default: `0.8` (80%)

**Returns**: `Promise<Object | null>`

**Return Object**:
```typescript
{
  rpm: {
    current: number;
    limit: number;
    percentage: number;
    approaching: boolean;
  };
  tpm: {
    current: number;
    limit: number;
    percentage: number;
    approaching: boolean;
  };
  warnings: string[];
}
```

**Example**:
```javascript
const status = await client.checkQuotaLimits({
  rpm: 2000,        // Custom RPM limit
  tpm: 4000000,     // TPM limit
  threshold: 0.9    // Warn at 90%
});

if (status.warnings.length > 0) {
  status.warnings.forEach(warning => console.warn(warning));
}
```

**Warning Behavior**:
- Warnings logged at configured threshold
- Uses `logger.warn()` for visibility
- Does NOT throw errors or block requests

---

#### `estimateCost({ promptTokens, completionTokens, model })`

Estimates cost for a Vertex AI or Gemini API request.

**Parameters**:
- `promptTokens` (number, required): Input tokens
- `completionTokens` (number, required): Output tokens
- `model` (string, optional): Model name. Defaults to client's model.

**Returns**: `Object`

**Return Object**:
```typescript
{
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  promptCost: number;      // USD
  completionCost: number;  // USD
  totalCost: number;       // USD
  currency: string;        // "USD"
  model: string;           // Pricing model name (e.g., "vertex-gemini-1.5-pro")
  provider: string;        // "Vertex AI" or "Gemini API"
}
```

**Example**:
```javascript
const cost = client.estimateCost({
  promptTokens: 10000,
  completionTokens: 5000,
  model: 'gemini-1.5-pro'  // Optional
});

console.log(`Estimated cost: $${cost.totalCost.toFixed(4)}`);
```

**Pricing Logic**:
- Automatically detects Vertex AI vs Gemini API
- Transforms model names (e.g., `gemini-1.5-pro` → `vertex-gemini-1.5-pro`)
- Uses pricing from `api/models/tx.js`

---

#### `recordTokenUsage({ promptTokens, completionTokens, model, context })`

Records token usage, tracks quotas, and creates transactions. Called automatically after every request.

**Parameters**:
- `promptTokens` (number): Input tokens
- `completionTokens` (number): Output tokens
- `model` (string, optional): Model name
- `context` (string, optional): Context type. Default: `"message"`

**Returns**: `Promise<void>`

**Side Effects**:
1. Creates transaction records (via `spendTokens()`)
2. Tracks quota usage (via `trackQuotaUsage()` for Vertex AI)
3. Applies correct pricing (Vertex AI vs Gemini API)

**Example**:
```javascript
// Usually called automatically, but can be invoked manually:
await client.recordTokenUsage({
  promptTokens: 1000,
  completionTokens: 500,
  context: 'title-generation'
});
```

---

### Helper Functions

#### `getVertexAIModelName(model, isVertexAI)`

Transforms model names for Vertex AI pricing lookup.

**Location**: `api/models/tx.js`

**Parameters**:
- `model` (string): Original model name
- `isVertexAI` (boolean): Whether this is a Vertex AI request

**Returns**: `string` - Transformed model name

**Examples**:
```javascript
const { getVertexAIModelName } = require('~/models/tx');

// Gemini API
getVertexAIModelName('gemini-1.5-pro', false);
// → 'gemini-1.5-pro'

// Vertex AI
getVertexAIModelName('gemini-1.5-pro', true);
// → 'vertex-gemini-1.5-pro'

// Already prefixed
getVertexAIModelName('vertex-gemini-1.5-pro', true);
// → 'vertex-gemini-1.5-pro'

// Non-Gemini model
getVertexAIModelName('gpt-4', true);
// → 'gpt-4' (no transformation)
```

---

## Monitoring and Alerting

### Log Levels

**Debug Level** (default for quota tracking):
```javascript
logger.debug('[GoogleClient] Vertex AI quota tracking', {
  project: this.project_id,
  model: this.modelOptions.model,
  rpm: 45,
  tpm: 67500,
  rpd: 1250,
  tpd: 3500000
});
```

**Warning Level** (quota approaching limits):
```javascript
logger.warn('[GoogleClient] Vertex AI RPM quota at 85.5% (855/1000)');
logger.warn('[GoogleClient] Vertex AI TPM quota at 92.3% (3692000/4000000)');
```

**Info Level** (cost estimates):
```javascript
logger.debug('[GoogleClient] Cost estimation', {
  totalCost: 0.0375,
  currency: 'USD',
  provider: 'Vertex AI'
});
```

### Setting Up Alerts

**Example: Alert on High Quota Usage**

Create a monitoring script that runs every minute:

```javascript
// monitor-vertex-quotas.js
const { GoogleClient } = require('~/app/clients');
const { sendSlackAlert } = require('~/utils/alerts');

async function monitorQuotas() {
  const client = new GoogleClient(credentials, {
    modelOptions: { model: 'gemini-1.5-pro' }
  });

  const status = await client.checkQuotaLimits({
    rpm: 1000,
    tpm: 4000000,
    threshold: 0.85  // Alert at 85%
  });

  if (status && status.warnings.length > 0) {
    await sendSlackAlert({
      channel: '#vertex-ai-alerts',
      text: '🚨 Vertex AI Quota Alert',
      fields: [
        { title: 'RPM', value: `${status.rpm.percentage.toFixed(1)}%` },
        { title: 'TPM', value: `${status.tpm.percentage.toFixed(1)}%` },
        { title: 'Warnings', value: status.warnings.join('\n') }
      ]
    });
  }
}

setInterval(monitorQuotas, 60000); // Every minute
```

**Run as systemd service or cron job**:
```bash
# crontab -e
*/1 * * * * /usr/bin/node /path/to/monitor-vertex-quotas.js
```

### Grafana Dashboard

**Example Prometheus Metrics**:

Create custom metrics exporter:

```javascript
// metrics-exporter.js
const { register, Gauge } = require('prom-client');
const { GoogleClient } = require('~/app/clients');

const vertexQuotaRPM = new Gauge({
  name: 'vertex_ai_quota_rpm',
  help: 'Vertex AI requests per minute',
  labelNames: ['project', 'model']
});

const vertexQuotaTPM = new Gauge({
  name: 'vertex_ai_quota_tpm',
  help: 'Vertex AI tokens per minute',
  labelNames: ['project', 'model']
});

async function updateMetrics() {
  const client = new GoogleClient(credentials, {
    modelOptions: { model: 'gemini-1.5-pro' }
  });

  const usage = await client.getQuotaUsage();

  if (usage) {
    vertexQuotaRPM.set(
      { project: usage.project, model: usage.model },
      usage.requestsPerMinute
    );

    vertexQuotaTPM.set(
      { project: usage.project, model: usage.model },
      usage.tokensPerMinute
    );
  }
}

setInterval(updateMetrics, 10000); // Every 10 seconds

// Expose metrics endpoint
const express = require('express');
const app = express();
app.get('/metrics', (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
});
app.listen(9090);
```

**Grafana Query Examples**:
```promql
# RPM usage percentage
(vertex_ai_quota_rpm / 1000) * 100

# TPM usage percentage
(vertex_ai_quota_tpm / 4000000) * 100

# Alert when RPM > 80%
vertex_ai_quota_rpm > 800
```

---

## Best Practices

### 1. Monitor Quota Usage Regularly

```javascript
// Best Practice: Check quotas before high-volume operations
async function batchProcess(messages) {
  const status = await client.checkQuotaLimits();

  if (status.rpm.percentage > 75 || status.tpm.percentage > 75) {
    console.warn('High quota usage detected. Implementing backoff...');
    await sleep(30000); // Wait 30 seconds
  }

  // Proceed with batch processing
  for (const message of messages) {
    await client.sendMessage(message);
    await sleep(100); // Rate limiting between requests
  }
}
```

### 2. Use Cost Estimation for Budget Control

```javascript
// Best Practice: Pre-flight cost checks
async function sendMessageWithBudgetCheck(message, maxCost = 0.10) {
  const tokenCount = await client.getTokenCount(message);
  const estimate = client.estimateCost({
    promptTokens: tokenCount,
    completionTokens: tokenCount * 0.5 // Estimate
  });

  if (estimate.totalCost > maxCost) {
    throw new Error(`Cost estimate ($${estimate.totalCost}) exceeds budget ($${maxCost})`);
  }

  return await client.sendMessage(message);
}
```

### 3. Implement Graceful Degradation

```javascript
// Best Practice: Fallback to cheaper models when quota is high
async function sendMessageWithFallback(message) {
  const status = await client.checkQuotaLimits();

  let model = 'gemini-1.5-pro'; // Default: highest quality

  if (status.rpm.percentage > 80) {
    model = 'gemini-1.5-flash'; // Fallback: faster, cheaper
    console.log('High quota usage. Falling back to Gemini 1.5 Flash');
  }

  client.modelOptions.model = model;
  return await client.sendMessage(message);
}
```

### 4. Cache Frequently Used Quota Data

```javascript
// Best Practice: Minimize Redis reads with local caching
class QuotaMonitor {
  constructor(client) {
    this.client = client;
    this.cache = null;
    this.cacheTimestamp = 0;
    this.cacheTTL = 30000; // 30 seconds
  }

  async getQuotaUsage() {
    const now = Date.now();

    if (this.cache && (now - this.cacheTimestamp < this.cacheTTL)) {
      return this.cache; // Return cached data
    }

    this.cache = await this.client.getQuotaUsage();
    this.cacheTimestamp = now;
    return this.cache;
  }
}
```

### 5. Daily Cost Reports

```javascript
// Best Practice: Send daily cost summary emails
const cron = require('node-cron');

cron.schedule('0 0 * * *', async () => {
  const usage = await getDailyUsage();
  const cost = calculateDailyCost(usage);

  await sendEmail({
    to: 'admin@example.com',
    subject: `Vertex AI Daily Report - ${new Date().toDateString()}`,
    body: `
      Daily Vertex AI Usage:
      - Requests: ${usage.requests.toLocaleString()}
      - Tokens: ${usage.tokens.toLocaleString()}
      - Estimated Cost: $${cost.toFixed(2)}
    `
  });
});
```

### 6. Model Selection Based on Cost

```javascript
// Best Practice: Choose model based on task complexity and budget
function selectModel(taskComplexity, budget) {
  if (taskComplexity === 'high' && budget > 0.05) {
    return 'gemini-1.5-pro';  // Best quality, highest cost
  } else if (taskComplexity === 'medium' || budget > 0.01) {
    return 'gemini-2.0-flash'; // Good balance
  } else {
    return 'gemini-1.5-flash'; // Fast, cheap
  }
}
```

### 7. Optimize Token Usage

```javascript
// Best Practice: Minimize token count to reduce costs
function optimizePrompt(userMessage, conversationHistory) {
  // Truncate old messages to reduce token count
  const recentHistory = conversationHistory.slice(-5);

  // Summarize long messages
  const summarizedHistory = recentHistory.map(msg => {
    if (msg.text.length > 500) {
      return { ...msg, text: msg.text.slice(0, 500) + '...' };
    }
    return msg;
  });

  return {
    messages: summarizedHistory,
    currentMessage: userMessage
  };
}
```

---

## Troubleshooting

### Issue: Quota counts are inaccurate

**Symptoms**:
- Quota counters don't match GCP Console
- Unexpected quota exceeded errors

**Causes**:
1. Multiple LibreChat instances sharing same project
2. Redis cache cleared/restarted
3. Clock skew between servers

**Solutions**:

**1. Check Redis connectivity**:
```bash
redis-cli ping
# Should return: PONG
```

**2. Verify cache keys**:
```bash
redis-cli keys "vertex-quota-*"
# Should show quota cache keys
```

**3. Check for multiple instances**:
```javascript
// Add instance identifier to logs
logger.debug('[GoogleClient] Quota tracking', {
  instance: process.env.HOSTNAME,
  project: this.project_id,
  ...
});
```

**4. Reset quota counters** (if needed):
```bash
# Clear all quota caches
redis-cli --scan --pattern "vertex-quota-*" | xargs redis-cli del
```

---

### Issue: Cost estimates don't match actual GCP billing

**Symptoms**:
- LibreChat cost estimates differ from GCP invoice
- Missing cost entries for some requests

**Causes**:
1. Pricing table out of date
2. Special GCP discounts not reflected
3. Long-context pricing not applied

**Solutions**:

**1. Update pricing table**:

Check latest pricing: https://cloud.google.com/vertex-ai/generative-ai/pricing

Update `api/models/tx.js`:
```javascript
const vertexAIValues = {
  'vertex-gemini-1.5-pro': { prompt: 1.25, completion: 5.0 },
  // Update with latest prices
};
```

**2. Account for long-context pricing**:
```javascript
// Manually adjust for >200K context
if (contextTokens > 200000) {
  model = 'vertex-gemini-2.5-pro-long'; // Uses higher pricing
}
```

**3. Compare with GCP Console**:
```bash
# Export GCP billing data
gcloud billing accounts list
gcloud billing projects link PROJECT_ID --billing-account=BILLING_ACCOUNT_ID

# Query actual costs
gcloud billing accounts projects describe PROJECT_ID
```

---

### Issue: Redis quota cache fills up

**Symptoms**:
- Redis memory usage growing continuously
- Redis eviction warnings in logs

**Causes**:
- Too many unique cache keys (many projects/models)
- TTL not expiring properly

**Solutions**:

**1. Check Redis memory usage**:
```bash
redis-cli info memory
```

**2. Verify TTL is working**:
```bash
redis-cli ttl "vertex-quota-rpm:{project}:{model}"
# Should return remaining TTL in seconds
```

**3. Set Redis maxmemory policy**:
```bash
# redis.conf or docker-compose.yml
maxmemory 256mb
maxmemory-policy allkeys-lru
```

**4. Monitor cache size**:
```javascript
const { getLogStores } = require('~/cache');
const cache = getLogStores(CacheKeys.VERTEX_QUOTA_RPM);

// Check cache size (if using Keyv with stats)
const keys = await cache.opts.store.keys();
console.log(`Quota cache keys: ${keys.length}`);
```

---

### Issue: Warning threshold not triggering

**Symptoms**:
- Quota usage at 90% but no warnings logged
- `checkQuotaLimits()` not finding issues

**Causes**:
- Incorrect quota limits configured
- Log level set too high (warnings filtered)
- Not calling `checkQuotaLimits()` regularly

**Solutions**:

**1. Verify quota limits**:
```javascript
// Check your actual GCP quotas
const status = await client.checkQuotaLimits({
  rpm: 1000,     // ← Must match your GCP quota
  tpm: 4000000,  // ← Must match your GCP quota
  threshold: 0.8
});
```

**2. Check log level**:
```bash
# .env
LOG_LEVEL=debug  # Ensure warnings are visible
```

**3. Add explicit checks**:
```javascript
// Before high-volume operations
const status = await client.checkQuotaLimits();
if (status && status.warnings.length > 0) {
  console.error('QUOTA WARNING:', status.warnings);
  // Implement backoff or alert
}
```

---

### Issue: Transaction records missing for some requests

**Symptoms**:
- Some Vertex AI requests don't create transactions
- User balance not updating correctly

**Causes**:
- `recordTokenUsage()` not called
- Error during transaction creation
- Balance tracking disabled

**Solutions**:

**1. Verify `recordTokenUsage()` is called**:
```javascript
// Check GoogleClient.js - should be called after every request
const usage = this.getStreamUsage();
await this.recordTokenUsage({
  promptTokens: usage.input_tokens,
  completionTokens: usage.output_tokens
});
```

**2. Check transaction logs**:
```bash
# Search logs for transaction errors
grep "spendTokens" logs/api.log
grep "createTransaction" logs/api.log
```

**3. Verify balance tracking is enabled**:
```javascript
// Check if user has balance tracking enabled
const user = await User.findById(userId);
console.log('Balance tracking:', user.balance);
```

---

## FAQ

### Q1: What's the difference between Vertex AI and Gemini API pricing?

**A**: Vertex AI is a paid GCP service with per-token pricing ($1.25-$10 per 1M tokens for Gemini 1.5 Pro). Gemini API offers a generous free tier for development. LibreChat automatically detects which you're using based on credentials:
- **Vertex AI**: Uses service account (`project_id` present) → Paid pricing
- **Gemini API**: Uses API key (`project_id` absent) → Free tier / lower pricing

---

### Q2: How accurate are the quota counters?

**A**: Very accurate for single-instance deployments. Quota counters use Redis with atomic increments and proper TTL. However:
- **Multi-instance**: Counters may be slightly delayed across instances
- **Cache eviction**: If Redis restarts, counters reset (but requests still count against GCP quotas)
- **Clock skew**: Ensure all servers have synchronized time (use NTP)

For critical quota monitoring, also check GCP Console quotas.

---

### Q3: Can I customize the warning threshold?

**A**: Yes, pass a `threshold` parameter (0.0-1.0) to `checkQuotaLimits()`:

```javascript
// Warn at 90% instead of default 80%
await client.checkQuotaLimits({
  rpm: 1000,
  tpm: 4000000,
  threshold: 0.9
});
```

Or configure globally in `librechat.yaml`:
```yaml
endpoints:
  google:
    vertexAI:
      quotaWarningThreshold: 0.9
```

---

### Q4: How do I get my actual Vertex AI quotas?

**A**: Check your GCP Console:

1. Go to: https://console.cloud.google.com/
2. Navigate to: **IAM & Admin** → **Quotas**
3. Filter by: "Vertex AI API"
4. Look for:
   - "Generate content requests per minute per region per base model"
   - "Online prediction requests per minute per region per base model"

Or use `gcloud` CLI:
```bash
gcloud compute project-info describe --project=PROJECT_ID
```

---

### Q5: Does quota tracking work for Gemini API (free tier)?

**A**: No, quota tracking only works for **Vertex AI** (when using service account credentials). Gemini API usage is managed by Google's API key quotas, which are not tracked by LibreChat.

To enable quota tracking, switch to Vertex AI:
1. Set up GCP service account
2. Configure `GOOGLE_SERVICE_KEY` environment variable
3. Quota tracking will activate automatically

---

### Q6: Can I track costs per user or per conversation?

**A**: Yes! The transaction system automatically records costs per user and conversation:

```javascript
// Get user's total spend
const transactions = await Transaction.find({ user: userId });
const totalSpend = transactions.reduce((sum, tx) => {
  return sum + (Math.abs(tx.rawAmount) / 1000000) * tx.rate;
}, 0);

// Get conversation cost
const convTransactions = await Transaction.find({
  conversationId: conversationId
});
const conversationCost = convTransactions.reduce(...);
```

---

### Q7: What happens when quota limit is reached?

**A**: LibreChat's quota monitoring is **informational only**. It logs warnings but does NOT block requests. Actual quota enforcement is done by Google Cloud:

**When GCP quota is exceeded**:
1. Google returns HTTP 429 (Too Many Requests)
2. LibreChat's retry logic kicks in (exponential backoff)
3. After 3 retries, error is returned to user

**To prevent quota errors**:
- Monitor warnings and implement backoff
- Request quota increases in GCP Console
- Use cheaper/faster models during high load

---

### Q8: How long are quota counters stored?

**A**:
- **RPM/TPM**: 1 minute (auto-expire)
- **RPD/TPD**: 24 hours (auto-expire at midnight UTC)

Redis automatically cleans up expired keys. No manual cleanup needed.

---

### Q9: Can I disable quota monitoring?

**A**: Quota monitoring is automatic for Vertex AI and has negligible performance impact. However, if you want to disable it:

**Option 1**: Comment out the tracking call in `GoogleClient.js`:
```javascript
// await this.trackQuotaUsage({ promptTokens, completionTokens });
```

**Option 2**: Set quota limits to Infinity (disables warnings):
```javascript
await client.checkQuotaLimits({
  rpm: Infinity,
  tpm: Infinity
});
```

**Not recommended**: Quota monitoring helps prevent service disruptions.

---

### Q10: Are costs accurate for audio/video input?

**A**: The current cost estimation focuses on text tokens. For multimodal input:

**Audio pricing** (Gemini 2.5 Flash):
- Input: $1.00 per 1M tokens
- Output: Same as text

**Video pricing**:
- ~258 tokens per second at 1 FPS

For accurate multimodal pricing, manually adjust:
```javascript
const audioTokens = audioDurationSeconds * 50; // Rough estimate
const cost = client.estimateCost({
  promptTokens: textTokens + audioTokens,
  completionTokens: completionTokens
});
```

Refer to: https://cloud.google.com/vertex-ai/generative-ai/pricing#multimodal-models

---

## Summary

LibreChat's Vertex AI quota monitoring and cost estimation provides:

✅ **Automatic tracking** of requests and tokens (RPM, TPM, RPD, TPD)
✅ **Differentiated pricing** for Vertex AI vs Gemini API
✅ **Real-time cost estimation** with USD calculations
✅ **Proactive warnings** at configurable thresholds
✅ **Per-project monitoring** for multi-tenant deployments
✅ **Redis-backed caching** with automatic expiration
✅ **Transaction recording** for budget tracking

**Key takeaways**:
- Quota monitoring is automatic for Vertex AI (service account)
- Cost estimates use official Google Cloud pricing
- Warnings log at 80% (configurable)
- Actual quota enforcement is done by GCP
- Use `getQuotaUsage()` and `estimateCost()` for monitoring

For questions or issues, refer to the [LibreChat GitHub repository](https://github.com/danny-avila/LibreChat).

---

**Document Version**: 1.0
**Last Updated**: November 2025
**Contributors**: LibreChat Development Team
