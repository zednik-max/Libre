# Judge0 MCP Server - LibreChat Integration Guide

**Date**: 2025-11-15
**LibreChat Version**: v0.8.1-rc1
**MCP Server Version**: 1.0.0

---

## 📋 Overview

This guide integrates the Judge0 MCP server into your LibreChat setup, enabling code execution in 70+ programming languages.

**What you already have**:
✅ Judge0 MCP server code (in `/home/user/Libre/mcp-servers/judge0/`)
✅ Configuration in `librechat.vertex-ai.yaml`
✅ RapidAPI key for Judge0

**What we'll do**:
1. Install MCP server dependencies
2. Configure environment variables
3. Activate the MCP configuration
4. Restart LibreChat
5. Test the integration
6. Create an agent with code execution capabilities

---

## 🚀 Step 1: Install MCP Server Dependencies

The MCP server code is already in your repository (from commit 40e7ef3). We just need to install its dependencies.

```powershell
# Navigate to MCP server directory
cd C:\path\to\Libre\mcp-servers\judge0

# Install dependencies
npm install
```

**Expected output:**
```
added 15 packages, and audited 16 packages in 3s

3 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

**Verify installation:**
```powershell
# Check installed packages
npm list

# Should show:
# judge0-mcp-server@1.0.0
# ├── @modelcontextprotocol/sdk@0.5.0
# ├── axios@1.6.0
# └── zod@3.22.0
```

---

## 🔧 Step 2: Configure Environment Variables

### Update .env File

You need to add your RapidAPI key to the `.env` file:

```powershell
# Navigate to LibreChat root
cd C:\path\to\Libre

# Check if RAPIDAPI_KEY already exists
Get-Content .env | Select-String "RAPIDAPI_KEY"
```

**If not present, add it:**

```powershell
# Append to .env file
@"

# Judge0 Code Execution MCP Server
RAPIDAPI_KEY=your_rapidapi_key_here
"@ | Add-Content .env
```

**Or edit manually:**
1. Open `.env` in your text editor
2. Add at the end:
   ```bash
   # Judge0 Code Execution MCP Server
   RAPIDAPI_KEY=your_rapidapi_key_here
   ```
3. Replace `your_rapidapi_key_here` with your actual RapidAPI key
4. Save the file

**Verify:**
```powershell
Get-Content .env | Select-String "RAPIDAPI_KEY"
# Should show: RAPIDAPI_KEY=your_key_here
```

---

## 📝 Step 3: Activate MCP Configuration

You already have the configuration in `librechat.vertex-ai.yaml`. We need to make sure LibreChat is using this file.

### Option A: Rename to librechat.yaml (Recommended)

```powershell
# Backup current librechat.yaml if it exists
if (Test-Path librechat.yaml) {
    Copy-Item librechat.yaml librechat.yaml.backup
}

# Use the vertex-ai configuration (includes Judge0 MCP)
Copy-Item librechat.vertex-ai.yaml librechat.yaml
```

### Option B: Keep Separate (for testing)

If you want to test without affecting your main config:

```powershell
# LibreChat will look for librechat.yaml
# Just make sure librechat.yaml has the MCP section
```

**Verify MCP configuration:**

```powershell
# Check MCP section exists
Get-Content librechat.yaml | Select-String -Pattern "mcp:" -Context 0,10

# Should show:
# mcp:
#   servers:
#     judge0:
#       command: node
#       args:
#         - ./mcp-servers/judge0/index.js
#       env:
#         RAPIDAPI_KEY: ${RAPIDAPI_KEY}
```

---

## 🔄 Step 4: Restart LibreChat

### Stop LibreChat

```powershell
# Navigate to LibreChat directory
cd C:\path\to\Libre

# Stop all containers
docker-compose -f docker-compose.windows.yml down
```

### Start LibreChat

```powershell
# Start all containers
docker-compose -f docker-compose.windows.yml up -d

# Wait for services to start (30-60 seconds)
Start-Sleep -Seconds 30
```

### Check Logs for MCP Server

```powershell
# Check API logs for Judge0 MCP messages
docker-compose logs api | Select-String -Pattern "judge0"

# Or follow logs in real-time
docker-compose logs -f api
```

**Expected log output:**
```
api_1  | Judge0 MCP Server starting...
api_1  | ✓ Connected to Judge0 API successfully
api_1  | ✓ Supports 70+ programming languages
api_1  | ✓ Ready to execute code via MCP
api_1  | Judge0 MCP Server running
```

**If you see errors**, check:
1. RAPIDAPI_KEY is set in `.env`
2. `npm install` was run in `mcp-servers/judge0/`
3. Path in librechat.yaml is correct: `./mcp-servers/judge0/index.js`

---

## ✅ Step 5: Verify Integration

### Check LibreChat is Running

```powershell
# Check all containers are up
docker-compose ps

# Should show:
# NAME                COMMAND                  STATUS
# libre_api           "node api/server/ind…"   Up
# libre_mongodb       "docker-entrypoint.s…"   Up
# libre_redis         "docker-entrypoint.s…"   Up
# libre_meilisearch   "tini -- /bin/sh -c …"   Up
# libre_rag_api       "/bin/sh -c 'uvicorn…"   Up (if using RAG)
# libre_vectordb      "docker-entrypoint.s…"   Up (if using RAG)
# vertex-proxy        "uvicorn app:app --h…"   Up
```

### Test Judge0 API Connectivity

Before testing in LibreChat, verify the MCP server can connect to Judge0:

```powershell
# Quick test of Judge0 API
.\test-judge0.ps1

# Expected output:
# ✓ Successfully connected to Judge0 API
# OUTPUT:
# Hello from Judge0!
```

---

## 🎮 Step 6: Create Agent with Code Execution

Now let's create an agent that can execute code!

### 1. Open LibreChat

Go to http://localhost:3080 (or your configured port)

### 2. Navigate to Agents

Click **"Agents"** in the left sidebar

### 3. Create New Agent

Click **"+ Create Agent"** button

### 4. Configure Agent

**Basic Information:**
- **Name**: `Code Execution Assistant`
- **Avatar**: Choose a code-related icon or upload one
- **Description**: `AI assistant with code execution capabilities in 70+ programming languages`

**Model Configuration:**
- **Provider**: Select **"Vertex-AI"** (or any provider you want)
- **Model**: Choose your preferred model (e.g., `deepseek-v3`, `llama-4-scout`)

**Tools:** ✅ **Enable Judge0 Tools**

Look for these tools in the tools list:
- ✅ `execute_code` - Execute code with auto language detection
- ✅ `execute_python` - Python execution shortcut
- ✅ `execute_javascript` - JavaScript execution shortcut
- ✅ `list_languages` - List all supported languages

**Select all 4 Judge0 tools**

**Instructions/System Prompt:**
```
You are a helpful coding assistant with code execution capabilities.

You can execute code in 70+ programming languages including:
- Python, JavaScript, TypeScript, Java, C, C++, C#, Go, Rust
- PHP, Ruby, Perl, Bash, Lua, Swift, Kotlin, R, SQL
- Haskell, Clojure, Elixir, Erlang, OCaml, F#, Lisp
- And 40+ more languages!

When a user asks you to run code:
1. Write or review the code
2. Explain what the code does
3. Use the appropriate execution tool (execute_code, execute_python, or execute_javascript)
4. Show the output and explain the results
5. If there are errors, help debug and fix them

Capabilities:
- Auto-detect programming language from code
- Execute code with standard input (stdin)
- Show execution time and memory usage
- Handle compilation and runtime errors
- Support for timeouts to prevent infinite loops

When executing code:
- Always explain what you're running before execution
- Interpret the results for the user
- If errors occur, provide helpful debugging suggestions
- Use execute_python or execute_javascript shortcuts when appropriate
- Use list_languages if user asks what languages are supported

Be helpful, educational, and ensure code is safe before execution.
```

**Settings:**
- **Temperature**: 0.7 (balanced creativity)
- **Max Tokens**: Default or higher for longer responses

### 5. Save Agent

Click **"Save"** or **"Create Agent"**

---

## 🧪 Step 7: Test the Agent

### Test 1: Simple Python Execution

**Start new conversation with your agent**

**You**: `Write a Python function to calculate the factorial of a number and test it with n=5`

**Expected Agent Behavior:**
1. Agent writes the code:
   ```python
   def factorial(n):
       if n <= 1:
           return 1
       return n * factorial(n - 1)

   result = factorial(5)
   print(f"Factorial of 5 is: {result}")
   ```

2. Agent uses `execute_python` tool

3. Agent shows output:
   ```
   ✅ Execution Successful

   Language: Python

   Output:
   Factorial of 5 is: 120

   Performance:
   - Execution time: 0.023s
   - Memory used: 3.2 MB
   ```

4. Agent explains the result

---

### Test 2: Auto Language Detection

**You**: `Run this code: console.log('Hello from Node.js!')`

**Expected Agent Behavior:**
1. Agent recognizes it's JavaScript
2. Uses `execute_code` tool (with auto-detection)
3. Shows output:
   ```
   ✅ Execution Successful

   Language: JavaScript

   Output:
   Hello from Node.js!

   Performance:
   - Execution time: 0.018s
   - Memory used: 8.5 MB
   ```

---

### Test 3: List Languages

**You**: `What programming languages can you execute?`

**Expected Agent Behavior:**
1. Uses `list_languages` tool
2. Shows categorized list:
   ```
   # Supported Programming Languages (70+)

   ## Popular Languages

   - Python (ID: 71)
     - Aliases: python, python3, py

   - JavaScript (ID: 63)
     - Aliases: javascript, js, node, nodejs

   [... and 68 more languages ...]
   ```

---

### Test 4: Error Handling

**You**: `Run this Python code: print(undefined_variable)`

**Expected Agent Behavior:**
1. Executes the code
2. Receives error:
   ```
   ❌ Execution Failed

   Language: Python
   Status: Runtime Error

   Error:
   Traceback (most recent call last):
     File "main.py", line 1, in <module>
       print(undefined_variable)
   NameError: name 'undefined_variable' is not defined
   ```

3. Agent explains the error and suggests fix:
   ```
   The code has a NameError because 'undefined_variable' is not defined.
   Here's the corrected version:

   undefined_variable = "Hello"
   print(undefined_variable)
   ```

---

### Test 5: Standard Input

**You**: `Write a Python program that asks for a name and greets the user. Use "Alice" as input.`

**Expected Agent Behavior:**
1. Writes code:
   ```python
   name = input("What's your name? ")
   print(f"Hello, {name}! Nice to meet you.")
   ```

2. Uses `execute_python` with stdin:
   ```json
   {
     "code": "name = input(\"What's your name? \")\nprint(f\"Hello, {name}! Nice to meet you.\")",
     "stdin": "Alice"
   }
   ```

3. Shows output:
   ```
   Hello, Alice! Nice to meet you.
   ```

---

### Test 6: Complex Algorithm

**You**: `Implement quicksort in C++ and sort this array: [64, 34, 25, 12, 22, 11, 90]`

**Expected Agent Behavior:**
1. Writes complete C++ implementation
2. Uses `execute_code` with language="cpp"
3. Shows sorted output
4. Displays execution time

---

## 🐛 Troubleshooting

### Issue 1: "Judge0 tools not appearing in agent configuration"

**Symptoms:**
- No execute_code, execute_python, execute_javascript tools in tools list

**Solutions:**

1. **Check MCP server logs:**
   ```powershell
   docker-compose logs api | Select-String -Pattern "judge0"
   ```

2. **Verify configuration:**
   ```powershell
   Get-Content librechat.yaml | Select-String -Pattern "mcp:" -Context 0,10
   ```

3. **Verify dependencies installed:**
   ```powershell
   cd mcp-servers\judge0
   npm list
   ```

4. **Restart LibreChat:**
   ```powershell
   docker-compose restart
   ```

---

### Issue 2: "Cannot connect to Judge0 API"

**Symptoms:**
- Log shows: `WARNING: Cannot connect to Judge0 API. Check your configuration.`

**Solutions:**

1. **Verify RAPIDAPI_KEY in .env:**
   ```powershell
   Get-Content .env | Select-String "RAPIDAPI_KEY"
   ```

2. **Test API key manually:**
   ```powershell
   .\test-judge0.ps1
   ```

3. **Check RapidAPI subscription:**
   - Go to https://rapidapi.com/developer/apps
   - Verify you're subscribed to Judge0 CE
   - Check API key is correct

4. **Verify internet connection:**
   ```powershell
   Test-NetConnection -ComputerName judge0-ce.p.rapidapi.com -Port 443
   ```

---

### Issue 3: "Rate limit exceeded"

**Symptoms:**
- Error message: `Rate limit exceeded. Please try again later.`

**Solutions:**

1. **Wait 24 hours** (FREE tier resets daily)

2. **Check usage on RapidAPI:**
   - Go to https://rapidapi.com/developer/apps
   - View your Judge0 CE usage

3. **Upgrade plan** (if needed):
   - https://rapidapi.com/judge0-official/api/judge0-ce/pricing

4. **Use self-hosted Judge0** (unlimited FREE):
   ```powershell
   # Clone Judge0
   git clone https://github.com/judge0/judge0.git
   cd judge0

   # Start with Docker
   docker-compose up -d

   # Update .env
   JUDGE0_BASE_URL=http://localhost:2358
   # Remove or comment out RAPIDAPI_KEY

   # Update librechat.yaml
   # mcp:
   #   servers:
   #     judge0:
   #       command: node
   #       args: [./mcp-servers/judge0/index.js]
   #       env:
   #         JUDGE0_BASE_URL: ${JUDGE0_BASE_URL}
   ```

---

### Issue 4: "Tool execution fails silently"

**Symptoms:**
- Agent tries to use tool but no response
- No error message shown

**Solutions:**

1. **Check API logs for errors:**
   ```powershell
   docker-compose logs api | Select-String -Pattern "error" -Context 2
   ```

2. **Test MCP server manually:**
   ```powershell
   cd mcp-servers\judge0
   $env:RAPIDAPI_KEY="your_key"
   node index.js
   # Should show: "Judge0 MCP Server running"
   ```

3. **Verify Node.js version:**
   ```powershell
   node --version
   # Should be 18.0.0 or higher
   ```

4. **Reinstall dependencies:**
   ```powershell
   cd mcp-servers\judge0
   Remove-Item -Recurse -Force node_modules
   npm install
   ```

---

### Issue 5: "MCP server path not found"

**Symptoms:**
- Log shows: `Error: Cannot find module './mcp-servers/judge0/index.js'`

**Solutions:**

1. **Verify file exists:**
   ```powershell
   Test-Path mcp-servers\judge0\index.js
   # Should return: True
   ```

2. **Check path in librechat.yaml:**
   ```yaml
   mcp:
     servers:
       judge0:
         command: node
         args:
           - ./mcp-servers/judge0/index.js  # Relative path from LibreChat root
   ```

3. **Ensure file is executable:**
   ```powershell
   # On Windows, verify file exists and has content
   Get-Content mcp-servers\judge0\index.js | Select-Object -First 10
   ```

---

## 📊 Verify Everything is Working

Run this comprehensive check:

```powershell
# 1. Check dependencies
cd mcp-servers\judge0
npm list

# 2. Check environment variable
cd ..\..
Get-Content .env | Select-String "RAPIDAPI_KEY"

# 3. Check configuration
Get-Content librechat.yaml | Select-String -Pattern "judge0" -Context 2

# 4. Test Judge0 API
.\test-judge0.ps1

# 5. Check LibreChat logs
docker-compose logs api | Select-String -Pattern "judge0"

# 6. Open LibreChat
Start-Process "http://localhost:3080"
```

**All checks passed?** ✅ You're ready to use code execution!

---

## 🎯 Usage Examples

### Example 1: Data Analysis

**You**: `I have this data: [23, 45, 12, 67, 89, 34, 56]. Calculate the mean, median, and standard deviation using Python.`

**Agent** will:
1. Write Python code using `statistics` module
2. Execute with `execute_python`
3. Show results with explanations

---

### Example 2: Algorithm Comparison

**You**: `Compare bubble sort and quicksort performance on an array of 100 random numbers. Use C++ for better performance measurement.`

**Agent** will:
1. Implement both algorithms
2. Generate random data
3. Execute and compare execution times

---

### Example 3: Web API Simulation

**You**: `Create a Node.js function that validates email addresses using regex and test it with: test@example.com, invalid.email, user@domain.co.uk`

**Agent** will:
1. Write regex validation function
2. Test with provided emails
3. Show validation results

---

### Example 4: Multi-Language

**You**: `Show me how to print "Hello World" in Python, JavaScript, Java, and Go, then execute each one.`

**Agent** will:
1. Write code for each language
2. Execute each using `execute_code` with auto-detection
3. Show outputs from all 4 languages

---

## 🚀 Advanced Configuration

### Custom Timeout

Modify timeout for long-running code:

In agent instructions, suggest:
```
For computationally intensive tasks, use timeout parameter:
{
  "code": "# long computation",
  "language": "python",
  "timeout": 15  // Maximum 15 seconds
}
```

### Custom Memory Limits

For memory-intensive operations (requires self-hosted Judge0):

```javascript
// In judge0-client.js, you can modify:
memory_limit: 256000  // 256 MB instead of default 128 MB
```

---

## 📈 Monitoring Usage

### Check RapidAPI Usage

```powershell
# Open RapidAPI dashboard
Start-Process "https://rapidapi.com/developer/apps"
```

**Monitor:**
- Daily request count (50 max on FREE tier)
- Response times
- Error rates

### Check LibreChat Logs

```powershell
# Filter for Judge0 executions
docker-compose logs api | Select-String -Pattern "execute_" | Select-Object -Last 20

# Check for errors
docker-compose logs api | Select-String -Pattern "judge0.*error" -Context 2
```

---

## ✅ Success Checklist

After integration, verify:

- [ ] MCP server dependencies installed (`npm install` in mcp-servers/judge0/)
- [ ] RAPIDAPI_KEY set in `.env`
- [ ] MCP configuration in `librechat.yaml`
- [ ] LibreChat restarted successfully
- [ ] Logs show "Judge0 MCP Server running"
- [ ] Judge0 tools appear in agent configuration
- [ ] Agent created with all 4 Judge0 tools enabled
- [ ] Python execution test passed
- [ ] JavaScript execution test passed
- [ ] Language auto-detection works
- [ ] Error handling works correctly
- [ ] `list_languages` tool works

---

## 🎉 You're All Set!

Your LibreChat now has code execution capabilities in **70+ programming languages**!

**Next steps:**
- Create specialized agents (Python expert, JS developer, etc.)
- Test with complex algorithms
- Share with your team
- Consider self-hosting Judge0 for unlimited usage
- Contribute improvements to the MCP server

**Need help?**
- Check troubleshooting section above
- Review Judge0 MCP server README
- Test with `test-judge0.ps1` script

---

**Happy coding! 🚀**
