# Setting Up HuggingFace Embeddings for LibreChat

**Purpose**: Replace paid OpenAI embeddings with HuggingFace Inference API embeddings for RAG (Retrieval-Augmented Generation) file search.

**Benefits**:
- ✅ **Free Tier Available** - 30,000 requests/month free
- ✅ **No Local Resources** - Cloud-based processing
- ✅ **Multiple Models** - Choose from hundreds of embedding models
- ✅ **Good Quality** - High-quality sentence transformers
- ✅ **Easy Setup** - No additional software installation

**When to Choose HuggingFace Over Ollama**:
- Limited local computing resources
- Don't want to run local services
- Need API-based solution for team deployment
- Want access to multiple embedding models

---

## Prerequisites

- LibreChat already installed and running
- Email address for HuggingFace account
- Internet connection
- Docker Desktop running

---

## Step 1: Create HuggingFace Account

### Sign Up

1. Visit: https://huggingface.co/join
2. Enter your email, username, and password
3. Click **"Sign Up"**
4. Verify your email address (check inbox)

### Confirm Account

1. Check your email for verification link
2. Click the verification link
3. You'll be redirected to HuggingFace dashboard

**Cost**: Free forever (no credit card required)

---

## Step 2: Generate API Token

### Access Token Settings

1. Log in to HuggingFace: https://huggingface.co/
2. Click your **profile picture** (top-right corner)
3. Select **"Settings"**
4. Click **"Access Tokens"** in left sidebar

### Create New Token

1. Click **"New token"** button
2. Enter token details:
   - **Name**: `LibreChat RAG` (or any descriptive name)
   - **Role**: Select **"Read"** (sufficient for embeddings)
   - **Scope**: Leave default
3. Click **"Generate token"**

### Copy Your Token

1. Token appears as: `hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
2. Click **"Copy"** button
3. **IMPORTANT**: Save this token securely (you can't view it again)

**Security Note**: Treat this token like a password. Never commit it to Git or share publicly.

---

## Step 3: Choose Embedding Model

HuggingFace offers many embedding models. Here are the recommended options:

### Recommended Models

| Model | Size | Quality | Speed | Use Case |
|-------|------|---------|-------|----------|
| `sentence-transformers/all-MiniLM-L6-v2` | 80MB | Good | Fast | General purpose (recommended) |
| `sentence-transformers/all-mpnet-base-v2` | 420MB | Better | Medium | Higher quality needs |
| `BAAI/bge-small-en-v1.5` | 130MB | Good | Fast | English documents only |
| `BAAI/bge-base-en-v1.5` | 420MB | Better | Medium | English, higher quality |
| `intfloat/multilingual-e5-small` | 470MB | Good | Medium | Multiple languages |

**Recommendation for Most Users**: `sentence-transformers/all-MiniLM-L6-v2`
- Excellent balance of quality and speed
- Well-tested and reliable
- 384-dimensional embeddings (sufficient for most RAG use cases)

---

## Step 4: Configure LibreChat

### Edit `.env` File

Open `D:\java\LibreChat\.env` in your text editor and add/modify these lines:

```bash
# RAG Embeddings Configuration - HuggingFace
EMBEDDINGS_PROVIDER=huggingface
HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Replace with your actual token
EMBEDDINGS_MODEL=sentence-transformers/all-MiniLM-L6-v2

# Optional: Adjust chunk size (default is 1500)
# CHUNK_SIZE=1500

# Optional: Collection name (default is testcollection)
# COLLECTION_NAME=librechat_docs
```

**Replace `hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`** with the token you copied in Step 2.

### Alternative Models Configuration

If you want to use a different model, change the `EMBEDDINGS_MODEL` line:

**For higher quality** (slower):
```bash
EMBEDDINGS_MODEL=sentence-transformers/all-mpnet-base-v2
```

**For multilingual support**:
```bash
EMBEDDINGS_MODEL=intfloat/multilingual-e5-small
```

**For English-only, optimized**:
```bash
EMBEDDINGS_MODEL=BAAI/bge-base-en-v1.5
```

### Save the File

Save and close `.env`

---

## Step 5: Restart LibreChat

### Stop Current Containers

In PowerShell, navigate to your LibreChat directory:
```powershell
cd D:\java\LibreChat
```

Stop the containers:
```powershell
docker-compose -f docker-compose.windows.yml down
```

### Restart with New Configuration

```powershell
docker-compose -f docker-compose.windows.yml up -d
```

Wait for containers to start (30-60 seconds).

### Verify Containers are Running

```powershell
docker ps
```

You should see containers: `LibreChat`, `rag_api`, `vectordb`, `chat-mongodb`, `chat-meilisearch`

---

## Step 6: Test Embeddings

### Upload a Test File

1. Open LibreChat: http://localhost:3080
2. Start a new conversation
3. Click the **paperclip icon** (attach files)
4. Upload a small test file (PDF, TXT, or DOCX)
5. Ask a question about the file content

### Expected Behavior

- File uploads successfully
- Brief processing delay (embedding via HuggingFace API)
- AI responds based on file content
- Context-aware answers

### Monitor API Usage

Check RAG API logs for successful embedding requests:
```powershell
docker logs rag_api | grep -i "huggingface\|embed"
```

You should see successful API calls without errors.

---

## Troubleshooting

### Issue: "401 Unauthorized" Error

**Problem**: Invalid or missing HuggingFace token.

**Solution**:
1. Verify token in `.env` starts with `hf_`
2. Ensure no extra spaces before or after token
3. Regenerate token on HuggingFace if needed
4. Restart containers after fixing `.env`

### Issue: "429 Rate Limit Exceeded"

**Problem**: Exceeded free tier limits (30,000 requests/month).

**Solution**:
- Wait until next month for limit reset
- Or upgrade to HuggingFace Pro: https://huggingface.co/pricing
- Or switch to Ollama (unlimited, local)

**Free Tier Limits**:
- 30,000 requests/month
- Approximately 3,000-5,000 documents (depending on size)

### Issue: "Model Not Found" Error

**Problem**: Incorrect model name in `.env`

**Solution**:
1. Verify model exists: Visit `https://huggingface.co/MODEL_NAME`
   (Replace MODEL_NAME with your chosen model)
2. Copy exact model name (case-sensitive)
3. Update `EMBEDDINGS_MODEL` in `.env`
4. Restart containers

### Issue: Slow Embedding Generation

**Problem**: First-time model loading or slow API response.

**Explanation**:
- First request per model can take 30-60 seconds (model loading)
- Subsequent requests faster (model cached on HuggingFace servers)
- Some models are slower than others

**Solution**:
- Be patient on first document upload
- Switch to faster model (all-MiniLM-L6-v2)
- Or use Ollama for local, faster processing

### Issue: Files Upload But No Context in Responses

**Problem**: Embeddings not being generated or stored correctly.

**Solution**:
1. Check RAG API logs:
   ```powershell
   docker logs rag_api
   ```
2. Look for "HuggingFace" errors
3. Verify `HF_TOKEN` is set correctly in `.env`
4. Test token validity: Visit https://huggingface.co/settings/tokens

---

## Advanced Configuration

### Using HuggingFace Inference Endpoints (Paid)

For higher throughput and dedicated resources, use HuggingFace Inference Endpoints:

1. Create endpoint: https://ui.endpoints.huggingface.co/
2. Deploy your chosen model
3. Get endpoint URL
4. Update `.env`:
   ```bash
   EMBEDDINGS_PROVIDER=huggingface
   HF_ENDPOINT_URL=https://your-endpoint.endpoints.huggingface.cloud
   HF_TOKEN=your_token
   EMBEDDINGS_MODEL=sentence-transformers/all-MiniLM-L6-v2
   ```

**Cost**: Starting at $0.06/hour (billed per second)

### Adjusting Chunk Size

For technical documents with dense information:
```bash
CHUNK_SIZE=1000  # Smaller chunks = more precise search
```

For narrative documents (books, articles):
```bash
CHUNK_SIZE=2000  # Larger chunks = more context per chunk
```

### Multiple Collections

To separate different document types:
```bash
COLLECTION_NAME=technical_docs   # For one set of documents
```

Change the collection name when you want to create a separate document store.

---

## Monitoring Usage

### Check Monthly Usage

1. Visit: https://huggingface.co/settings/billing
2. View **"Inference API"** section
3. Monitor requests used vs. free tier limit

### Set Up Alerts

HuggingFace doesn't have built-in alerts, but you can monitor via RAG API logs:

```powershell
# Count embedding requests today
docker logs rag_api | grep -i "embedding" | wc -l
```

### Upgrading to Pro

If you exceed free tier:
- Visit: https://huggingface.co/pricing
- **Pro Plan**: $9/month - 3M requests/month
- **Enterprise**: Custom pricing for unlimited

---

## Comparison: HuggingFace vs Other Providers

| Feature | HuggingFace (Free) | Ollama (Local) | OpenAI (Paid) |
|---------|-------------------|----------------|---------------|
| **Cost** | Free (30k/month) | Free (unlimited) | $0.02 per 1M tokens |
| **Setup** | Easy (API token) | Medium (install + download) | Easy (API key) |
| **Speed** | 2-5 seconds | 5-10 seconds | 1-2 seconds |
| **Quality** | Very Good | Very Good | Excellent |
| **Privacy** | Data sent to HF | 100% Local | Data sent to OpenAI |
| **Rate Limits** | 30k/month (free) | None | 3M/minute |
| **Internet** | Required | Not required | Required |
| **Local Resources** | None | 4GB RAM + GPU | None |

**When to Choose HuggingFace**:
- ✅ Limited local computing resources
- ✅ Don't want to manage local services
- ✅ Need cloud-based solution
- ✅ Monthly usage under 30k requests (free tier)

**When to Choose Ollama**:
- ✅ Heavy usage (>30k requests/month)
- ✅ Have local computing resources
- ✅ Maximum privacy needed
- ✅ No internet dependency required

---

## Best Practices

### Token Security

1. **Never commit tokens to Git**:
   - Add `.env` to `.gitignore`
   - Use environment variables in production

2. **Rotate tokens periodically**:
   - Generate new token every 6-12 months
   - Revoke old tokens after migration

3. **Use read-only tokens**:
   - Don't give write permissions unless necessary
   - Embeddings only need "Read" access

### Model Selection

1. **Start with all-MiniLM-L6-v2**: Good balance for most use cases
2. **Upgrade to all-mpnet-base-v2**: If quality isn't sufficient
3. **Try multilingual models**: Only if you have non-English documents
4. **Test before committing**: Upload test documents and verify quality

### Performance Optimization

1. **Chunk size matters**:
   - Smaller = more precise, but more API calls
   - Larger = more context, but less precise

2. **Batch document uploads**:
   - Upload multiple documents at once
   - Reduces total API calls

3. **Monitor free tier usage**:
   - Check monthly usage regularly
   - Plan upgrade if approaching limit

---

## Migration Guide

### From OpenAI to HuggingFace

Already using OpenAI embeddings? Switch to HuggingFace:

1. **Backup current embeddings** (optional):
   ```powershell
   docker exec vectordb pg_dump -U myuser mydatabase > backup.sql
   ```

2. **Update `.env`**:
   ```bash
   # Old:
   # EMBEDDINGS_PROVIDER=openai
   # OPENAI_API_KEY=sk-xxx

   # New:
   EMBEDDINGS_PROVIDER=huggingface
   HF_TOKEN=hf_xxx
   EMBEDDINGS_MODEL=sentence-transformers/all-MiniLM-L6-v2
   ```

3. **Clear old embeddings** (required - different dimensions):
   ```powershell
   docker-compose -f docker-compose.windows.yml down
   docker volume rm librechat_pgdata2
   docker-compose -f docker-compose.windows.yml up -d
   ```

4. **Re-upload documents**: All documents need re-embedding with new model.

### From Ollama to HuggingFace

Switching from local to cloud-based:

1. **Update `.env`**:
   ```bash
   # Old:
   # EMBEDDINGS_PROVIDER=ollama
   # OLLAMA_BASE_URL=http://host.docker.internal:11434
   # EMBEDDINGS_MODEL=nomic-embed-text

   # New:
   EMBEDDINGS_PROVIDER=huggingface
   HF_TOKEN=hf_xxx
   EMBEDDINGS_MODEL=sentence-transformers/all-MiniLM-L6-v2
   ```

2. **Clear embeddings** (optional - keep if dimensions match):
   ```powershell
   docker-compose -f docker-compose.windows.yml down
   docker volume rm librechat_pgdata2
   docker-compose -f docker-compose.windows.yml up -d
   ```

3. **Re-upload documents**: Recommended for consistency.

---

## Getting Help

**HuggingFace Issues**:
- HuggingFace Forums: https://discuss.huggingface.co/
- Documentation: https://huggingface.co/docs/api-inference/
- Support: https://huggingface.co/support

**LibreChat RAG Issues**:
- LibreChat Discord: https://discord.librechat.ai
- LibreChat Docs: https://docs.librechat.ai/features/rag_api
- GitHub Issues: https://github.com/danny-avila/LibreChat/issues

**Check Logs**:
```powershell
# RAG API logs (embedding errors)
docker logs rag_api

# Main LibreChat logs
docker logs LibreChat

# Look for HuggingFace-specific errors
docker logs rag_api | grep -i "huggingface\|401\|429"
```

---

## Summary

✅ **Setup**: Create HF account → Generate token → Configure `.env`
✅ **Models**: Choose from popular sentence transformers
✅ **Testing**: Restart containers → Upload file → Verify context awareness

**Total Setup Time**: 10-15 minutes
**Monthly Cost**: $0 (free tier) or $9 (Pro tier)

You now have free (with limits) cloud-based embeddings for LibreChat RAG!

---

## Appendix: Popular Embedding Models

### General Purpose

- `sentence-transformers/all-MiniLM-L6-v2` - Best starting point
- `sentence-transformers/all-mpnet-base-v2` - Higher quality
- `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` - Multilingual

### Specialized

- `BAAI/bge-small-en-v1.5` - English-optimized (fast)
- `BAAI/bge-base-en-v1.5` - English-optimized (quality)
- `BAAI/bge-large-en-v1.5` - English-optimized (best quality)

### Code/Technical

- `microsoft/codebert-base` - Code embeddings
- `sentence-transformers/gtr-t5-base` - Technical documents

### Research/Scientific

- `allenai/specter` - Scientific papers
- `sentence-transformers/allenai-specter` - Research documents

**How to Use**: Replace `EMBEDDINGS_MODEL` in `.env` with any model name above.

**Test Before Production**: Always test with sample documents before full deployment.
