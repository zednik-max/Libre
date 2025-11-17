# UI Navigation Guide - Creating Agents & Assistants

**Quick Reference**: How to create and configure Agents and Assistants in LibreChat

---

## Creating an Agent

**1. Access Agent Builder**:
- Click **"Agent Marketplace"** icon in the sidebar (grid icon)
- Or click **"New Chat"** dropdown → Select **"New Agent"**

**2. Create New Agent**:
- Click **"Create"** or **"New Agent"** button
- Fill in basic info:
  - **Name**: "My Custom Agent"
  - **Description**: What this agent does
  - **Provider**: Select AI provider (OpenAI, Google, Anthropic, etc.)
  - **Model**: Select model (gpt-4o, gemini-2.0-flash-exp, claude-3-5-sonnet, etc.)

**3. Add Tools**:
- Scroll to **"Tools"** section
- Click **"Add Tool"** or use the dropdown
- Select tools from the list:
  - ✅ **Web Search** (Tavily, Google Search)
  - ✅ **Code Interpreter** (Judge0)
  - ✅ **Wolfram** (Math/calculations)
  - ✅ **OpenWeather** (Weather data)
  - ✅ **File Search** (RAG)
  - ✅ Custom MCP tools (if configured)

**4. Configure Instructions (Optional)**:
- **System Instructions**: Define agent behavior
- **Conversation Starters**: Pre-defined prompts

**5. Save**:
- Click **"Save"** or **"Create Agent"**
- Agent appears in Agent Marketplace

**6. Use Agent**:
- Click on your agent in the marketplace
- Start chatting with the configured tools

---

## Creating an Assistant (OpenAI)

**Prerequisites**:
- ASSISTANTS_API_KEY configured
- OpenAI endpoint enabled

**1. Access Assistant Builder**:
- Click **"Assistants"** icon in sidebar
- Or **"New Chat"** dropdown → **"New Assistant"**

**2. Create New Assistant**:
- Click **"Create Assistant"** button
- Fill in details:
  - **Name**: "My Assistant"
  - **Description**: Purpose of assistant
  - **Model**: Select OpenAI model (gpt-4o, gpt-4-turbo, etc.)
  - **Instructions**: System prompt

**3. Enable Tools**:
- In **"Tools"** section, toggle tools on/off:
  - ✅ **Code Interpreter** (OpenAI built-in)
  - ✅ **File Search** (OpenAI retrieval)
  - ✅ **Functions** (Custom tools)

**4. Add Knowledge (Optional)**:
- Upload files for retrieval
- Supports: PDF, TXT, DOCX, CSV, etc.

**5. Save**:
- Click **"Save Assistant"**
- Assistant appears in your list

**6. Use Assistant**:
- Select assistant from list
- Start conversation with tools enabled

---

## Key Differences: Agents vs Assistants

| Feature | Agents | Assistants |
|---------|--------|------------|
| **Providers** | Multi-provider (OpenAI, Google, Anthropic, etc.) | OpenAI only |
| **Tools** | All LibreChat tools + MCP | OpenAI built-in tools |
| **Flexibility** | High (agent chains, edges) | Limited to OpenAI features |
| **Code Interpreter** | Judge0 (70+ languages) | OpenAI (Python only) |
| **Recommended** | ✅ Yes (more features, flexible) | For OpenAI-specific use cases |

---

## Quick Start: Adding a Tool to Existing Agent/Assistant

**For Agents**:
1. Go to **Agent Marketplace**
2. Find your agent → Click **"Edit"** (pencil icon)
3. Scroll to **"Tools"** section
4. Click **"Add Tool"** → Select tool → **Save**

**For Assistants**:
1. Go to **Assistants** list
2. Select assistant → Click **"Edit"**
3. In **"Tools"** section → Toggle tool ON
4. Click **"Save"**

---

## Troubleshooting

**Tool not appearing in list**:
- Check environment variables (.env) for API keys
- Restart LibreChat: `docker-compose restart api`
- Refresh browser (Ctrl+Shift+R)

**Agent/Assistant not working**:
- Verify API key configured correctly
- Check model availability for selected provider
- Review logs: `docker logs libre_api`

---

**Related Guides**:
- [LibreChat - Agents.md](../../LibreChat%20-%20Agents.md) - Complete Agent guide (for users)
- [AGENTS.md](../../AGENTS.md) - Developer guide
- Configuration guides in this folder for specific tools

---

*This is a quick reference for UI navigation. For detailed feature documentation, see the main guides.*
