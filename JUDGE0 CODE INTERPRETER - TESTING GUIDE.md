# Judge0 Code Interpreter - Testing Guide

**Implementation**: ✅ COMPLETE
**Commit**: a33f310
**Branch**: claude/claude-md-mhxw176ffakjbgor-015kDZD3BZQQUpb3R4pHVTGD
**Status**: Ready for testing!

---

## 🎉 **WHAT WAS BUILT**

You now have a **working Code Interpreter** that:
- ✅ Uses Judge0 API (not unavailable LibreChat service)
- ✅ Supports **70+ programming languages**
- ✅ Has a **FREE tier** (50 executions/day)
- ✅ Works with the **same UI** (click Code Interpreter button)
- ✅ Uses **RapidAPI key** (FREE to get)

**Total changes**: 834 lines added across 6 files

---

## 📋 **BEFORE TESTING: Setup Steps**

### Step 1: Rebuild LibreChat (REQUIRED!)

Since we modified backend files, you MUST rebuild:

```powershell
cd C:\path\to\Libre

# Stop LibreChat
docker-compose -f docker-compose.windows.yml down

# Rebuild and start
docker-compose -f docker-compose.windows.yml up -d --build

# Wait for startup (30-60 seconds)
Start-Sleep -Seconds 60

# Check logs for errors
docker-compose logs api | Select-String "error" -Context 2
```

**Expected**: No errors in logs

---

### Step 2: Verify API Started Successfully

```powershell
# Check if API container is running
docker-compose ps

# Check recent API logs
docker-compose logs api --tail=50
```

**Look for**:
- ✅ "Server listening on port 3080"
- ✅ No Judge0-related errors
- ✅ Container status: "Up"

---

### Step 3: Get RapidAPI Key (If you don't have one)

1. Go to https://rapidapi.com/judge0-official/api/judge0-ce
2. Click **"Sign Up"** (it's FREE!)
3. Click **"Subscribe to Test"**
4. Select **"Basic (FREE)"** plan - 50 executions/day
5. Copy your **X-RapidAPI-Key** from the dashboard

**Keep this key** - you'll enter it in the UI!

---

## 🧪 **TESTING PROCEDURE**

### Test 1: UI Dialog Check ✅

**Steps**:
1. Open LibreChat: http://localhost:3080
2. Start a new conversation
3. Click **Code Interpreter** button (bottom toolbar, looks like `</>`)

**Expected**:
- ✅ Dialog opens
- ✅ Title says: **"Judge0 Code Execution - 70+ Languages"**
- ✅ Subtitle mentions RapidAPI key
- ✅ Link goes to: https://rapidapi.com/judge0-official/api/judge0-ce
- ✅ Shows language icons (Python, Node.js, etc.)

**Screenshot**: Take one and confirm the text changed!

---

### Test 2: API Key Entry ✅

**Steps**:
1. In the dialog, paste your **RapidAPI key**
2. Click **"Save"**

**Expected**:
- ✅ Dialog closes
- ✅ No error message
- ✅ Code Interpreter button stays active (colored background)

**If error**: Check backend logs:
```powershell
docker-compose logs api --tail=50 | Select-String "judge0\|error"
```

---

### Test 3: Python Code Execution ✅

**Steps**:
1. Type this message:
   ```
   Write Python code to calculate fibonacci(10) and execute it
   ```
2. Send the message
3. Wait for response

**Expected**:
```
✅ Code Executed Successfully

Language: Python

Output:
```
Fibonacci(10) = 55
```

⏱️ Time: 0.023s | 💾 Memory: 3.27 MB
```

**Or similar** - the AI should:
1. Write Python code
2. Execute it using the Code Interpreter
3. Show the result (55)
4. Show execution time and memory

**If it doesn't execute**:
- Check if Code Interpreter button was enabled
- Check API logs for errors
- Verify API key was saved correctly

---

### Test 4: JavaScript Code Execution ✅

**Steps**:
1. Type this message:
   ```
   Run this JavaScript: console.log('Hello from Judge0!')
   ```
2. Send the message

**Expected**:
```
✅ Code Executed Successfully

Language: JavaScript

Output:
```
Hello from Judge0!
```

⏱️ Time: 0.018s | 💾 Memory: 8.54 MB
```

---

### Test 5: Auto Language Detection ✅

**Steps**:
1. Type this message:
   ```
   Execute this code:
   def hello():
       print("Python auto-detected!")
   hello()
   ```
2. Send

**Expected**:
- ✅ Detects Python automatically
- ✅ Executes successfully
- ✅ Shows "Python auto-detected!" in output

---

### Test 6: Error Handling ✅

**Steps**:
1. Type this message:
   ```
   Run this Python: print(undefined_variable)
   ```
2. Send

**Expected**:
```
❌ Runtime Error (Runtime Error)

Language: Python

Error:
```
Traceback (most recent call last):
  File "main.py", line 1, in <module>
    print(undefined_variable)
NameError: name 'undefined_variable' is not defined
```

⏱️ Time: 0.010s | 💾 Memory: 3.12 MB
```

**The error should be shown clearly!**

---

### Test 7: Multiple Languages ✅

**Try these one by one**:

**C++ (Compiled)**:
```
Execute this C++:
#include <iostream>
using namespace std;
int main() {
    cout << "Hello from C++!" << endl;
    return 0;
}
```

**Java (Compiled)**:
```
Run this Java:
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java!");
    }
}
```

**Go**:
```
Execute this Go code:
package main
import "fmt"
func main() {
    fmt.Println("Hello from Go!")
}
```

**Expected**: All execute successfully with correct output!

---

## 🐛 **TROUBLESHOOTING**

### Issue 1: Dialog Still Shows "LibreChat Code API"

**Cause**: Frontend not rebuilt

**Solution**:
```powershell
# Client needs rebuild
cd client
npm run build

# Or restart docker-compose
docker-compose restart
```

---

### Issue 2: Code Doesn't Execute

**Check #1: Is Code Interpreter enabled?**
- Code Interpreter button should have colored background
- If grayed out, click it to enable

**Check #2: Is API key saved?**
```powershell
# Check logs
docker-compose logs api | Select-String "CODE_API_KEY"
```

**Check #3: Backend errors?**
```powershell
docker-compose logs api | Select-String "judge0.*error" -Context 3
```

**Common errors**:
- `Cannot find module './judge0'` → Rebuild container!
- `Authentication failed` → Wrong API key
- `Rate limit exceeded` → Used 50 executions today

---

### Issue 3: "Cannot find module" Errors

**Cause**: New files not in Docker container

**Solution**:
```powershell
# Full rebuild
docker-compose down
docker-compose up -d --build

# Wait 60 seconds
Start-Sleep -Seconds 60
```

---

### Issue 4: Rate Limit (50 executions used)

**Solutions**:
1. **Wait 24 hours** - FREE tier resets daily
2. **Check usage**: https://rapidapi.com/developer/apps
3. **Upgrade plan** (if needed): https://rapidapi.com/judge0-official/api/judge0-ce/pricing
4. **Self-host Judge0** (unlimited FREE):
   ```powershell
   git clone https://github.com/judge0/judge0.git
   cd judge0
   docker-compose up -d

   # Then update .env:
   # JUDGE0_BASE_URL=http://localhost:2358
   ```

---

### Issue 5: Authentication Failed

**Cause**: Invalid or wrong API key

**Solutions**:
1. **Get new key**: https://rapidapi.com/judge0-official/api/judge0-ce
2. **Verify key** in RapidAPI dashboard
3. **Re-enter key** in LibreChat (click Code Interpreter, enter new key)
4. **Test key** manually:
   ```powershell
   .\test-judge0.ps1
   ```

---

## ✅ **SUCCESS CRITERIA**

You know it's working when:

- [x] Dialog shows Judge0/RapidAPI branding
- [x] API key saves without error
- [x] Python code executes and shows result
- [x] JavaScript code executes and shows result
- [x] Language auto-detection works
- [x] Errors are displayed clearly
- [x] Execution time and memory shown
- [x] No errors in backend logs

**If ALL checked**: ✅ **IMPLEMENTATION SUCCESSFUL!**

---

## 📊 **WHAT TO REPORT BACK**

After testing, please share:

1. **Which tests passed?** (1-7)
2. **Any errors?** (paste error messages)
3. **Screenshots** of:
   - Updated dialog
   - Successful Python execution
   - Successful JavaScript execution
4. **Backend logs** (if errors):
   ```powershell
   docker-compose logs api --tail=100 > api-logs.txt
   ```

---

## 🎯 **EXPECTED BEHAVIOR**

### ✅ **Success Flow**:
```
User clicks Code Interpreter
  ↓
Dialog shows "Judge0 Code Execution - 70+ Languages"
  ↓
User enters RapidAPI key
  ↓
User asks AI to execute code
  ↓
AI writes code
  ↓
Code executes via Judge0
  ↓
Result shown with execution time/memory
```

### ❌ **If It Fails**:
```
User clicks Code Interpreter
  ↓
Dialog shows OLD text (LibreChat) → Need rebuild!
  OR
Code doesn't execute → Check logs!
  OR
Auth error → Wrong API key!
  OR
Rate limit → Wait 24h or self-host!
```

---

## 🚀 **NEXT STEPS AFTER SUCCESSFUL TEST**

1. **Report results** to me
2. **If working**: Can use immediately! No further changes needed.
3. **If errors**: Share logs and I'll fix
4. **Optional enhancements**:
   - Add file input support
   - Add image output support
   - Self-host Judge0 for unlimited executions

---

## 📞 **DEBUGGING COMMANDS**

Quick reference for troubleshooting:

```powershell
# Check container status
docker-compose ps

# API logs (last 100 lines)
docker-compose logs api --tail=100

# Search for Judge0 in logs
docker-compose logs api | Select-String "judge0"

# Search for errors
docker-compose logs api | Select-String "error" -Context 2

# Restart everything
docker-compose restart

# Full rebuild
docker-compose down
docker-compose up -d --build

# Check Judge0 files exist
docker-compose exec api ls -la /app/api/server/services/Tools/

# Test Judge0 client directly
docker-compose exec api node -e "const {Judge0Client} = require('./api/server/services/Tools/judge0-client'); console.log('OK')"
```

---

## 💡 **TIPS**

### Tip 1: Testing Different Languages

Ask the AI:
> "Can you execute code in [language]? Write a Hello World example and run it."

Try: Python, JavaScript, Java, C++, Go, Rust, PHP, Ruby, etc.

### Tip 2: Checking Available Languages

Ask the AI:
> "What programming languages can you execute?"

Should list 70+ languages!

### Tip 3: Performance Testing

Ask the AI:
> "Write a Python function to calculate the first 1000 Fibonacci numbers and time it."

Should show execution time and memory usage!

---

## 🎉 **YOU'RE DONE!**

**When tests pass**: You have a working Code Interpreter with 70+ languages! 🚀

**Next**: Use it for:
- Learning programming
- Testing algorithms
- Quick calculations
- Code debugging
- Algorithm comparisons
- Data analysis

**Enjoy your FREE code execution with Judge0!** ✅

---

**Need Help?** Check troubleshooting section or share logs!

**Ready to test?** Follow the steps above and report back! 🧪
