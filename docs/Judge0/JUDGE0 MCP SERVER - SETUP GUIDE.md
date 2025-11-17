# Judge0 MCP Server - Complete Setup Guide

Execute code in **70+ programming languages** directly from LibreChat! This guide will help you set up the Judge0 MCP server.

---

## 📖 Table of Contents

1. [What You're Building](#what-youre-building)
2. [Prerequisites](#prerequisites)
3. [Installation Steps](#installation-steps)
4. [Configuration](#configuration)
5. [Testing](#testing)
6. [Usage in LibreChat](#usage-in-librechat)
7. [Troubleshooting](#troubleshooting)
8. [Advanced Configuration](#advanced-configuration)

---

## 🎯 What You're Building

After this setup, you'll have:

```
LibreChat Agent
    ↓
Calls: execute_code("print('hello')", "python")
    ↓
Judge0 MCP Server
    ↓
Judge0 API (RapidAPI or Self-Hosted)
    ↓
Secure Sandboxed Execution
    ↓
Returns: "hello"
```

**Features:**
- ✅ Execute code in 70+ languages (Python, JS, Java, C++, Go, Rust, etc.)
- ✅ Secure sandboxed environment
- ✅ Auto language detection
- ✅ Performance metrics (time, memory)
- ✅ Works with ALL AI models in LibreChat
- ✅ FREE tier available (50 executions/day)

---

## ✅ Prerequisites

### Required
- ✅ LibreChat installed and running
- ✅ Node.js 18+ installed
- ✅ Judge0 API key from RapidAPI (FREE tier available)

### Optional
- Self-hosted Judge0 instance (for unlimited FREE usage)

---

## 📥 Installation Steps

### Step 1: Get Your Judge0 API Key

**Option A: RapidAPI (Recommended for Quick Start)**

1. Go to https://rapidapi.com/judge0-official/api/judge0-ce
2. Click **"Sign Up"** (top right)
3. After signing up, click **"Subscribe to Test"**
4. Choose **"Basic"** plan (it says **"FREE"** - 50 requests/day)
5. Copy your **X-RapidAPI-Key** (you'll need this!)

**Option B: Self-Hosted (For Unlimited Usage)**

See [Self-Hosting Judge0](#self-hosting-judge0) section below.

---

### Step 2: Install MCP Server Dependencies

```bash
# Navigate to LibreChat directory
cd /path/to/your/LibreChat

# Install Judge0 MCP server dependencies
cd mcp-servers/judge0
npm install
```

**Expected output:**
```
added 15 packages in 3s
```

---

### Step 3: Configure Environment Variables

**On your local machine**, edit the `.env` file:

```bash
# Add these lines to your .env file
RAPIDAPI_KEY=your_actual_rapidapi_key_here

# Optional (if using self-hosted)
# JUDGE0_BASE_URL=http://localhost:2358
```

**Important:**
- Replace `your_actual_rapidapi_key_here` with your actual RapidAPI key
- Do NOT use quotes around the value
- Do NOT commit this file to git

---

### Step 4: Configure LibreChat

**Option A: Use the Pre-Configured File**

If you're using `librechat.vertex-ai.yaml`, it already has the MCP configuration! Just copy it:

```bash
# Copy the configuration
cp librechat.vertex-ai.yaml librechat.yaml
```

**Option B: Add to Existing Configuration**

If you already have a `librechat.yaml`, add this section:

```yaml
# Add at the end of your librechat.yaml
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

### Step 5: Restart LibreChat

```bash
# Windows
docker-compose -f docker-compose.windows.yml restart

# Linux/Mac
docker-compose restart
```

**Wait for:** "Judge0 MCP Server running" in the logs

---

### Step 6: Verify Installation

Check the logs to confirm the MCP server started:

```bash
# Windows PowerShell
docker-compose logs api | Select-String -Pattern "judge0"

# Linux/Mac
docker-compose logs api | grep judge0
```

**Expected output:**
```
Judge0 MCP Server starting...
✓ Connected to Judge0 API successfully
✓ Supports 70+ programming languages
✓ Ready to execute code via MCP
Judge0 MCP Server running
```

---

## ✅ Testing

### Test 1: PowerShell Quick Test (Windows)

```powershell
# Test Judge0 API directly
.\test-judge0.ps1
```

**Expected:**
```
OUTPUT:
Hello from Judge0!
```

### Test 2: MCP Server Test

```bash
cd mcp-servers/judge0

# Set your API key
# Windows PowerShell
$env:RAPIDAPI_KEY="your_key_here"
# Linux/Mac
export RAPIDAPI_KEY="your_key_here"

# Run the server
node index.js
```

**Expected:**
```
Judge0 MCP Server starting...
✓ Connected to Judge0 API successfully
✓ Supports 70+ programming languages
✓ Ready to execute code via MCP
Judge0 MCP Server running
```

Press `Ctrl+C` to stop.

---

## 🎮 Usage in LibreChat

### Create an Agent with Code Execution

1. **Open LibreChat** in your browser
2. **Go to Agents** (left sidebar)
3. **Click "Create Agent"**
4. **Configure:**
   - **Name:** "Code Execution Assistant"
   - **Provider:** Any (Vertex-AI, OpenAI, Anthropic, etc.)
   - **Model:** Choose your preferred model (e.g., `deepseek-v3`)
   - **Tools:** ✅ Enable all Judge0 tools:
     - `execute_code`
     - `execute_python`
     - `execute_javascript`
     - `list_languages`
   - **Instructions:**
     ```
     You are a helpful coding assistant with code execution capabilities.

     You can execute code in 70+ programming languages including Python,
     JavaScript, Java, C++, Go, Rust, and many more.

     When a user asks you to run code:
     1. Write or explain the code
     2. Use the appropriate execution tool
     3. Show the output and explain the results

     If the code has errors, help debug and fix them.
     ```
5. **Save the agent**

---

### Example Conversations

#### Example 1: Python Fibonacci

**User:** "Write a Python function to calculate Fibonacci numbers and test it with n=10"

**Agent:**
```python
def fibonacci(n):
    if n <= 1:
        return n
    a, b = 0, 1
    for _ in range(n - 1):
        a, b = b, a + b
    return b

# Test with n=10
result = fibonacci(10)
print(f"Fibonacci(10) = {result}")
```

Let me execute this:

[Uses `execute_python` tool]

**Output:**
```
✅ Execution Successful

Language: Python

Output:
Fibonacci(10) = 55

Performance:
- Execution time: 0.023s
- Memory used: 3.2 MB
```

---

#### Example 2: JavaScript Sorting

**User:** "Show me how to sort an array in JavaScript and run it"

**Agent:**
```javascript
const numbers = [64, 34, 25, 12, 22, 11, 90];

console.log("Original:", numbers);

// Using built-in sort
const sorted = [...numbers].sort((a, b) => a - b);

console.log("Sorted:", sorted);
```

[Uses `execute_javascript` tool]

**Output:**
```
✅ Execution Successful

Language: JavaScript

Output:
Original: [ 64, 34, 25, 12, 22, 11, 90 ]
Sorted: [ 11, 12, 22, 25, 34, 64, 90 ]

Performance:
- Execution time: 0.018s
- Memory used: 8.5 MB
```

---

#### Example 3: List Available Languages

**User:** "What programming languages can you execute?"

**Agent:** Let me check...

[Uses `list_languages` tool]

**Output:**
```
# Supported Programming Languages (70+)

## Popular Languages

- Python (ID: 71)
  - Aliases: python, python3, py

- JavaScript (ID: 63)
  - Aliases: javascript, js, node, nodejs

- TypeScript (ID: 74)
  - Aliases: typescript, ts

[...and 67 more languages!]
```

---

## 🐛 Troubleshooting

### Issue 1: "Cannot connect to Judge0 API"

**Symptoms:**
```
WARNING: Cannot connect to Judge0 API. Check your configuration.
```

**Solutions:**

1. **Check API Key:**
   ```bash
   # Windows PowerShell
   Get-Content .env | Select-String RAPIDAPI_KEY

   # Linux/Mac
   grep RAPIDAPI_KEY .env
   ```
   Make sure it's set and correct!

2. **Verify RapidAPI Subscription:**
   - Go to https://rapidapi.com/developer/apps
   - Check you're subscribed to Judge0 CE
   - Verify the FREE "Basic" plan is active

3. **Test API Directly:**
   ```powershell
   .\test-judge0.ps1
   ```

4. **Check Internet Connection:**
   ```powershell
   Test-NetConnection -ComputerName judge0-ce.p.rapidapi.com -Port 443
   ```

---

### Issue 2: "MCP Server Not Starting"

**Symptoms:**
- No "Judge0 MCP Server" messages in logs
- Tools not appearing in LibreChat

**Solutions:**

1. **Check MCP Configuration:**
   ```bash
   # Verify mcp section exists in librechat.yaml
   cat librechat.yaml | grep -A 10 "mcp:"
   ```

2. **Verify File Paths:**
   ```bash
   # Check MCP server exists
   ls -la mcp-servers/judge0/index.js
   ```

3. **Install Dependencies:**
   ```bash
   cd mcp-servers/judge0
   npm install
   ```

4. **Check Node.js Version:**
   ```bash
   node --version
   # Should be 18.0.0 or higher
   ```

5. **Check LibreChat Logs:**
   ```bash
   docker-compose logs api | grep -i mcp
   ```

---

### Issue 3: "Rate Limit Exceeded"

**Symptoms:**
```
❌ Error: Rate limit exceeded. Please try again later.
```

**Cause:** Exceeded 50 executions/day on FREE tier

**Solutions:**

**Option A: Wait**
- Rate limit resets every 24 hours
- Check RapidAPI dashboard for reset time

**Option B: Upgrade Plan**
- Go to https://rapidapi.com/judge0-official/api/judge0-ce/pricing
- Choose a paid plan

**Option C: Self-Host** (Unlimited FREE)
- See [Self-Hosting Judge0](#self-hosting-judge0) below

---

### Issue 4: "Unknown Language"

**Symptoms:**
```
❌ Unsupported language: "python3.9"
```

**Solution:**

Use the `list_languages` tool to see all supported language names and aliases.

**Common Aliases:**
- Python: `python`, `python3`, `py`
- JavaScript: `javascript`, `js`, `node`
- C++: `cpp`, `c++`, `cplusplus`
- C#: `csharp`, `c#`, `cs`

---

### Issue 5: "Execution Timeout"

**Symptoms:**
```
❌ Execution Time Limit Exceeded
```

**Cause:** Code takes longer than timeout limit

**Solution:**

Increase timeout in the tool call:
```json
{
  "code": "# your long-running code",
  "language": "python",
  "timeout": 15
}
```

Maximum timeout: 15 seconds

---

## 🏠 Self-Hosting Judge0

For **unlimited FREE usage**, self-host Judge0:

### Quick Docker Setup

```bash
# Clone Judge0
git clone https://github.com/judge0/judge0.git
cd judge0

# Start Judge0 services
docker-compose up -d

# Judge0 API available at: http://localhost:2358
```

### Configure LibreChat for Self-Hosted

Update `.env`:
```bash
# Comment out RapidAPI key
# RAPIDAPI_KEY=...

# Add self-hosted URL
JUDGE0_BASE_URL=http://localhost:2358
```

Update `librechat.yaml`:
```yaml
mcp:
  servers:
    judge0:
      command: node
      args:
        - ./mcp-servers/judge0/index.js
      env:
        JUDGE0_BASE_URL: ${JUDGE0_BASE_URL}
```

Restart LibreChat:
```bash
docker-compose restart
```

**Advantages:**
- ✅ Unlimited executions
- ✅ No API costs
- ✅ Complete privacy
- ✅ Custom resource limits
- ✅ Full control

---

## 🔧 Advanced Configuration

### Custom Resource Limits

Modify `mcp-servers/judge0/lib/judge0-client.js`:

```javascript
async execute({ code, language, stdin = '', timeout = 5, memory = 128000 }) {
  const submission = {
    source_code: code,
    language_id: languageId,
    stdin: stdin || '',
    cpu_time_limit: timeout,      // ← Adjust (max 15s)
    memory_limit: memory,          // ← Adjust (in KB)
  };
  // ...
}
```

### Add Language-Specific Tools

Add to `mcp-servers/judge0/index.js`:

```javascript
{
  name: 'execute_java',
  description: 'Execute Java code',
  inputSchema: {
    type: 'object',
    properties: {
      code: { type: 'string', description: 'Java code' },
      stdin: { type: 'string', description: 'Standard input (optional)' },
    },
    required: ['code'],
  },
}
```

Add handler:
```javascript
case 'execute_java':
  return await handleExecuteCode({ ...args, language: 'java' });
```

### Multiple Judge0 Instances

Configure multiple MCP servers for different use cases:

```yaml
mcp:
  servers:
    judge0-free:
      command: node
      args: [./mcp-servers/judge0/index.js]
      env:
        RAPIDAPI_KEY: ${RAPIDAPI_KEY}

    judge0-premium:
      command: node
      args: [./mcp-servers/judge0/index.js]
      env:
        JUDGE0_BASE_URL: http://premium-judge0:2358
```

---

## 📊 Monitoring & Analytics

### Check Usage (RapidAPI)

1. Go to https://rapidapi.com/developer/apps
2. Select your app
3. View API calls and quota

### Check Self-Hosted Stats

```bash
# View Judge0 logs
docker-compose logs judge0

# Monitor resource usage
docker stats
```

---

## 🔒 Security Best Practices

1. **Never commit API keys** to git
   ```bash
   # Add to .gitignore
   echo ".env" >> .gitignore
   ```

2. **Set appropriate timeouts** to prevent infinite loops
   ```json
   { "timeout": 5 }  // Default
   ```

3. **Monitor usage** via RapidAPI dashboard

4. **Use self-hosted** for sensitive code

5. **Review code** before execution (agents should explain what code does)

---

## 🎉 Success Checklist

After setup, verify:

- ✅ MCP server starts successfully
- ✅ "Connected to Judge0 API successfully" in logs
- ✅ Tools appear in LibreChat agent configuration
- ✅ Can execute Python code
- ✅ Can execute JavaScript code
- ✅ `list_languages` tool works
- ✅ Error handling works correctly

---

## 📚 What's Next?

Now that you have code execution working:

1. **Combine with Web Search** - Execute code that processes web data
2. **Use with Vertex AI Models** - Run code with DeepSeek, Llama 4, etc.
3. **Create Specialized Agents:**
   - Data analysis agent (Python + R + SQL)
   - Web development agent (JavaScript + TypeScript + HTML)
   - Systems programming agent (C + C++ + Rust + Go)
4. **Share with Community** - This is open source!

---

## 🤝 Contributing

Found a bug? Have an improvement?

1. Open an issue on GitHub
2. Submit a pull request
3. Share your use cases!

---

## 📖 Resources

- **Judge0 Documentation:** https://ce.judge0.com/
- **LibreChat MCP Guide:** https://www.librechat.ai/docs/features/mcp
- **RapidAPI Judge0:** https://rapidapi.com/judge0-official/api/judge0-ce
- **MCP Specification:** https://modelcontextprotocol.io/

---

## 🙏 Credits

- **Judge0** - Amazing code execution platform
- **LibreChat** - Powerful AI chat interface
- **Model Context Protocol** - Tool integration standard
- **LibreChat Community** - For testing and feedback

---

**Built with ❤️ for the LibreChat community!**

**Ready to execute some code? Let's go! 🚀**
