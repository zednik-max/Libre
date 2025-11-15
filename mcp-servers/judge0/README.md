# Judge0 MCP Server for LibreChat

**Execute code in 70+ programming languages** directly from LibreChat using the Model Context Protocol (MCP).

This MCP server integrates [Judge0 CE](https://ce.judge0.com/) with LibreChat, enabling AI agents to execute code securely in a sandboxed environment.

---

## ✨ Features

- 🚀 **70+ Programming Languages** - Python, JavaScript, Java, C++, Go, Rust, PHP, Ruby, Swift, Kotlin, and many more
- 🔒 **Secure Execution** - Sandboxed environment with resource limits
- ⚡ **Fast & Reliable** - Judge0's battle-tested infrastructure
- 🆓 **FREE Tier Available** - 50 executions/day via RapidAPI
- 🏠 **Self-Hosting Support** - Use your own Judge0 instance
- 🤖 **Auto Language Detection** - Automatically detect programming language from code
- 📊 **Performance Metrics** - Execution time and memory usage
- 🎯 **Easy Integration** - Works with any AI model in LibreChat

---

## 📋 Prerequisites

- **Node.js 18+** installed
- **LibreChat** installed and running
- **Judge0 API Key** from RapidAPI (FREE tier available)

---

## 🚀 Quick Start

### Step 1: Get Judge0 API Key

1. Go to [Judge0 CE on RapidAPI](https://rapidapi.com/judge0-official/api/judge0-ce)
2. Sign up for FREE account
3. Subscribe to **Basic** plan (FREE - 50 requests/day)
4. Copy your **X-RapidAPI-Key**

### Step 2: Install Dependencies

```bash
cd mcp-servers/judge0
npm install
```

### Step 3: Configure LibreChat

Add to your `librechat.yaml`:

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

### Step 4: Add API Key to .env

Add to your `.env` file:

```bash
RAPIDAPI_KEY=your_rapidapi_key_here
```

### Step 5: Restart LibreChat

```bash
# Windows
docker-compose -f docker-compose.windows.yml restart

# Linux/Mac
docker-compose restart
```

### Step 6: Use in LibreChat!

Create an agent and enable the **Judge0 Code Executor** tools. Now you can ask the AI to run code!

**Example:**
> "Write a Python script to calculate fibonacci numbers and run it with n=10"

---

## 🛠️ Available Tools

### `execute_code`

Execute code in any supported language. Auto-detects language if not specified.

**Parameters:**
- `code` (string, required) - Source code to execute
- `language` (string, optional) - Programming language (e.g., "python", "javascript")
- `stdin` (string, optional) - Standard input for the program
- `timeout` (number, optional) - CPU time limit in seconds (max 15)

**Example:**
```json
{
  "code": "print('Hello from Python!')",
  "language": "python"
}
```

### `execute_python`

Convenient shortcut for Python execution.

**Parameters:**
- `code` (string, required) - Python code
- `stdin` (string, optional) - Standard input

### `execute_javascript`

Convenient shortcut for JavaScript (Node.js) execution.

**Parameters:**
- `code` (string, required) - JavaScript code
- `stdin` (string, optional) - Standard input

### `list_languages`

List all 70+ supported programming languages with their aliases.

---

## 📚 Supported Languages

### Popular Languages
- Python 3.8
- JavaScript (Node.js 12)
- TypeScript 3.7
- Java (OpenJDK 13)
- C (GCC 9.2)
- C++ (G++ 9.2)
- C# (Mono 6.6)
- Go 1.13
- Rust 1.40

### Web & Scripting
- PHP 7.4
- Ruby 2.7
- Perl 5.28
- Bash 5.0
- Lua 5.3

### Mobile & Modern
- Swift 5.2
- Kotlin 1.3
- Objective-C

### Functional
- Haskell
- Clojure
- Elixir
- Erlang
- OCaml
- F#
- Lisp

### Data & Statistics
- R 4.0
- SQL (SQLite 3.27)

### And 40+ more!

Use the `list_languages` tool to see the complete list with all aliases.

---

## ⚙️ Configuration

### Environment Variables

- `RAPIDAPI_KEY` (required for RapidAPI) - Your RapidAPI key
- `JUDGE0_API_KEY` (alternative) - Alternative to RAPIDAPI_KEY
- `JUDGE0_BASE_URL` (optional) - Custom Judge0 endpoint for self-hosted

### Self-Hosted Judge0

To use a self-hosted Judge0 instance:

```yaml
mcp:
  servers:
    judge0:
      command: node
      args:
        - ./mcp-servers/judge0/index.js
      env:
        JUDGE0_BASE_URL: http://localhost:2358
        # No API key needed for self-hosted
```

See [Judge0 Installation Guide](https://github.com/judge0/judge0#installation) for self-hosting instructions.

---

## 🧪 Testing

### Test the MCP Server

```bash
cd mcp-servers/judge0
npm test
```

### Test with PowerShell (Windows)

Use the provided PowerShell test script:

```powershell
.\test-judge0.ps1
```

### Manual Test

```bash
# Set your API key
export RAPIDAPI_KEY="your_key_here"

# Run the server
node index.js
```

---

## 🔒 Security

### Resource Limits

Judge0 enforces:
- **CPU Time Limit**: Configurable per execution (default: 5s, max: 15s)
- **Memory Limit**: 128 MB default
- **Process Isolation**: Each execution in separate sandbox
- **Network Restrictions**: No external network access

### Sandboxing

All code runs in isolated containers with:
- Limited CPU and memory
- No file system access outside sandbox
- No network connectivity
- Automatic cleanup after execution

### Best Practices

1. **Set appropriate timeouts** for long-running code
2. **Monitor usage** via RapidAPI dashboard
3. **Use self-hosted** for sensitive code
4. **Review code** before execution (agents should explain what code does)

---

## 💰 Cost & Limits

### RapidAPI FREE Tier
- **50 requests/day**
- **No credit card required**
- Perfect for personal use and testing

### RapidAPI Paid Plans
- **$50/month**: 30,000 requests
- **Pay-as-you-go**: $5 per 1,000 requests

### Self-Hosted
- **FREE unlimited usage**
- Requires your own infrastructure
- Full control and privacy

---

## 🐛 Troubleshooting

### "Cannot connect to Judge0 API"

**Cause**: Invalid API key or network issues

**Solution**:
1. Verify `RAPIDAPI_KEY` in `.env`
2. Check API key is valid on RapidAPI dashboard
3. Ensure you're subscribed to Judge0 CE (FREE tier)
4. Check internet connection

### "Rate limit exceeded"

**Cause**: Exceeded 50 requests/day on FREE tier

**Solution**:
1. Wait 24 hours for limit to reset
2. Upgrade to paid plan
3. Use self-hosted Judge0

### "Unknown language"

**Cause**: Language not supported or misspelled

**Solution**:
1. Use `list_languages` tool to see supported languages
2. Check language name spelling
3. Try common aliases (e.g., "py" instead of "python3")

### MCP Server Not Starting

**Cause**: Missing dependencies or configuration

**Solution**:
```bash
cd mcp-servers/judge0
npm install
```

Check LibreChat logs:
```bash
docker-compose logs api | grep judge0
```

---

## 📖 Examples

### Python Data Analysis

```python
import statistics

data = [23, 45, 12, 67, 89, 34, 56]
mean = statistics.mean(data)
median = statistics.median(data)
stdev = statistics.stdev(data)

print(f"Mean: {mean:.2f}")
print(f"Median: {median:.2f}")
print(f"Std Dev: {stdev:.2f}")
```

### JavaScript Web Scraping

```javascript
const url = 'https://api.github.com/users/github';

// Note: No network access in sandbox
// This example shows the syntax
console.log('Would fetch:', url);
console.log('Result would be processed here');
```

### C++ Algorithm

```cpp
#include <iostream>
#include <vector>
using namespace std;

void quicksort(vector<int>& arr, int low, int high) {
    if (low < high) {
        int pivot = arr[high];
        int i = low - 1;

        for (int j = low; j < high; j++) {
            if (arr[j] < pivot) {
                i++;
                swap(arr[i], arr[j]);
            }
        }
        swap(arr[i + 1], arr[high]);
        int pi = i + 1;

        quicksort(arr, low, pi - 1);
        quicksort(arr, pi + 1, high);
    }
}

int main() {
    vector<int> arr = {64, 34, 25, 12, 22, 11, 90};

    cout << "Original array: ";
    for (int x : arr) cout << x << " ";
    cout << endl;

    quicksort(arr, 0, arr.size() - 1);

    cout << "Sorted array: ";
    for (int x : arr) cout << x << " ";
    cout << endl;

    return 0;
}
```

---

## 🤝 Contributing

This MCP server is part of the LibreChat project. Contributions are welcome!

### Reporting Issues

Open an issue on [LibreChat GitHub](https://github.com/danny-avila/LibreChat/issues) with:
- MCP server version
- Error messages or logs
- Steps to reproduce

### Feature Requests

Suggest improvements:
- Additional language-specific tools
- Better error messages
- Performance optimizations

---

## 📄 License

MIT License - see LICENSE file in LibreChat repository

---

## 🙏 Credits

- **Judge0** - Amazing code execution platform
- **LibreChat** - Powerful AI chat platform
- **Model Context Protocol** - Tool integration standard

---

## 📚 Resources

- [Judge0 Documentation](https://ce.judge0.com/)
- [LibreChat MCP Guide](https://www.librechat.ai/docs/features/mcp)
- [Model Context Protocol Spec](https://modelcontextprotocol.io/)
- [RapidAPI Judge0](https://rapidapi.com/judge0-official/api/judge0-ce)

---

**Built with ❤️ for the LibreChat community**
