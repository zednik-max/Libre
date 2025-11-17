# Judge0 MCP Server - npm Package Integration

**Package**: `@javaguru/server-judge0`
**Version**: 1.1.0
**Registry**: https://www.npmjs.com/package/@javaguru/server-judge0
**Date**: 2025-11-15

---

## 🎉 Congratulations!

Your Judge0 MCP server is now **officially published on npm**! This guide will help you integrate the production npm package into LibreChat.

---

## 📦 Package Information

**npm Package**: `@javaguru/server-judge0@1.1.0`

**Features**:
- 70+ programming languages support
- 4 MCP tools (execute_code, execute_python, execute_javascript, list_languages)
- Auto language detection
- RapidAPI + self-hosted Judge0 support
- Execution time and memory metrics
- MIT Licensed

**Dependencies**:
- `@modelcontextprotocol/sdk` (^0.5.0)
- `axios` (^1.6.0)
- `zod` (^3.22.0)

**Requirements**: Node.js >= 18.0.0

**Repository**: https://github.com/zednik-max/judge0-mcp-server

---

## 🚀 Installation Methods

### Method 1: Global Installation (Recommended for LibreChat)

```powershell
# Install globally
npm install -g @javaguru/server-judge0

# Verify installation
server-judge0 --version
# Should show: 1.1.0

# Check where it's installed
npm list -g @javaguru/server-judge0
```

**Pros**:
- ✅ Available system-wide
- ✅ Easy to reference in librechat.yaml
- ✅ Simpler path configuration

**Installation path** (typical):
- Windows: `C:\Users\YourUser\AppData\Roaming\npm\node_modules\@javaguru\server-judge0`
- Linux/Mac: `/usr/local/lib/node_modules/@javaguru/server-judge0`

---

### Method 2: Local Installation in LibreChat

```powershell
# Navigate to LibreChat root
cd C:\path\to\Libre

# Install locally
npm install @javaguru/server-judge0

# Verify installation
npm list @javaguru/server-judge0
```

**Pros**:
- ✅ Project-specific version
- ✅ Tracked in package.json
- ✅ Easy to update with npm

**Installation path**:
- `C:\path\to\Libre\node_modules\@javaguru\server-judge0`

---

### Method 3: Using npx (No Installation)

```powershell
# Run directly without installation
npx @javaguru/server-judge0
```

**Pros**:
- ✅ No installation needed
- ✅ Always uses latest version
- ✅ Clean system

**Cons**:
- ❌ Slower startup (downloads on first run)
- ❌ Requires internet connection

---

## ⚙️ LibreChat Configuration

### Option A: Global Installation Configuration

**Update `librechat.yaml`**:

```yaml
version: 1.1.0

# ... (keep your existing endpoint configurations)

# MCP Server Configuration
mcp:
  servers:
    judge0:
      command: server-judge0
      # No args needed - uses the bin command directly
      env:
        RAPIDAPI_KEY: ${RAPIDAPI_KEY}
```

**Explanation**:
- `command: server-judge0` - Uses the global bin command
- Environment variables are passed through `.env`

---

### Option B: Local Installation Configuration

**Update `librechat.yaml`**:

```yaml
version: 1.1.0

# ... (keep your existing endpoint configurations)

# MCP Server Configuration
mcp:
  servers:
    judge0:
      command: node
      args:
        - ./node_modules/@javaguru/server-judge0/index.js
      env:
        RAPIDAPI_KEY: ${RAPIDAPI_KEY}
```

**Explanation**:
- `command: node` - Run with Node.js
- `args` - Path to the installed package's entry point

---

### Option C: npx Configuration

**Update `librechat.yaml`**:

```yaml
version: 1.1.0

# ... (keep your existing endpoint configurations)

# MCP Server Configuration
mcp:
  servers:
    judge0:
      command: npx
      args:
        - '@javaguru/server-judge0'
      env:
        RAPIDAPI_KEY: ${RAPIDAPI_KEY}
```

**Explanation**:
- `command: npx` - Run using npx
- `args` - Package name to execute

---

## 📝 Step-by-Step Integration

### Step 1: Choose Installation Method

**Recommended**: Global installation for simplicity

```powershell
npm install -g @javaguru/server-judge0
```

### Step 2: Update librechat.yaml

**Option 1**: Update existing `librechat.yaml`

```powershell
# Backup current config
Copy-Item librechat.yaml librechat.yaml.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')

# Edit librechat.yaml
# Update the MCP section to use: command: server-judge0
```

**Option 2**: Create new config from vertex-ai template

```powershell
# Copy vertex-ai config which already has MCP section
Copy-Item librechat.vertex-ai.yaml librechat.yaml

# Update the command in MCP section
# Change from: ./mcp-servers/judge0/index.js
# To: server-judge0
```

**Manual edit** (librechat.yaml):

```yaml
mcp:
  servers:
    judge0:
      command: server-judge0  # Changed from local path
      env:
        RAPIDAPI_KEY: ${RAPIDAPI_KEY}
```

### Step 3: Verify Environment Variables

```powershell
# Check .env has RAPIDAPI_KEY
Get-Content .env | Select-String "RAPIDAPI_KEY"

# If not found, add it
@"
RAPIDAPI_KEY=your_rapidapi_key_here
"@ | Add-Content .env
```

### Step 4: Test MCP Server Standalone

Before integrating, test the server works:

```powershell
# Set environment variable
$env:RAPIDAPI_KEY="your_key_here"

# Run server
server-judge0

# Should show:
# Judge0 MCP Server starting...
# ✓ Connected to Judge0 API successfully
# ✓ Supports 70+ programming languages
# Judge0 MCP Server running
```

**Press Ctrl+C** to stop after verification.

### Step 5: Restart LibreChat

```powershell
# Navigate to LibreChat directory
cd C:\path\to\Libre

# Restart all containers
docker-compose -f docker-compose.windows.yml restart

# Wait for startup
Start-Sleep -Seconds 30

# Check logs for Judge0 MCP
docker-compose logs api | Select-String -Pattern "judge0"
```

**Expected in logs**:
```
api_1  | Starting MCP server: judge0
api_1  | Judge0 MCP Server starting...
api_1  | ✓ Connected to Judge0 API successfully
api_1  | ✓ Supports 70+ programming languages
api_1  | ✓ Ready to execute code via MCP
api_1  | Judge0 MCP Server running
```

### Step 6: Verify in LibreChat UI

1. Open http://localhost:3080
2. Go to **Agents** → **Create Agent**
3. Check **Tools** section
4. Verify these tools appear:
   - ✅ `execute_code`
   - ✅ `execute_python`
   - ✅ `execute_javascript`
   - ✅ `list_languages`

---

## 🧪 Testing

### Test 1: Verify Package Version

```powershell
# Global installation
npm list -g @javaguru/server-judge0

# Local installation
npm list @javaguru/server-judge0

# Should show: @javaguru/server-judge0@1.1.0
```

### Test 2: Standalone Execution

```powershell
$env:RAPIDAPI_KEY="your_key"
server-judge0

# Should start without errors
```

### Test 3: API Connectivity

Use the existing test script:

```powershell
.\test-judge0.ps1

# Expected output:
# ✓ Successfully connected to Judge0 API
# OUTPUT:
# Hello from Judge0!
```

### Test 4: Create Test Agent

1. Create agent named "Code Test Agent"
2. Enable all 4 Judge0 tools
3. Start conversation
4. Ask: **"Run this Python code: print('Hello from npm package!')"**

**Expected**:
- Agent uses `execute_python` tool
- Shows output: `Hello from npm package!`
- Displays execution time and memory

### Test 5: Language Detection

Ask: **"Execute this: console.log('Auto detected!')"**

**Expected**:
- Agent detects JavaScript automatically
- Uses `execute_code` with auto-detection
- Shows successful output

---

## 🔄 Updating to New Versions

### Check for Updates

```powershell
# Check current version
npm list -g @javaguru/server-judge0

# Check latest version on npm
npm view @javaguru/server-judge0 version

# Check all available versions
npm view @javaguru/server-judge0 versions
```

### Update Global Package

```powershell
# Update to latest version
npm update -g @javaguru/server-judge0

# Or install specific version
npm install -g @javaguru/server-judge0@1.1.0
```

### Update Local Package

```powershell
cd C:\path\to\Libre

# Update to latest
npm update @javaguru/server-judge0

# Or specific version
npm install @javaguru/server-judge0@1.1.0
```

### After Update

```powershell
# Restart LibreChat
docker-compose restart

# Verify new version in logs
docker-compose logs api | Select-String "judge0"
```

---

## 🐛 Troubleshooting

### Issue 1: "command not found: server-judge0"

**Cause**: Package not installed globally or PATH not updated

**Solutions**:

1. **Verify installation**:
   ```powershell
   npm list -g @javaguru/server-judge0
   ```

2. **Reinstall**:
   ```powershell
   npm install -g @javaguru/server-judge0
   ```

3. **Check npm global bin path**:
   ```powershell
   npm config get prefix
   # Ensure this is in your PATH
   ```

4. **Use full path** (temporary workaround):
   ```powershell
   # Find installation path
   npm root -g
   # C:\Users\YourUser\AppData\Roaming\npm\node_modules

   # Run with full path
   node "C:\Users\YourUser\AppData\Roaming\npm\node_modules\@javaguru\server-judge0\index.js"
   ```

---

### Issue 2: "Cannot find module '@javaguru/server-judge0'"

**Cause**: Package not installed locally

**Solution**:

```powershell
cd C:\path\to\Libre
npm install @javaguru/server-judge0
```

---

### Issue 3: Version Mismatch

**Symptoms**: Features not working as expected

**Solution**:

```powershell
# Check installed version
npm list -g @javaguru/server-judge0

# Update to latest
npm update -g @javaguru/server-judge0

# Restart LibreChat
docker-compose restart
```

---

### Issue 4: LibreChat Not Detecting MCP Server

**Check configuration**:

```powershell
# 1. Verify librechat.yaml
Get-Content librechat.yaml | Select-String -Pattern "judge0" -Context 3

# Should show:
#   judge0:
#     command: server-judge0
#     env:
#       RAPIDAPI_KEY: ${RAPIDAPI_KEY}

# 2. Verify .env
Get-Content .env | Select-String "RAPIDAPI_KEY"

# 3. Test standalone
$env:RAPIDAPI_KEY="your_key"
server-judge0
```

**If still not working**:

1. Use full path in librechat.yaml:
   ```yaml
   command: C:\Users\YourUser\AppData\Roaming\npm\server-judge0.cmd
   ```

2. Or use node + full path:
   ```yaml
   command: node
   args:
     - C:\Users\YourUser\AppData\Roaming\npm\node_modules\@javaguru\server-judge0\index.js
   ```

---

### Issue 5: Permission Errors on Windows

**Symptoms**: Access denied, permission errors

**Solution**:

Run PowerShell as Administrator:

```powershell
# Uninstall
npm uninstall -g @javaguru/server-judge0

# Reinstall as administrator
npm install -g @javaguru/server-judge0
```

---

## 📊 Comparison: Local vs npm Package

| Aspect | Local Copy (`mcp-servers/judge0/`) | npm Package (`@javaguru/server-judge0`) |
|--------|-------------------------------------|----------------------------------------|
| **Installation** | Already in repo | `npm install -g @javaguru/server-judge0` |
| **Updates** | Manual (git pull) | `npm update -g @javaguru/server-judge0` |
| **Version Control** | Part of LibreChat repo | Separate npm versioning |
| **Path** | `./mcp-servers/judge0/index.js` | `server-judge0` command |
| **Modifications** | Easy to modify locally | Need to fork and republish |
| **Best For** | Development, testing | Production, clean deployment |

---

## ✅ Migration Checklist

Migrating from local copy to npm package:

- [ ] Install npm package globally: `npm install -g @javaguru/server-judge0`
- [ ] Verify installation: `server-judge0 --version`
- [ ] Test standalone: `server-judge0` (with RAPIDAPI_KEY set)
- [ ] Update `librechat.yaml` MCP section to use `command: server-judge0`
- [ ] Verify `RAPIDAPI_KEY` in `.env`
- [ ] Restart LibreChat: `docker-compose restart`
- [ ] Check logs for MCP server startup
- [ ] Verify tools appear in agent configuration
- [ ] Test with agent execution
- [ ] (Optional) Remove local copy: `rm -r mcp-servers/judge0/`

---

## 🚀 Best Practices

### For Production Use

1. **Use Global Installation**:
   ```powershell
   npm install -g @javaguru/server-judge0
   ```

2. **Pin Version** in documentation:
   ```yaml
   # Tested with @javaguru/server-judge0@1.1.0
   ```

3. **Monitor for Updates**:
   ```powershell
   npm outdated -g @javaguru/server-judge0
   ```

4. **Use Environment Variables**:
   - Never hardcode API keys
   - Use `.env` file
   - Keep `.env` in `.gitignore`

### For Development

1. **Use Local Installation**:
   ```powershell
   npm install @javaguru/server-judge0
   ```

2. **Test Before Deploying**:
   - Always test standalone first
   - Verify API connectivity
   - Check all 4 tools work

3. **Keep Documentation Updated**:
   - Note which version you're using
   - Document any custom configurations

---

## 📈 Package Statistics

**npm Package**: https://www.npmjs.com/package/@javaguru/server-judge0

**Repository**: https://github.com/zednik-max/judge0-mcp-server

**Check Stats**:
```powershell
npm view @javaguru/server-judge0

# Shows:
# - Latest version
# - Description
# - Dependencies
# - Repository
# - License
# - Author
```

---

## 🎯 Next Steps

### 1. Announce Your Package! 🎉

Share with the community:

- **LibreChat Discord**: Announce in #general or #tools
- **Reddit**: Post in r/LocalLLaMA, r/SelfHosted
- **Twitter/X**: Tag @LibreChatAI
- **Dev.to**: Write an article about building an MCP server
- **MCP Registry**: Submit to Anthropic's MCP server registry (if available)

### 2. Create Documentation

Consider creating:
- **GitHub README badges**:
  - npm version
  - Downloads
  - License
  - Build status

- **Demo video**: Show it in action
- **Blog post**: How you built it
- **Tutorial**: Setting up with LibreChat

### 3. Monitor Usage

- Watch npm downloads
- Respond to GitHub issues
- Update based on feedback
- Plan v1.2.0 features

---

## 🏆 Congratulations!

You've successfully:
- ✅ Created a production-ready MCP server
- ✅ Published to npm registry
- ✅ Made it available to the community
- ✅ Integrated with LibreChat

**Your contribution enables code execution in 70+ languages for LibreChat users worldwide!** 🌍

---

## 📞 Support

**Package Issues**: https://github.com/zednik-max/judge0-mcp-server/issues

**LibreChat Integration**: See `JUDGE0 MCP - LIBRECHAT INTEGRATION.md`

**npm Package**: https://www.npmjs.com/package/@javaguru/server-judge0

---

**Happy coding! 🚀**
