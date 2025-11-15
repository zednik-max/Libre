# Code Interpreter Alternatives for LibreChat - FREE Options Guide

## Current Situation

LibreChat's official Code Interpreter (https://code.librechat.ai/pricing) requires a **paid subscription** that is currently **not available for new signups**. This guide explores **FREE alternatives** for code execution in LibreChat.

---

## 🎯 Best FREE Options (Recommended)

### Option 1: Judge0 CE (Community Edition) ⭐ **BEST FREE CHOICE**

**What is it?**
- Open-source, robust code execution system
- Supports **70+ programming languages**
- Can be self-hosted OR use free RapidAPI tier
- Production-ready with proper sandboxing

**Free Tier Options:**

#### A) RapidAPI Free Tier (Easiest)
- **Cost**: FREE (50 requests/day)
- **Setup**: 5 minutes
- **No server needed**
- **Perfect for**: Personal use, testing

#### B) Self-Hosted (Full Control)
- **Cost**: FREE (self-hosted)
- **Setup**: 30 minutes with Docker
- **Unlimited usage**
- **Perfect for**: Heavy users, privacy-conscious

**Supported Languages:**
- Python, JavaScript, TypeScript, Java, C, C++, C#, Go, Rust, PHP, Ruby, Swift, Kotlin, R, Bash, and 55+ more!

**Pros:**
✅ Most mature open-source solution
✅ Very active development
✅ Excellent documentation
✅ Battle-tested in production
✅ FREE unlimited usage (self-hosted)
✅ Proper security sandboxing

**Cons:**
❌ Requires custom integration with LibreChat
❌ Self-hosted version needs Docker knowledge

---

### Option 2: Piston (Engineer Man) - ⚠️ **Limited Availability**

**What is it?**
- High-performance code execution engine
- Created by Engineer Man
- Simple REST API

**Status:**
⚠️ **IMPORTANT**: Public API keys being phased out in 2025
- Existing keys revoked January 1, 2025
- Self-hosting still available

**Free Tier:**
- **Self-hosted only** (after Jan 2025)
- Docker-based deployment
- Unlimited usage when self-hosted

**Supported Languages:**
- 40+ languages including Python, JavaScript, Java, C++, Go, Rust, etc.

**Pros:**
✅ Simple architecture
✅ Fast execution
✅ Open-source

**Cons:**
❌ Public API being discontinued
❌ Must self-host for continued use
❌ Smaller community than Judge0

---

### Option 3: E2B Sandbox - 💰 **Free Tier Available**

**What is it?**
- Secure cloud sandboxes for AI code execution
- Official E2B open-source SDK
- Supports multiple programming environments

**Free Tier:**
- **100,000 credits/month FREE**
- Good for ~2,000-5,000 executions/month
- Requires credit card for verification

**Supported:**
- Python, JavaScript, TypeScript, Bash
- Full filesystem access
- Internet connectivity
- Long-running processes

**Pros:**
✅ Modern, AI-focused architecture
✅ Excellent documentation
✅ Built for LLM integration
✅ Generous free tier

**Cons:**
❌ Credit card required
❌ Fewer languages than Judge0
❌ Usage limits on free tier

---

### Option 4: Novita Sandbox - 💰 **Pay-as-you-go**

**What is it?**
- E2B-compatible alternative
- No minimum subscription
- Transparent pricing

**Cost:**
- **Pay only for what you use**
- 30% cheaper than E2B Pro
- No $150/month minimum
- 20 GB free storage

**Compatibility:**
✅ Drop-in replacement for E2B
✅ Uses same SDK and API
✅ Migration from E2B is easy

**Pros:**
✅ No subscription fees
✅ E2B compatible
✅ Lower costs than E2B

**Cons:**
❌ NOT free (though affordable)
❌ Less mature than E2B

---

## 🔧 Self-Hosted Options (100% FREE)

### Judge0 CE Self-Hosted Setup

**Requirements:**
- Docker and Docker Compose
- 2GB RAM minimum
- 10GB disk space

**Quick Setup:**

```bash
# Clone Judge0
git clone https://github.com/judge0/judge0.git
cd judge0

# Start services
docker-compose up -d

# Judge0 API available at http://localhost:2358
```

**LibreChat Integration:**
You'll need to create a custom tool/plugin that:
1. Accepts code from LibreChat
2. Sends to Judge0 API
3. Returns results to LibreChat

---

### Piston Self-Hosted Setup

**Quick Setup:**

```bash
# Clone Piston
git clone https://github.com/engineer-man/piston.git
cd piston

# Build and run
docker-compose up -d

# API available at http://localhost:2000
```

---

## 🚀 Integration Methods with LibreChat

### Method 1: Custom Tool/Plugin (Recommended)

Create a custom tool that wraps Judge0/Piston API:

```javascript
// Pseudo-code example
async function executeCode({ language, code }) {
  const response = await fetch('http://localhost:2358/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language_id: getLanguageId(language),
      source_code: code,
      stdin: ''
    })
  });

  const result = await response.json();
  return result.stdout || result.stderr;
}
```

### Method 2: MCP (Model Context Protocol) Server

LibreChat supports MCP servers. You could create an MCP server that:
- Wraps Judge0/Piston/E2B API
- Provides code execution as a tool
- Integrates seamlessly with LibreChat

**Example MCP server structure:**
```
mcp-code-executor/
├── index.js          # MCP server implementation
├── package.json
└── config.json       # Tool definitions
```

### Method 3: Environment Variable Override

**Note**: This requires modifying LibreChat code, but it's possible to:

1. Add environment variable for custom code executor endpoint:
   ```bash
   LIBRECHAT_CODE_BASEURL=http://localhost:2358
   LIBRECHAT_CODE_API_KEY=your-judge0-key  # If using authentication
   ```

2. Modify LibreChat to support Judge0/Piston API format

---

## 📊 Comparison Table

| Solution | Cost | Languages | Setup Time | Self-Host | Best For |
|----------|------|-----------|------------|-----------|----------|
| **Judge0 (RapidAPI)** | FREE | 70+ | 5 min | ❌ | Quick testing |
| **Judge0 (Self-hosted)** | FREE | 70+ | 30 min | ✅ | Heavy users |
| **Piston (Self-hosted)** | FREE | 40+ | 20 min | ✅ | Simple setup |
| **E2B Sandbox** | FREE tier | 4 | 10 min | ❌ | AI-focused |
| **Novita** | Pay-as-go | 4 | 10 min | ❌ | Low usage |
| **LibreChat Official** | Subscription | 10+ | 2 min | ❌ | Not available |

---

## 🎯 My Recommendation for You

Based on your requirements (FREE, light usage), here's what I recommend:

### **Primary Choice: Judge0 via RapidAPI**

**Why:**
1. ✅ Completely FREE (50 executions/day)
2. ✅ No server setup needed
3. ✅ 70+ programming languages
4. ✅ Production-ready
5. ✅ Easy to integrate

**Setup Steps:**

#### Step 1: Get RapidAPI Key

1. Go to https://rapidapi.com/judge0-official/api/judge0-ce
2. Sign up (FREE account)
3. Subscribe to FREE plan (50 requests/day)
4. Copy your API key

#### Step 2: Create MCP Server for Judge0

I can create a custom MCP server that integrates Judge0 with LibreChat. This would allow you to:
- Execute code in 70+ languages
- No modifications to LibreChat needed
- Simple configuration

#### Step 3: Add to LibreChat

Configure the MCP server in LibreChat's MCP settings.

---

### **Backup Choice: Judge0 Self-Hosted**

If you find 50 executions/day isn't enough, self-host Judge0:

**Advantages:**
- ✅ Unlimited executions
- ✅ Complete privacy
- ✅ No API key needed
- ✅ Full control

**Requirements:**
- Windows with WSL2 + Docker Desktop (you have this!)
- 30 minutes setup time

---

## 🔨 Want Me to Build It for You?

I can create a complete solution for you:

### Option A: Judge0 MCP Server (Recommended)

**What I'll build:**
1. Custom MCP server for Judge0 integration
2. Configuration files for LibreChat
3. Complete setup guide
4. Testing instructions

**Features:**
- ✅ Code execution in 70+ languages
- ✅ Automatic language detection
- ✅ Error handling
- ✅ Result formatting for LibreChat
- ✅ FREE (using RapidAPI tier)

**Time to implement:** ~1-2 hours

### Option B: Judge0 Self-Hosted + Integration

**What I'll build:**
1. Docker Compose setup for Judge0
2. Custom integration layer
3. LibreChat configuration
4. Complete documentation

**Features:**
- ✅ Unlimited executions
- ✅ Complete privacy
- ✅ 70+ languages
- ✅ No external dependencies

**Time to implement:** ~2-3 hours

---

## 📝 Quick Start Guide - Judge0 with RapidAPI

Want to test immediately? Here's the fastest path:

### 1. Get Judge0 API Key (5 minutes)

```bash
1. Visit: https://rapidapi.com/judge0-official/api/judge0-ce
2. Click "Subscribe to Test"
3. Choose "Basic" plan (FREE - 50 req/day)
4. Copy your X-RapidAPI-Key
```

### 2. Test the API (2 minutes)

```powershell
# Test Judge0 API with PowerShell
$headers = @{
    "content-type" = "application/json"
    "X-RapidAPI-Key" = "YOUR_RAPIDAPI_KEY_HERE"
    "X-RapidAPI-Host" = "judge0-ce.p.rapidapi.com"
}

$body = @{
    language_id = 71  # Python 3
    source_code = "print('Hello from Judge0!')"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true" -Method POST -Headers $headers -Body $body

Write-Output $response.stdout
```

**Expected output:** `Hello from Judge0!`

### 3. Integration Options

**Option A: MCP Server** (I can build this)
- Seamless LibreChat integration
- No code modification needed
- Professional solution

**Option B: Custom Agent** (Quick & dirty)
- Create an agent that formats code for external execution
- Copy/paste results manually
- Works immediately

**Option C: Custom Tool** (Advanced)
- Modify LibreChat to add Judge0 as a tool
- Requires code changes
- Full integration

---

## 🆚 E2B vs Judge0 - Which Should You Choose?

| Feature | Judge0 (FREE) | E2B (FREE Tier) |
|---------|---------------|-----------------|
| **Languages** | 70+ | 4 |
| **Free Limit** | 50/day (API) or ∞ (self-host) | 100K credits/month |
| **Credit Card** | ❌ Not needed | ✅ Required |
| **Self-Host** | ✅ Easy | ❌ Cloud only |
| **Documentation** | ✅ Excellent | ✅ Excellent |
| **AI Integration** | ⚠️ Manual | ✅ Built-in |
| **Best For** | General code execution | AI-specific workflows |

**My verdict**: Judge0 for your use case (FREE tier, no credit card, more languages)

---

## 🔐 Security Considerations

All options mentioned use proper sandboxing:

**Judge0:**
- Isolated environments per execution
- Resource limits (CPU, memory, time)
- Network restrictions
- File system isolation

**Piston:**
- Container-based isolation
- Resource quotas
- Secure execution environment

**E2B:**
- Cloud-native sandboxes
- Firecracker microVMs
- Full isolation

**For self-hosted**: Ensure Docker is properly configured and isolated from your main system.

---

## 🎬 Next Steps

**Tell me which option you prefer:**

1. **Judge0 + RapidAPI** (Fastest, easiest, FREE 50/day)
   - I'll create an MCP server for LibreChat integration
   - Complete setup guide
   - Ready in ~1-2 hours

2. **Judge0 Self-Hosted** (Unlimited, FREE, private)
   - Docker Compose configuration
   - LibreChat integration
   - Complete guide
   - Ready in ~2-3 hours

3. **E2B** (Modern, AI-focused, credit card needed)
   - MCP server integration
   - Setup guide
   - Ready in ~1 hour

4. **Something else?**
   - Let me know your specific requirements!

---

## 📚 Resources

### Judge0
- **Website**: https://judge0.com/
- **GitHub**: https://github.com/judge0/judge0
- **RapidAPI**: https://rapidapi.com/judge0-official/api/judge0-ce
- **Documentation**: https://ce.judge0.com/

### Piston
- **GitHub**: https://github.com/engineer-man/piston
- **Documentation**: https://github.com/engineer-man/piston/blob/master/README.md

### E2B
- **Website**: https://e2b.dev/
- **GitHub**: https://github.com/e2b-dev/E2B
- **Documentation**: https://e2b.dev/docs

### LibreChat MCP
- **Documentation**: https://www.librechat.ai/docs/features/mcp

---

## ❓ FAQ

**Q: Can I use multiple code execution services?**
A: Yes! You can configure multiple MCP servers or tools, each using different backends.

**Q: Will this work with all AI models in LibreChat?**
A: Yes, code execution is model-agnostic. Works with OpenAI, Anthropic, Vertex AI, etc.

**Q: What about costs?**
A: Judge0 RapidAPI = FREE (50/day). Self-hosted = FREE (∞). E2B = 100K credits/month FREE.

**Q: Is it safe?**
A: Yes, all options use proper sandboxing. Self-hosted gives you the most control.

**Q: Can I combine this with web search?**
A: Absolutely! You can enable both web search and code execution.

---

## 🚀 Ready to Implement?

Let me know which option you'd like, and I'll:

1. ✅ Create all necessary configuration files
2. ✅ Build custom integration (MCP server or custom tool)
3. ✅ Write complete setup guide
4. ✅ Provide testing instructions
5. ✅ Commit and push to your repository

**Just say:** "Let's go with Judge0 + RapidAPI" (or your preferred option)

And I'll get started! 🎉
