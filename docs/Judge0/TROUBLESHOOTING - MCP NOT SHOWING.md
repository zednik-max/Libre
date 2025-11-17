# Troubleshooting: Judge0 MCP Tools Not Appearing

**Issue**: Judge0 tools don't appear in Agent configuration
**Expected**: 4 tools (execute_code, execute_python, execute_javascript, list_languages)

---

## 🔍 Diagnostic Steps

Run these commands on your **Windows machine** in PowerShell:

### Step 1: Check if npm package is installed

```powershell
# Check global installation
npm list -g @javaguru/server-judge0

# Expected output:
# @javaguru/server-judge0@1.1.0
```

**If not found**:
```powershell
npm install -g @javaguru/server-judge0
```

---

### Step 2: Test MCP server standalone

```powershell
# Set API key
$env:RAPIDAPI_KEY="your_rapidapi_key_here"

# Run server
server-judge0

# Expected output:
# Judge0 MCP Server starting...
# ✓ Connected to Judge0 API successfully
# ✓ Supports 70+ programming languages
# Judge0 MCP Server running

# Press Ctrl+C to stop
```

**If you get "command not found"**:
```powershell
# Find where npm packages are installed
npm root -g
# Example: C:\Users\YourUser\AppData\Roaming\npm\node_modules

# Try running directly
node "C:\Users\YourUser\AppData\Roaming\npm\node_modules\@javaguru\server-judge0\index.js"
```

---

### Step 3: Verify librechat.yaml configuration

```powershell
cd C:\path\to\Libre

# Check MCP configuration
Get-Content librechat.yaml | Select-String -Pattern "mcp:" -Context 0,10
```

**Expected output**:
```yaml
mcp:
  servers:
    judge0:
      command: server-judge0
      env:
        RAPIDAPI_KEY: ${RAPIDAPI_KEY}
```

**If different**, update librechat.yaml:
```powershell
# Use the vertex-ai config
Copy-Item librechat.vertex-ai.yaml librechat.yaml -Force
```

---

### Step 4: Verify .env has RAPIDAPI_KEY

```powershell
Get-Content .env | Select-String "RAPIDAPI_KEY"

# Expected:
# RAPIDAPI_KEY=your_actual_key_here
```

**If missing**:
```powershell
# Open .env in notepad
notepad .env

# Add this line:
# RAPIDAPI_KEY=your_rapidapi_key_here
```

---

### Step 5: Check Docker containers are running

```powershell
docker-compose ps

# All should show "Up"
```

---

### Step 6: Check LibreChat logs for MCP

```powershell
# Check recent logs
docker-compose logs api --tail=100 | Select-String -Pattern "mcp|judge0"

# Or follow logs in real-time
docker-compose logs -f api
# Look for Judge0 MCP messages
# Press Ctrl+C to stop
```

**What to look for**:

✅ **Success**:
```
Starting MCP server: judge0
Judge0 MCP Server starting...
✓ Connected to Judge0 API successfully
✓ Supports 70+ programming languages
Judge0 MCP Server running
```

❌ **Error - Command not found**:
```
Error: spawn server-judge0 ENOENT
```
**Solution**: Install npm package globally or use full path

❌ **Error - API key missing**:
```
WARNING: RAPIDAPI_KEY environment variable not set
```
**Solution**: Add RAPIDAPI_KEY to .env

❌ **Error - Connection failed**:
```
ERROR: Cannot connect to Judge0 API
```
**Solution**: Verify API key is correct, test with test-judge0.ps1

---

## 🔧 Fix #1: Install npm package

```powershell
# Install globally
npm install -g @javaguru/server-judge0

# Verify
server-judge0 --version
# Should show: 1.1.0
```

---

## 🔧 Fix #2: Use full path in librechat.yaml

If global installation doesn't work, use the full path:

```powershell
# Find installation path
npm root -g
# Example: C:\Users\YourUser\AppData\Roaming\npm\node_modules
```

**Edit librechat.yaml**:
```yaml
mcp:
  servers:
    judge0:
      command: node
      args:
        - C:\Users\YourUser\AppData\Roaming\npm\node_modules\@javaguru\server-judge0\index.js
      env:
        RAPIDAPI_KEY: ${RAPIDAPI_KEY}
```

**Or use the local copy** (already in your repo):
```yaml
mcp:
  servers:
    judge0:
      command: node
      args:
        - ./mcp-servers/judge0/index.js
      env:
        RAPIDAPI_KEY: ${RAPIDAPI_KEY}
```

---

## 🔧 Fix #3: Ensure dependencies are installed (if using local copy)

```powershell
cd mcp-servers\judge0

# Check if node_modules exists
Test-Path node_modules

# If False, install dependencies
npm install

# Verify
npm list
```

---

## 🔄 After Making Changes

**Always restart LibreChat**:

```powershell
cd C:\path\to\Libre

# Restart
docker-compose -f docker-compose.windows.yml restart

# Wait 30 seconds
Start-Sleep -Seconds 30

# Check logs
docker-compose logs api --tail=50 | Select-String "judge0"
```

---

## ✅ Verification Checklist

Once MCP server starts successfully:

1. **Open LibreChat**: http://localhost:3080
2. **Go to Agents** (left sidebar)
3. **Click "Create Agent"**
4. **Scroll to Tools section**
5. **Look for Judge0 tools**:
   - [ ] execute_code
   - [ ] execute_python
   - [ ] execute_javascript
   - [ ] list_languages

**If you see all 4 tools** → ✅ SUCCESS!

**If you still don't see them**:
- Check logs again: `docker-compose logs api | Select-String "mcp"`
- Verify MCP server started without errors
- Try restarting LibreChat completely: `docker-compose down && docker-compose up -d`

---

## 🎯 Understanding the UI

**Important distinction**:

### ❌ Code Interpreter Button (Bottom toolbar)
- This is LibreChat's **built-in** Code Interpreter
- Requires LibreChat API key (subscription unavailable)
- **Not related to Judge0 MCP**

### ✅ Judge0 MCP Tools (Agent configuration)
- Accessed via **Agents** → **Create Agent** → **Tools**
- Shows as 4 separate tools
- Enable in agent, then use that agent in chat
- **This is what you want!**

---

## 📸 Visual Guide

### Where to Find Judge0 Tools:

1. **Agents page** (left sidebar)
   ```
   + New Chat
   📂 Conversations
   👤 Agents          ← Click here
   ⚙️ Settings
   ```

2. **Create Agent button**
   ```
   [+ Create Agent]   ← Click here
   ```

3. **Tools section** (scroll down in agent form)
   ```
   Name: [Code Assistant]
   Description: [...]
   Model: [deepseek-v3]

   Tools:               ← Scroll to here
   ☐ Web Search
   ☑ execute_code       ← These are Judge0 tools
   ☑ execute_python
   ☑ execute_javascript
   ☑ list_languages
   ```

4. **Save agent**

5. **Use in chat**
   - Start new conversation
   - Select "Code Assistant" from agent dropdown
   - Ask to execute code

---

## 🆘 Still Not Working?

### Option A: Use Local Copy (Fallback)

The MCP server code is already in your repo at `mcp-servers/judge0/`:

```powershell
# Install dependencies
cd C:\path\to\Libre\mcp-servers\judge0
npm install

# Update librechat.yaml to use local path
cd C:\path\to\Libre
```

Edit `librechat.yaml`:
```yaml
mcp:
  servers:
    judge0:
      command: node
      args:
        - ./mcp-servers/judge0/index.js
      env:
        RAPIDAPI_KEY: ${RAPIDAPI_KEY}
```

Restart LibreChat:
```powershell
docker-compose restart
```

### Option B: Check Node.js Version

```powershell
node --version
# Should be v18.0.0 or higher
```

If lower than 18:
- Update Node.js from https://nodejs.org/

### Option C: Complete Reset

```powershell
# 1. Stop LibreChat
docker-compose down

# 2. Uninstall npm package
npm uninstall -g @javaguru/server-judge0

# 3. Reinstall
npm install -g @javaguru/server-judge0

# 4. Verify .env
Get-Content .env | Select-String "RAPIDAPI_KEY"

# 5. Verify librechat.yaml
Get-Content librechat.yaml | Select-String "judge0" -Context 3

# 6. Start LibreChat
docker-compose up -d

# 7. Wait and check logs
Start-Sleep -Seconds 30
docker-compose logs api | Select-String "judge0"
```

---

## 📞 Get Help

**If still stuck, provide**:

1. **npm installation check**:
   ```powershell
   npm list -g @javaguru/server-judge0
   ```

2. **LibreChat logs**:
   ```powershell
   docker-compose logs api --tail=100 | Select-String "mcp|judge0|error"
   ```

3. **Configuration**:
   ```powershell
   Get-Content librechat.yaml | Select-String "mcp" -Context 5
   ```

4. **Standalone test result**:
   ```powershell
   $env:RAPIDAPI_KEY="your_key"
   server-judge0
   ```

Share these outputs for debugging!

---

## ✨ Success Criteria

You know it's working when:

✅ Logs show: "Judge0 MCP Server running"
✅ Tools appear in agent configuration (4 tools)
✅ Agent can execute code and show results
✅ No errors in LibreChat logs

---

**Good luck! The tools should appear once the MCP server starts successfully.** 🚀
