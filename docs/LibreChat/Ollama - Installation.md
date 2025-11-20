# Ollama Installation and Setup for LibreChat

**Quick Setup Guide for Windows 11 Pro**

This guide provides streamlined instructions for installing Ollama and configuring it with LibreChat for unlimited, free embeddings.

---

## Prerequisites

- ✅ LibreChat already installed and running
- ✅ Windows 11 Pro
- ✅ Docker Desktop running
- ✅ At least 4GB free RAM
- ✅ 2GB free disk space

**Estimated Time**: 15-20 minutes

---

## Step 1: Install Ollama

### Download Ollama

1. Visit: **https://ollama.com/download**
2. Click **"Download for Windows"**
3. Run `OllamaSetup.exe`
4. Follow installation wizard (accept all defaults)

### Verify Installation

Open PowerShell and run:
```powershell
ollama --version
```

**Expected output**:
```
ollama version is 0.x.x
```

If you see this, Ollama is installed correctly! ✅

---

## Step 2: Download Embedding Model

### Pull the Model

In PowerShell, run:
```powershell
ollama pull nomic-embed-text
```

**What this does**: Downloads the `nomic-embed-text` model optimized for RAG embeddings.

**Download progress** (~274MB, 2-5 minutes):
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

**Expected output**:
```
NAME                    ID              SIZE      MODIFIED
nomic-embed-text:latest 970aa74c0a90    274 MB    X minutes ago
```

✅ Model is ready!

---

## Step 3: Configure LibreChat

### Edit .env File

1. Open `D:\java\LibreChat\.env` in your text editor (VS Code, Notepad++, etc.)
2. Add these lines at the end:

```bash
# RAG Embeddings Configuration - Ollama (Local, Unlimited, Free)
EMBEDDINGS_PROVIDER=ollama
OLLAMA_BASE_URL=http://host.docker.internal:11434
EMBEDDINGS_MODEL=nomic-embed-text

# Optional: Larger chunks for books (more context per chunk)
CHUNK_SIZE=2000

# Optional: Separate collection for books
COLLECTION_NAME=technical_books
```

3. **Save and close** the file

### Configuration Explained

| Variable | Value | Purpose |
|----------|-------|---------|
| `EMBEDDINGS_PROVIDER` | `ollama` | Use Ollama for embeddings |
| `OLLAMA_BASE_URL` | `http://host.docker.internal:11434` | Docker container → Windows host |
| `EMBEDDINGS_MODEL` | `nomic-embed-text` | Model name (must match Step 2) |
| `CHUNK_SIZE` | `2000` | Larger chunks for books (optional) |
| `COLLECTION_NAME` | `technical_books` | Custom collection name (optional) |

---

## Step 4: Restart LibreChat

### Stop Containers

```powershell
cd D:\java\LibreChat
docker-compose -f docker-compose.windows.yml down
```

**Expected output**:
```
Stopping LibreChat ... done
Stopping rag_api ... done
Stopping vectordb ... done
Stopping chat-mongodb ... done
Stopping chat-meilisearch ... done
Removing LibreChat ... done
Removing rag_api ... done
Removing vectordb ... done
Removing chat-mongodb ... done
Removing chat-meilisearch ... done
```

### Start Containers with New Configuration

```powershell
docker-compose -f docker-compose.windows.yml up -d
```

**Expected output**:
```
Creating chat-mongodb ... done
Creating chat-meilisearch ... done
Creating vectordb ... done
Creating rag_api ... done
Creating LibreChat ... done
Creating vertex-proxy ... done
```

**Wait 30-60 seconds** for all containers to fully start.

### Verify Containers are Running

```powershell
docker ps
```

**Expected output** (should see these containers):
- `LibreChat`
- `rag_api`
- `vectordb`
- `chat-mongodb`
- `chat-meilisearch`
- `vertex-proxy`

✅ All containers running!

---

## Step 5: Test Embeddings

### Upload Test File

1. Open LibreChat: **http://localhost:3080**
2. Log in with your account
3. Start a **new conversation**
4. Click the **paperclip icon** (📎 attach file button)
5. Upload a small PDF test file (<50 pages recommended for first test)
6. Wait for processing (may take 30-60 seconds for first file)

### Ask Test Questions

Once file uploads successfully, try:
- "What are the main topics in this document?"
- "Summarize the key points from page 5"
- "What does the author say about [specific topic]?"

**Expected behavior**:
- ✅ AI responds with content from your uploaded file
- ✅ Answers are context-aware and specific
- ✅ Responses reference actual content from the PDF

### Monitor Ollama Activity

Open a **second PowerShell window** and run:
```powershell
ollama ps
```

**While processing files**, you should see:
```
NAME                    ID              SIZE      PROCESSOR    UNTIL
nomic-embed-text:latest 970aa74c0a90    548 MB    100% GPU     4 minutes from now
```

This confirms Ollama is processing embeddings locally! ✅

---

## Troubleshooting

### Issue: "Connection Refused to Ollama"

**Symptoms**:
- File uploads fail
- Error mentioning "ollama" or "connection refused" in logs

**Solution**:
1. Check if Ollama service is running:
   ```powershell
   ollama serve
   ```
2. Leave this PowerShell window open while using LibreChat
3. If already running, restart it:
   - Close Ollama from Task Manager
   - Run `ollama serve` again

**Check Task Manager**:
- Open Task Manager (Ctrl+Shift+Esc)
- Look for "Ollama" process under Background Processes
- If not found, run `ollama serve` in PowerShell

---

### Issue: "Model Not Found"

**Symptoms**:
- Error: "model 'nomic-embed-text' not found"

**Solution**:
```powershell
ollama pull nomic-embed-text
```

Wait for download to complete, then restart LibreChat containers:
```powershell
cd D:\java\LibreChat
docker-compose -f docker-compose.windows.yml restart
```

---

### Issue: Files Upload But No Context in Responses

**Symptoms**:
- Files upload successfully
- But AI doesn't reference file content in answers

**Solution**:

1. **Check RAG API logs**:
   ```powershell
   docker logs rag_api
   ```
   Look for errors mentioning "ollama" or "embeddings"

2. **Verify .env configuration**:
   ```powershell
   docker exec LibreChat cat .env | grep -E "EMBEDDINGS|OLLAMA"
   ```
   Should show:
   ```
   EMBEDDINGS_PROVIDER=ollama
   OLLAMA_BASE_URL=http://host.docker.internal:11434
   EMBEDDINGS_MODEL=nomic-embed-text
   ```

3. **Test Ollama directly**:
   ```powershell
   ollama run nomic-embed-text "test"
   ```
   Should return without errors

4. **Restart everything**:
   ```powershell
   # Stop containers
   docker-compose -f docker-compose.windows.yml down

   # Restart Ollama
   ollama serve

   # Start containers
   docker-compose -f docker-compose.windows.yml up -d
   ```

---

### Issue: Slow Embedding Generation

**Symptoms**:
- First file upload takes 2-3 minutes
- Progress indicator seems stuck

**Explanation**:
This is **normal behavior**! First embedding always takes longer due to:
1. Model warm-up (loading into memory)
2. Initial connection establishment
3. First-time processing overhead

**Performance expectations**:
- **First file**: 30-60 seconds (or 2-3 minutes for large PDFs)
- **Subsequent files**: 10-20 seconds (model is cached)
- **Large PDFs (500+ pages)**: 2-5 minutes (normal)

**Tips**:
- Start with smaller files for testing
- Upload large files overnight
- Be patient on first upload

---

### Issue: Out of Memory

**Symptoms**:
- System becomes sluggish
- Ollama crashes during processing
- Docker containers restart unexpectedly

**Solution**:

1. **Close unnecessary applications**:
   - Browser tabs
   - Heavy IDEs (VS Code, IntelliJ, etc.)
   - Video editing software
   - Games

2. **Check available RAM**:
   - Open Task Manager → Performance → Memory
   - Need at least 4GB free for Ollama
   - Optimal: 8GB+ free

3. **Increase Docker memory** (if using Docker Desktop):
   - Docker Desktop → Settings → Resources
   - Increase Memory to at least 8GB
   - Click "Apply & Restart"

4. **Process one file at a time**:
   - Don't upload multiple large files simultaneously
   - Wait for each to finish before next upload

---

## Advanced Configuration

### Using a Different Embedding Model

Ollama supports multiple embedding models. Alternatives to `nomic-embed-text`:

#### Option 1: all-minilm (Smaller, Faster)
```powershell
ollama pull all-minilm
```

Then in `.env`:
```bash
EMBEDDINGS_MODEL=all-minilm
```

**Pros**: Faster, uses less RAM (80MB)
**Cons**: Slightly lower quality

---

#### Option 2: mxbai-embed-large (Larger, Higher Quality)
```powershell
ollama pull mxbai-embed-large
```

Then in `.env`:
```bash
EMBEDDINGS_MODEL=mxbai-embed-large
```

**Pros**: Best quality embeddings
**Cons**: Slower, requires more RAM (670MB)

---

### Adjusting Chunk Size

**For technical books with dense information**:
```bash
CHUNK_SIZE=1000  # Smaller chunks = more precise search
```

**For narrative books (novels, biographies)**:
```bash
CHUNK_SIZE=3000  # Larger chunks = more context per result
```

**Default (balanced)**:
```bash
CHUNK_SIZE=1500  # Good for most use cases
```

---

### Creating Separate Collections

For organizing different document types:

**Collection 1: Technical Books**
```bash
COLLECTION_NAME=tech_books
```

**Collection 2: Research Papers** (change .env and restart):
```bash
COLLECTION_NAME=research_papers
```

**Collection 3: Company Documents**:
```bash
COLLECTION_NAME=company_docs
```

**Note**: Each collection stores embeddings separately. To switch collections:
1. Update `COLLECTION_NAME` in `.env`
2. Restart LibreChat containers
3. Re-upload documents for new collection

---

## Performance Tips

### GPU Acceleration

**If you have an NVIDIA GPU**:
- Ollama automatically uses GPU for faster embeddings
- No configuration needed!

**Verify GPU usage**:
```powershell
nvidia-smi
```

Look for "ollama" in the process list when embedding files.

**Expected speedup**:
- CPU: 30-60 seconds per document
- GPU: 5-15 seconds per document

---

### RAM Optimization

**Minimum requirements**:
- 4GB free RAM for basic operation
- 8GB free RAM recommended
- 16GB+ free RAM optimal

**Monitor RAM usage**:
```powershell
# Check Ollama memory usage
ollama ps
```

Shows model size loaded in memory (e.g., 548MB for nomic-embed-text).

---

### Disk Space Management

**Space usage breakdown**:
- Ollama model: 274MB (one-time)
- Vector database: ~10-20MB per book (varies by size)
- 60 books: ~500MB-1GB vector database

**Check vector database size**:
```powershell
docker system df -v | findstr pgdata2
```

**Clear vector database** (if needed):
```powershell
docker-compose -f docker-compose.windows.yml down
docker volume rm librechat_pgdata2
docker-compose -f docker-compose.windows.yml up -d
```

⚠️ **Warning**: This deletes ALL embeddings. You'll need to re-upload all documents!

---

## Batch Upload Strategy (60+ Books)

### Recommended Approach

**Session 1 (Day 1 Morning)**: 10 smallest books
- Test system stability
- Identify any issues early
- Verify embedding quality

**Session 2 (Day 1 Afternoon)**: 10 medium books
- System is warmed up (faster processing)
- Comfortable batch size

**Session 3 (Day 1 Evening/Overnight)**: 15 books
- Let it run while you sleep
- Wake up to 35 books embedded ✅

**Session 4 (Day 2)**: 15 books
- Continue throughout the day

**Session 5 (Day 3)**: Remaining 10 books
- Complete your library! 🎉

### Tips for Large Batches

1. **Sort by file size first**:
   - Start with smallest files
   - Build confidence before large PDFs

2. **Monitor disk space**:
   - Check available space before each batch
   - Ensure 5GB+ free recommended

3. **Don't close LibreChat browser tab**:
   - Keep tab open during uploads
   - Background tab is fine

4. **Upload multiple files at once**:
   - Select multiple PDFs in file picker
   - Let LibreChat process queue

5. **Take breaks between batches**:
   - Let system cool down (if needed)
   - Review embedded content quality

---

## Maintenance

### Updating Ollama

**Check for updates** periodically (every 2-3 months):

1. Visit: https://ollama.com/download
2. Download latest installer
3. Run installer (updates in-place)
4. Verify: `ollama --version`

**No need to restart LibreChat** after Ollama updates.

---

### Updating Models

Models improve over time. **Update with**:
```powershell
ollama pull nomic-embed-text
```

This downloads the latest version without removing the old one.

**After updating model**:
1. Restart LibreChat containers
2. New uploads use updated model
3. Old embeddings remain unchanged

**To re-embed with new model**:
1. Clear vector database (see Disk Space Management above)
2. Re-upload all documents

---

### Checking Ollama Status

**View running models**:
```powershell
ollama ps
```

**View all downloaded models**:
```powershell
ollama list
```

**Stop a running model** (free up RAM):
```powershell
ollama stop nomic-embed-text
```

**Start Ollama service manually**:
```powershell
ollama serve
```

---

## Getting Help

### Ollama-Specific Issues

**Official Resources**:
- Ollama Documentation: https://github.com/ollama/ollama
- Ollama Discord: https://discord.gg/ollama
- GitHub Issues: https://github.com/ollama/ollama/issues

### LibreChat RAG Issues

**LibreChat Resources**:
- LibreChat Discord: https://discord.librechat.ai
- RAG API Docs: https://docs.librechat.ai/features/rag_api
- GitHub Issues: https://github.com/danny-avila/LibreChat/issues

### Check Logs

**RAG API logs** (embedding errors):
```powershell
docker logs rag_api
```

**Main LibreChat logs**:
```powershell
docker logs LibreChat
```

**Ollama logs** (if running as service):
```powershell
# Check Windows Event Viewer → Application Logs
# Or run ollama serve in PowerShell to see live logs
```

**Search for specific errors**:
```powershell
docker logs rag_api | Select-String -Pattern "ollama|error|fail"
```

---

## Summary Checklist

✅ **Installation Steps**:
- [ ] Install Ollama from ollama.com
- [ ] Download nomic-embed-text model
- [ ] Configure .env with Ollama settings
- [ ] Restart LibreChat containers
- [ ] Test with small PDF file

✅ **Verification**:
- [ ] `ollama --version` shows version
- [ ] `ollama list` shows nomic-embed-text
- [ ] `docker ps` shows all containers running
- [ ] Test file uploads successfully
- [ ] AI responses reference uploaded content

✅ **Ready for Production**:
- [ ] Tested with multiple file types
- [ ] Verified embedding quality
- [ ] Disk space monitored
- [ ] Batch upload strategy planned

---

## Cost Summary

| Item | Cost |
|------|------|
| Ollama installation | **$0** |
| nomic-embed-text model | **$0** |
| LibreChat setup | **$0** |
| Unlimited embeddings | **$0** |
| Ongoing maintenance | **$0** |
| **TOTAL** | **$0 forever** |

**vs. OpenAI embeddings**: ~$50-100 for 60 books (one-time)
**vs. HuggingFace Pro**: $9/month (need to keep paying if you add more books)

---

## Next Steps

1. ✅ Complete installation (follow steps above)
2. 📚 Prepare your 60 PDF books
3. 🧪 Test with 1-2 small books first
4. 🚀 Upload remaining books in batches
5. 💬 Start querying your personal knowledge base!

**Congratulations! You now have unlimited, free, local embeddings for your entire book library!** 🎉
