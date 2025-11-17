# Quick Start: Judge0 MCP via npm Package

**Using Official Package**: `@javaguru/server-judge0@1.1.0` 🚀

---

## 🎯 3-Minute Setup

### Prerequisites

✅ LibreChat running
✅ Node.js >= 18.0.0
✅ RapidAPI key ([Get FREE key here](https://rapidapi.com/judge0-official/api/judge0-ce))

---

## 🚀 Installation

### Step 1: Install npm Package (1 min)

```powershell
# Install globally
npm install -g @javaguru/server-judge0

# Verify installation
server-judge0 --version
# Should show: 1.1.0
```

---

### Step 2: Configure LibreChat (1 min)

**Add API key to `.env`**:

```bash
RAPIDAPI_KEY=your_rapidapi_key_here
```

**Update `librechat.yaml`** (or copy from template):

```powershell
# Option A: Use the pre-configured template
Copy-Item librechat.vertex-ai.yaml librechat.yaml

# Option B: Manually add to existing librechat.yaml
```

Add this to your `librechat.yaml`:

```yaml
mcp:
  servers:
    judge0:
      command: server-judge0
      env:
        RAPIDAPI_KEY: ${RAPIDAPI_KEY}
```

---

### Step 3: Restart LibreChat (1 min)

```powershell
cd C:\path\to\Libre

# Restart
docker-compose -f docker-compose.windows.yml restart

# Wait for startup
Start-Sleep -Seconds 30

# Check logs
docker-compose logs api | Select-String "judge0"
```

**Expected**:
```
✓ Connected to Judge0 API successfully
✓ Supports 70+ programming languages
Judge0 MCP Server running
```

---

## ✅ Verify

### Quick Test

```powershell
# Test the package directly
$env:RAPIDAPI_KEY="your_key"
server-judge0
# Should start without errors (Ctrl+C to stop)
```

### Create Agent

1. Open http://localhost:3080
2. **Agents** → **+ Create Agent**
3. Name: `Code Assistant`
4. Tools: ✅ Check all Judge0 tools:
   - execute_code
   - execute_python
   - execute_javascript
   - list_languages
5. **Save**

### Test Execution

**Ask your agent**:
> "Write Python code to calculate fibonacci(10) and execute it"

**Expected**:
```
✅ Execution Successful
Output: Fibonacci(10) = 55
Execution time: 0.023s
```

---

## 🎯 What You Get

**70+ Programming Languages**:
- Python, JavaScript, TypeScript, Java
- C, C++, C#, Go, Rust, PHP, Ruby
- Swift, Kotlin, R, SQL, Bash
- And 55+ more!

**Features**:
- ✅ Auto language detection
- ✅ Execution time & memory metrics
- ✅ Error handling
- ✅ Standard input support
- ✅ Timeout protection

---

## 🔄 Updates

```powershell
# Check for updates
npm outdated -g @javaguru/server-judge0

# Update to latest
npm update -g @javaguru/server-judge0

# Restart LibreChat
docker-compose restart
```

---

## 🐛 Troubleshooting

### Command not found?

```powershell
# Verify installation
npm list -g @javaguru/server-judge0

# Reinstall if needed
npm install -g @javaguru/server-judge0
```

### Tools not appearing?

```powershell
# Check configuration
Get-Content librechat.yaml | Select-String "judge0" -Context 2

# Verify .env
Get-Content .env | Select-String "RAPIDAPI_KEY"

# Restart
docker-compose restart
```

### Connection errors?

```powershell
# Test API key with existing script
.\test-judge0.ps1
```

---

## 📚 Documentation

- **Full Integration Guide**: `JUDGE0 MCP - NPM PACKAGE INTEGRATION.md`
- **Detailed Setup**: `JUDGE0 MCP - LIBRECHAT INTEGRATION.md`
- **npm Package**: https://www.npmjs.com/package/@javaguru/server-judge0
- **GitHub Repo**: https://github.com/zednik-max/judge0-mcp-server

---

## 🎉 Success!

You now have code execution in **70+ languages** powered by the official npm package!

**Example Uses**:
- "Calculate prime numbers up to 100 in Python"
- "Sort this array with quicksort in C++"
- "Write a regex validator in JavaScript and test it"
- "Show me 'Hello World' in 5 different languages"

---

**Happy coding! 🚀**

**Package**: [@javaguru/server-judge0](https://www.npmjs.com/package/@javaguru/server-judge0)
