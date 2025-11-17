# Quick Start: Judge0 MCP Integration

**5-Minute Setup Guide** ⚡

---

## ✅ Prerequisites

- [x] LibreChat running
- [x] RapidAPI key for Judge0 (FREE tier at https://rapidapi.com/judge0-official/api/judge0-ce)
- [x] Judge0 MCP server code already in repository (commit 40e7ef3)

---

## 🚀 5 Steps to Code Execution

### Step 1: Install Dependencies (2 min)

```powershell
cd C:\path\to\Libre\mcp-servers\judge0
npm install
```

**Expected**: `added 15 packages`

---

### Step 2: Add API Key (1 min)

Edit `.env` and add:

```bash
RAPIDAPI_KEY=your_rapidapi_key_here
```

---

### Step 3: Activate Configuration (1 min)

```powershell
cd C:\path\to\Libre

# Use the Vertex AI config (already has Judge0 MCP)
Copy-Item librechat.vertex-ai.yaml librechat.yaml
```

---

### Step 4: Restart LibreChat (1 min)

```powershell
docker-compose -f docker-compose.windows.yml restart

# Wait 30 seconds
Start-Sleep -Seconds 30

# Check logs
docker-compose logs api | Select-String -Pattern "judge0"
```

**Expected in logs**:
```
✓ Connected to Judge0 API successfully
✓ Supports 70+ programming languages
Judge0 MCP Server running
```

---

### Step 5: Create Agent (30 sec)

1. Open http://localhost:3080
2. Click **Agents** → **+ Create Agent**
3. Name: `Code Assistant`
4. Provider: `Vertex-AI` (or any)
5. Model: `deepseek-v3` (or any)
6. Tools: ✅ **Select all 4 Judge0 tools**:
   - execute_code
   - execute_python
   - execute_javascript
   - list_languages
7. Click **Save**

---

## 🧪 Quick Test

**Start conversation with your agent:**

**You**: `Write Python code to calculate fibonacci(10) and run it`

**Expected**: Agent executes code and shows `Fibonacci(10) = 55`

---

## ✅ Verification Commands

```powershell
# 1. Test Judge0 API
.\test-judge0.ps1

# 2. Check logs
docker-compose logs api | Select-String "judge0"

# 3. Verify config
Get-Content librechat.yaml | Select-String -Pattern "judge0" -Context 2

# 4. Check dependencies
cd mcp-servers\judge0
npm list
```

---

## 🐛 Quick Troubleshooting

### Tools not appearing?
```powershell
docker-compose restart
```

### API connection error?
```powershell
# Verify API key
Get-Content .env | Select-String "RAPIDAPI_KEY"

# Test connection
.\test-judge0.ps1
```

### Dependencies missing?
```powershell
cd mcp-servers\judge0
npm install
```

---

## 📚 Full Documentation

- **Detailed Integration**: See `JUDGE0 MCP - LIBRECHAT INTEGRATION.md`
- **MCP Server Guide**: See `JUDGE0 MCP SERVER - SETUP GUIDE.md`
- **Private Repo Setup**: See `JUDGE0 MCP - PRIVATE REPO SETUP.md`

---

## 🎯 What You Can Do Now

Execute code in **70+ languages**:
- Python, JavaScript, TypeScript, Java
- C, C++, C#, Go, Rust, PHP, Ruby
- Swift, Kotlin, R, SQL, Bash
- Haskell, Clojure, Elixir, and 50+ more!

**Features**:
- ✅ Auto language detection
- ✅ Execution time & memory metrics
- ✅ Error handling & debugging
- ✅ Standard input support
- ✅ Timeout protection

---

## 🚀 Example Usage

### Python Data Analysis
**You**: "Analyze this data: [23, 45, 12, 67, 89]. Calculate mean, median, and std dev."

### JavaScript Algorithms
**You**: "Implement quicksort in JavaScript and test with [5, 2, 8, 1, 9]"

### Multi-Language
**You**: "Show me 'Hello World' in Python, JavaScript, Java, and Go. Execute all."

### Debugging
**You**: "This code has an error: print(undefined_var). Fix and run it."

---

**Done!** 🎉 Your LibreChat now has code execution superpowers!

**Need help?** Check the troubleshooting section above or review the full integration guide.
