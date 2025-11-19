# Setting Up Ollama Embeddings for LibreChat

**Purpose**: Replace paid OpenAI embeddings with free, local Ollama embeddings for RAG (Retrieval-Augmented Generation) file search.

**Benefits**:
- ✅ **100% Free** - No API costs
- ✅ **Local Processing** - Runs on your machine
- ✅ **No Rate Limits** - Process unlimited documents
- ✅ **Privacy** - Data never leaves your machine
- ✅ **Good Quality** - Comparable to OpenAI embeddings for most use cases

---

## Prerequisites

- LibreChat already installed and running
- Windows 11 Pro (these instructions are Windows-specific)
- At least 4GB free RAM
- Docker Desktop running

---

## Step 1: Install Ollama

### Download Ollama

1. Visit: https://ollama.com/download
2. Download **Ollama for Windows**
3. Run the installer (`OllamaSetup.exe`)
4. Follow installation prompts (defaults are fine)

### Verify Installation

Open PowerShell and run:
```powershell
ollama --version
```

You should see output like:
```
ollama version is 0.x.x
```

---

## Step 2: Download the Embedding Model

Ollama needs to download the embedding model first. We'll use `nomic-embed-text`, which is optimized for RAG applications.

### Pull the Model

In PowerShell, run:
```powershell
ollama pull nomic-embed-text
```

**Download size**: ~274MB
**Expected time**: 2-5 minutes (depending on internet speed)

You'll see output like:
```
pulling manifest
pulling 970aa74c0a90... 100% ▕████████████████▏ 274 MB
pulling c71d239df917... 100% ▕████████████████▏  11 KB
pulling ce4a164fc046... 100% ▕████████████████▏   17 B
pulling 31df3a66df66... 100% ▕████████████████▏  420 B
verifying sha256 digest
writing manifest
success
```

### Verify Model Installation

```powershell
ollama list
```

You should see:
```
NAME                    ID              SIZE      MODIFIED
nomic-embed-text:latest 970aa74c0a90    274 MB    X minutes ago
```

---

## Step 3: Configure LibreChat

### Edit `.env` File

Open `D:\java\LibreChat\.env` in your text editor and add/modify these lines:

```bash
# RAG Embeddings Configuration - Ollama (Free & Local)
EMBEDDINGS_PROVIDER=ollama
OLLAMA_BASE_URL=http://host.docker.internal:11434
EMBEDDINGS_MODEL=nomic-embed-text

# Optional: Adjust chunk size (default is 1500)
# CHUNK_SIZE=1500

# Optional: Collection name (default is testcollection)
# COLLECTION_NAME=librechat_docs
```

**Important Notes**:
- `host.docker.internal` allows Docker containers to reach your Windows host machine
- Port `11434` is Ollama's default port
- Don't change the model name unless you downloaded a different model

### Save the File

Save and close `.env`

---

## Step 4: Restart LibreChat

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

## Step 5: Test Embeddings

### Upload a Test File

1. Open LibreChat: http://localhost:3080
2. Start a new conversation
3. Click the **paperclip icon** (attach files)
4. Upload a PDF, TXT, or DOCX file
5. Ask a question about the file content

### Expected Behavior

- File uploads successfully
- Processing occurs (you may see a brief loading indicator)
- AI responds based on file content
- **No OpenAI API calls** (check Ollama terminal for embedding activity)

### Monitor Ollama Activity

Open a new PowerShell window and run:
```powershell
ollama ps
```

When you upload files, you should see:
```
NAME                    ID              SIZE      PROCESSOR    UNTIL
nomic-embed-text:latest 970aa74c0a90    548 MB    100% GPU     4 minutes from now
```

This confirms Ollama is processing embeddings locally.

---

## Troubleshooting

### Issue: "Connection refused" Error

**Problem**: Docker can't reach Ollama on your host machine.

**Solution**:
1. Ensure Ollama is running: Open Task Manager → Check for "Ollama" process
2. If not running, start it: Open PowerShell → Run `ollama serve`
3. Check firewall: Allow port 11434 through Windows Firewall

### Issue: Files Upload But No Context in Responses

**Problem**: Embeddings not being generated or stored.

**Solution**:
1. Check RAG API logs:
   ```powershell
   docker logs rag_api
   ```
2. Look for errors mentioning "ollama" or "embeddings"
3. Verify `OLLAMA_BASE_URL` is set correctly in `.env`

### Issue: Slow Embedding Generation

**Problem**: First-time embedding takes longer than expected.

**Explanation**: This is normal. First document always takes longer (model warm-up). Subsequent documents process much faster.

**Tip**: For large documents (>50 pages), embedding can take 30-60 seconds. Be patient.

### Issue: Model Not Found

**Problem**: Error: "model 'nomic-embed-text' not found"

**Solution**:
```powershell
ollama pull nomic-embed-text
```

Wait for download to complete, then restart LibreChat containers.

---

## Advanced Configuration

### Using a Different Model

Ollama supports multiple embedding models. Popular alternatives:

**1. all-minilm (Smaller, faster)**
```powershell
ollama pull all-minilm
```
Then in `.env`:
```bash
EMBEDDINGS_MODEL=all-minilm
```

**2. mxbai-embed-large (Larger, higher quality)**
```powershell
ollama pull mxbai-embed-large
```
Then in `.env`:
```bash
EMBEDDINGS_MODEL=mxbai-embed-large
```

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

## Performance Tips

### GPU Acceleration

If you have an NVIDIA GPU, Ollama will automatically use it for faster embedding generation.

To verify GPU usage:
```powershell
nvidia-smi
```

Look for "ollama" in the process list when embedding.

### RAM Usage

- **Minimum**: 4GB free RAM
- **Recommended**: 8GB+ free RAM
- **Optimal**: 16GB+ free RAM

If you experience slowdowns, close other applications.

### Disk Space

- Each model requires 200-500MB
- Vector database grows with documents (approximately 1MB per 100 pages)
- Ensure at least 5GB free disk space for heavy use

---

## Comparison: Ollama vs OpenAI Embeddings

| Feature | Ollama (nomic-embed-text) | OpenAI (text-embedding-3-small) |
|---------|---------------------------|----------------------------------|
| **Cost** | Free | $0.02 per 1M tokens (~$0.50/1000 pages) |
| **Speed** | 5-10 seconds per document | 1-2 seconds per document |
| **Quality** | Very Good (768 dimensions) | Excellent (1536 dimensions) |
| **Privacy** | 100% Local | Data sent to OpenAI |
| **Rate Limits** | None | 3,000 requests/min |
| **Internet Required** | No (after model download) | Yes |

**Verdict**: For most use cases, Ollama provides excellent quality at zero cost. Only use OpenAI if you need the absolute best quality or fastest processing.

---

## Maintenance

### Updating Ollama

Periodically check for updates:
```powershell
# Download latest Ollama installer from https://ollama.com/download
# Run installer (it updates in-place)
```

### Updating Models

Models improve over time. Update with:
```powershell
ollama pull nomic-embed-text
```

This downloads the latest version without removing the old one.

### Clearing Old Embeddings

If you want to re-embed all documents (e.g., after changing models):

1. Stop LibreChat:
   ```powershell
   docker-compose -f docker-compose.windows.yml down
   ```

2. Remove vector database volume:
   ```powershell
   docker volume rm librechat_pgdata2
   ```

3. Restart:
   ```powershell
   docker-compose -f docker-compose.windows.yml up -d
   ```

All documents will need to be re-uploaded and re-embedded.

---

## Getting Help

**Ollama Issues**:
- Ollama Discord: https://discord.gg/ollama
- Ollama GitHub: https://github.com/ollama/ollama/issues

**LibreChat RAG Issues**:
- LibreChat Discord: https://discord.librechat.ai
- LibreChat Docs: https://docs.librechat.ai/features/rag_api

**Check Logs**:
```powershell
# RAG API logs (embedding errors)
docker logs rag_api

# Main LibreChat logs
docker logs LibreChat

# Vector database logs
docker logs vectordb
```

---

## Summary

✅ **Installation**: Download Ollama → Pull model
✅ **Configuration**: Edit `.env` → Set provider to "ollama"
✅ **Testing**: Restart containers → Upload file → Verify context awareness

**Total Setup Time**: 15-20 minutes
**Ongoing Cost**: $0

You now have free, local embeddings for LibreChat RAG!
