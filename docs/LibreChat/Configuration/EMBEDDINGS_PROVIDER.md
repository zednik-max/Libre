# EMBEDDINGS_PROVIDER & EMBEDDINGS_MODEL Configuration Guide

**Version**: v0.8.1-rc1
**Last Updated**: 2025-11-16

---

## What are EMBEDDINGS_PROVIDER and EMBEDDINGS_MODEL?

**EMBEDDINGS_PROVIDER** and **EMBEDDINGS_MODEL** configure the RAG (Retrieval-Augmented Generation) API in LibreChat, which powers the **file search** capability for agents and assistants.

### What Users Get

When configured, LibreChat users can:
- ✅ **Chat with documents** - Upload PDFs, text files, Word docs
- ✅ **Semantic search** - AI searches document content intelligently
- ✅ **Accurate citations** - Get exact page/section references
- ✅ **Multiple file types** - PDF, TXT, DOCX, MD, CSV, and more
- ✅ **Vector search** - AI understands context and meaning
- ✅ **File context in agents** - Agents can reference uploaded files

---

## What is RAG?

**RAG (Retrieval-Augmented Generation)** combines:
1. **Vector embeddings** - Convert documents to searchable vectors
2. **Semantic search** - Find relevant content by meaning
3. **LLM generation** - AI generates answers using retrieved context

**Example flow**:
```
User uploads contract.pdf
→ RAG API splits into chunks
→ Embeddings model converts to vectors
→ Stored in vector database (PostgreSQL)

User asks: "What are the termination clauses?"
→ RAG API searches vectors semantically
→ Retrieves relevant chunks
→ AI generates answer with citations
```

---

## Supported Embeddings Providers

### 1. OpenAI (Default, Recommended)

**Provider**: `EMBEDDINGS_PROVIDER=openai`

**Available models**:
- `text-embedding-3-small` (Default, 1536 dimensions)
- `text-embedding-3-large` (3072 dimensions, higher quality)
- `text-embedding-ada-002` (Legacy, 1536 dimensions)

**Pros**:
- ✅ High quality embeddings
- ✅ Easy setup
- ✅ Fast and reliable
- ✅ Good multilingual support

**Cons**:
- ❌ Requires OpenAI API key
- ❌ Costs per 1M tokens

**Pricing**:
- `text-embedding-3-small`: $0.02 / 1M tokens
- `text-embedding-3-large`: $0.13 / 1M tokens
- `text-embedding-ada-002`: $0.10 / 1M tokens

---

### 2. Azure OpenAI

**Provider**: `EMBEDDINGS_PROVIDER=azure`

**Use when**:
- Using Azure OpenAI services
- Need enterprise compliance
- Prefer Azure billing

**Required config**:
```bash
EMBEDDINGS_PROVIDER=azure
EMBEDDINGS_MODEL=text-embedding-ada-002  # Your deployment name
RAG_AZURE_OPENAI_API_KEY=your-azure-key
RAG_AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
```

---

### 3. HuggingFace (Free, Self-Hosted)

**Provider**: `EMBEDDINGS_PROVIDER=huggingface`

**Use when**:
- Want free embeddings
- Have GPU resources
- Need privacy/data sovereignty

**Popular models**:
- `sentence-transformers/all-MiniLM-L6-v2` (Lightweight, fast)
- `BAAI/bge-small-en-v1.5` (Good balance)
- `intfloat/e5-large-v2` (High quality)

**Requires**: GPU or CPU with sufficient RAM

---

### 4. HuggingFace TEI (Text Embeddings Inference)

**Provider**: `EMBEDDINGS_PROVIDER=huggingfacetei`

**Use when**:
- Want optimized HuggingFace embeddings
- Need faster inference
- Self-hosting embeddings service

**Setup**: Deploy TEI container with your model

---

### 5. Ollama (Local, Free)

**Provider**: `EMBEDDINGS_PROVIDER=ollama`

**Use when**:
- Running Ollama locally
- Want completely offline embeddings
- Need data privacy

**Available models**:
- `nomic-embed-text` (Recommended)
- `mxbai-embed-large`
- `all-minilm`

**Configuration**:
```bash
EMBEDDINGS_PROVIDER=ollama
EMBEDDINGS_MODEL=nomic-embed-text
OLLAMA_BASE_URL=http://host.docker.internal:11434
```

---

## Quick Setup

### Setup 1: OpenAI (Recommended)

**1. Get OpenAI API Key**:
- Visit: https://platform.openai.com/api-keys
- Create API key

**2. Configure**:
```bash
# In .env
EMBEDDINGS_PROVIDER=openai
EMBEDDINGS_MODEL=text-embedding-3-small

# RAG API needs OpenAI key
RAG_OPENAI_API_KEY=sk-proj-your-openai-key

# Or use main OpenAI key (will be used as fallback)
OPENAI_API_KEY=sk-proj-your-openai-key
```

**3. Ensure RAG API is running**:
```bash
# RAG API should be in docker-compose
docker-compose up -d rag_api
```

**4. Restart LibreChat**:
```bash
docker-compose -f docker-compose.windows.yml restart api
```

---

### Setup 2: Ollama (Free, Local)

**1. Install and run Ollama**:
```bash
# Download from: https://ollama.com/
# Pull embeddings model
ollama pull nomic-embed-text
```

**2. Configure**:
```bash
# In .env
EMBEDDINGS_PROVIDER=ollama
EMBEDDINGS_MODEL=nomic-embed-text
OLLAMA_BASE_URL=http://host.docker.internal:11434
```

**3. Start services**:
```bash
docker-compose up -d rag_api
docker-compose -f docker-compose.windows.yml restart api
```

---

### Setup 3: Azure OpenAI

**1. Deploy embeddings model in Azure**:
- Go to Azure OpenAI Studio
- Deploy `text-embedding-ada-002` or `text-embedding-3-small`
- Note deployment name

**2. Configure**:
```bash
# In .env
EMBEDDINGS_PROVIDER=azure
EMBEDDINGS_MODEL=your-deployment-name
RAG_AZURE_OPENAI_API_KEY=your-azure-key
RAG_AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
```

---

## What Users Experience

### File Upload & Search

**Example conversation**:
```
User: *Uploads research_paper.pdf*

User: "What are the main findings in this paper?"

AI: *Uses RAG to search PDF*
    "According to the paper, the main findings are:
    1. [Finding from page 3]
    2. [Finding from page 7]
    3. [Finding from page 12]
    
    Sources: research_paper.pdf (pages 3, 7, 12)"
```

**Supported by**:
- Agents with `file_search` tool enabled
- Assistants API with retrieval enabled
- File context in conversations

---

## Full Configuration Reference

### Core Settings

```bash
# Embeddings provider (required)
EMBEDDINGS_PROVIDER=openai  # Options: openai, azure, huggingface, huggingfacetei, ollama

# Embeddings model (required)
EMBEDDINGS_MODEL=text-embedding-3-small

# RAG API URL (usually same docker network)
RAG_API_URL=http://rag_api:8000
```

### OpenAI Configuration

```bash
# OpenAI embeddings
EMBEDDINGS_PROVIDER=openai
EMBEDDINGS_MODEL=text-embedding-3-small

# API key (specific to RAG, or falls back to OPENAI_API_KEY)
RAG_OPENAI_API_KEY=sk-proj-your-key

# Optional: Custom OpenAI-compatible endpoint
RAG_OPENAI_BASEURL=https://api.openai.com/v1
```

### Azure Configuration

```bash
# Azure OpenAI embeddings
EMBEDDINGS_PROVIDER=azure
EMBEDDINGS_MODEL=your-deployment-name
RAG_AZURE_OPENAI_API_KEY=your-azure-key
RAG_AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
```

### Ollama Configuration

```bash
# Ollama embeddings (local)
EMBEDDINGS_PROVIDER=ollama
EMBEDDINGS_MODEL=nomic-embed-text
OLLAMA_BASE_URL=http://host.docker.internal:11434
```

### Advanced Settings

```bash
# Chunk size for document splitting
CHUNK_SIZE=1500  # Default: 1500 characters

# Chunk overlap for context
CHUNK_OVERLAP=100  # Default: 100 characters

# Use full conversation context
RAG_USE_FULL_CONTEXT=true
```

---

## Architecture

### Components

```
LibreChat API
    ↓ (file upload)
RAG API (Port 8000)
    ↓ (split & embed)
Embeddings Provider (OpenAI/Ollama/etc)
    ↓ (vectors)
PostgreSQL + pgvector (Vector DB)
    ↓ (search)
RAG API → LibreChat → AI Response
```

### Data Flow

**Upload**:
1. User uploads file in LibreChat
2. LibreChat sends file to RAG API
3. RAG API splits file into chunks
4. Embeddings provider converts chunks to vectors
5. Vectors stored in PostgreSQL with pgvector

**Search**:
1. User asks question
2. Agent/Assistant uses file_search tool
3. RAG API embeds question
4. Vector search finds similar chunks
5. Chunks returned to AI for answer generation

---

## Pricing Comparison

### OpenAI (Paid)

| Model | Price per 1M tokens | Dimensions | Quality |
|-------|-------------------|------------|---------|
| text-embedding-3-small | $0.02 | 1536 | Good |
| text-embedding-3-large | $0.13 | 3072 | Best |
| text-embedding-ada-002 | $0.10 | 1536 | Good |

**Example cost**:
- 100 page PDF ≈ 50,000 tokens
- 10 PDFs ≈ 500,000 tokens = $0.01 (with text-embedding-3-small)

---

### Ollama (Free)

| Model | Price | Dimensions | Quality | Speed |
|-------|-------|------------|---------|-------|
| nomic-embed-text | Free | 768 | Good | Medium |
| mxbai-embed-large | Free | 1024 | Better | Slower |
| all-minilm | Free | 384 | Fair | Fast |

**Requirements**:
- GPU recommended (works on CPU)
- ~4GB RAM per model

---

## Troubleshooting

### RAG API Not Running

**Symptoms**:
- File uploads fail
- "RAG API not available" error
- File search doesn't work

**Solutions**:
```bash
# Check if RAG API is running
docker ps | grep rag

# Start RAG API
docker-compose up -d rag_api

# View RAG API logs
docker logs rag_api

# Check RAG API health
curl http://localhost:8000/health
```

---

### Embeddings Model Error

**"Invalid embeddings provider"**:
- Check EMBEDDINGS_PROVIDER value
- Must be: `openai`, `azure`, `huggingface`, `huggingfacetei`, or `ollama`
- Restart RAG API after changes

**"Model not found"**:
- For OpenAI: Check model name spelling
- For Ollama: Pull model first (`ollama pull nomic-embed-text`)
- For Azure: Verify deployment name matches

---

### File Upload Fails

**"Failed to process file"**:
- Check RAG API logs: `docker logs rag_api`
- Verify embeddings provider is configured
- Check file size limits
- Ensure PostgreSQL is running

**"Vector database error"**:
- Check PostgreSQL with pgvector is running
- Verify database connection in RAG API
- Check disk space

---

### Slow Embeddings

**OpenAI embeddings slow**:
- Check network connection
- Verify API key is valid
- Consider upgrading plan

**Ollama embeddings slow**:
- Use GPU if available
- Use smaller model (all-minilm)
- Increase RAM allocation
- Check CPU/GPU usage

---

## Performance Optimization

### Chunk Size Tuning

```bash
# Smaller chunks (better precision, more vectors)
CHUNK_SIZE=800
CHUNK_OVERLAP=100

# Larger chunks (better context, fewer vectors)
CHUNK_SIZE=2000
CHUNK_OVERLAP=200
```

**Guidelines**:
- Technical docs: 800-1200 chars
- General text: 1500-2000 chars
- Long-form: 2000-3000 chars

---

### Model Selection

**Best quality** (expensive):
- OpenAI: `text-embedding-3-large`
- Ollama: `mxbai-embed-large`

**Best balance** (recommended):
- OpenAI: `text-embedding-3-small`
- Ollama: `nomic-embed-text`

**Best speed** (lower quality):
- Ollama: `all-minilm`

---

## Migration Guide

### From OpenAI to Ollama (Free)

**1. Install Ollama**:
```bash
# Download from https://ollama.com/
ollama pull nomic-embed-text
```

**2. Update .env**:
```bash
# Change from OpenAI
EMBEDDINGS_PROVIDER=ollama
EMBEDDINGS_MODEL=nomic-embed-text
OLLAMA_BASE_URL=http://host.docker.internal:11434
```

**3. Re-index existing files** (optional):
- Delete vector database
- Re-upload files
- Or keep existing (mixed embeddings)

---

### From OpenAI to Azure

**1. Deploy model in Azure**:
- Azure OpenAI Studio
- Deploy `text-embedding-3-small`

**2. Update .env**:
```bash
EMBEDDINGS_PROVIDER=azure
EMBEDDINGS_MODEL=your-deployment-name
RAG_AZURE_OPENAI_API_KEY=your-key
RAG_AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
```

---

## Testing

### Test Embeddings API

**OpenAI**:
```bash
curl https://api.openai.com/v1/embeddings \
  -H "Authorization: Bearer sk-proj-your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "test",
    "model": "text-embedding-3-small"
  }'
```

**Ollama**:
```bash
curl http://localhost:11434/api/embeddings \
  -d '{
    "model": "nomic-embed-text",
    "prompt": "test"
  }'
```

### Test RAG API

```bash
# Health check
curl http://localhost:8000/health

# List files
curl http://localhost:8000/v1/files

# Upload file (requires auth token)
curl -X POST http://localhost:8000/v1/files \
  -H "Authorization: Bearer your-token" \
  -F "file=@document.pdf"
```

---

## Related Documentation

- **File Search**: See agent `file_search` tool in [AGENTS_CUSTOMIZATIONS.md](../../../AGENTS_CUSTOMIZATIONS.md)
- **Assistants**: See [ASSISTANTS_API_KEY.md](./ASSISTANTS_API_KEY.md)
- **Main Guide**: See [CLAUDE.md](../../../CLAUDE.md)
- **RAG API Docs**: https://www.librechat.ai/docs/configuration/rag_api

---

## FAQ

**Q: Do I need embeddings for agents to work?**
A: No, only if you want the `file_search` tool to work.

**Q: Can I use different embeddings providers for different files?**
A: No, all files use the same configured provider.

**Q: What's the difference between file_search and code_interpreter?**
A:
- `file_search`: Searches document content (uses embeddings)
- `code_interpreter`: Executes code (uses Judge0, no embeddings)

**Q: Can I change embeddings provider without losing files?**
A: Yes, but you need to re-index (re-upload) files for search to work.

**Q: Which is better: OpenAI or Ollama embeddings?**
A:
- OpenAI: Better quality, easier, but costs money
- Ollama: Free, private, but slower and needs resources

**Q: How much does it cost to embed 1000 pages?**
A: ~$0.20 with text-embedding-3-small (rough estimate)

---

*Document Version: 1.0.0 | LibreChat v0.8.1-rc1*
