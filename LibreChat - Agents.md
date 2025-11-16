# LibreChat Agents Guide

**Version**: v0.8.1-rc1
**Last Updated**: 2025-11-16
**For Developers**: See [AGENTS_CUSTOMIZATIONS.md](./AGENTS_CUSTOMIZATIONS.md) for technical customization guide

---

## Table of Contents

1. [What are Agents?](#what-are-agents)
2. [Agent Capabilities](#agent-capabilities)
3. [Using Agents](#using-agents)
4. [Creating Custom Agents](#creating-custom-agents)
5. [Agent Tools](#agent-tools)
6. [Agent Marketplace](#agent-marketplace)
7. [Multi-Agent Workflows](#multi-agent-workflows)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## What are Agents?

**Agents** in LibreChat are autonomous AI assistants that can:
- Use tools (code execution, web search, file operations)
- Access and process files
- Make decisions based on context
- Chain multiple operations together
- Collaborate with other agents

Unlike simple chat models, agents can:
- **Reason** about which tool to use
- **Execute** code and retrieve results
- **Search** the web for current information
- **Process** documents and extract information
- **Collaborate** with other agents in multi-agent workflows

### Key Differences: Agents vs. Assistants vs. Chat

| Feature | Chat | Assistant | Agent |
|---------|------|-----------|-------|
| Basic conversation | ✅ | ✅ | ✅ |
| File uploads | ✅ | ✅ | ✅ |
| Tool calling | ❌ | ✅ | ✅ |
| Code execution | ❌ | ✅ (limited) | ✅ |
| Web search | ❌ | ❌ | ✅ |
| Multi-agent workflows | ❌ | ❌ | ✅ |
| Custom instructions | ✅ | ✅ | ✅ |
| Versioning | ❌ | ✅ | ✅ |
| Marketplace | ❌ | ❌ | ✅ |

---

## Agent Capabilities

### 1. Tool Usage

Agents can use built-in tools:

**Code Execution** (`execute_code`):
- Runs code in 70+ programming languages
- Supports Python, JavaScript, Java, C++, Go, Rust, and more
- Isolated sandboxed execution via Judge0
- Returns output, errors, and execution time

**Web Search** (`web_search`):
- Real-time web search via Serper API
- Returns top search results with snippets
- Supports web scraping for detailed content
- Reranking with Jina AI for relevance

**File Search** (`file_search`):
- Vector-based semantic search in uploaded documents
- Supports PDF, TXT, DOCX, and more
- RAG (Retrieval-Augmented Generation) powered
- Citation support with source references

**MCP Tools** (Model Context Protocol):
- Connect to external MCP servers
- Custom tool definitions
- Third-party integrations
- Extensible tool ecosystem

### 2. File Processing

Agents can:
- **Upload and attach** files to conversations
- **Extract content** from PDFs, documents, images
- **Search within** file contents semantically
- **Generate** new files (code, reports, data)
- **Store** files in tool resources for reuse

### 3. Reasoning and Planning

Agents use **recursive reasoning** to:
- Break down complex tasks into steps
- Choose appropriate tools for each step
- Execute operations in sequence
- Aggregate results and provide final answer

**Recursion Limit**: Controls how many steps an agent can take (default: 25, max: 100)

### 4. Multi-Agent Collaboration

Agents can:
- **Call other agents** as sub-agents
- **Pass context** between agents
- **Specialize** different agents for different tasks
- **Orchestrate** complex workflows with agent graphs

---

## Using Agents

### Accessing Agents

1. **Via Endpoint Selector**:
   - Click the endpoint dropdown in the chat interface
   - Select **"Agents"** from the list
   - Choose a pre-built agent or create a new one

2. **Via Agent Marketplace**:
   - Click **"Marketplace"** in the sidebar
   - Browse available agents by category
   - Click an agent to view details
   - Click **"Use Agent"** to start a conversation

### Starting a Conversation with an Agent

1. Select an agent from the endpoint selector
2. Type your message in the chat input
3. The agent will:
   - Analyze your request
   - Decide which tools to use
   - Execute operations
   - Return results with explanations

### Example Conversations

**Code Execution Example**:
```
You: "Write a Python script to calculate fibonacci numbers and run it for n=10"

Agent:
- Analyzes request
- Generates Python code
- Uses execute_code tool
- Returns: "Here's the Fibonacci sequence up to 10: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]"
```

**Web Search Example**:
```
You: "What are the latest updates on Claude AI in 2025?"

Agent:
- Uses web_search tool
- Searches for "Claude AI updates 2025"
- Scrapes relevant articles
- Synthesizes information
- Returns: "Based on recent sources, Claude released..."
```

**File Search Example**:
```
You: "Find all mentions of 'authentication' in the uploaded PDF"

Agent:
- Uses file_search tool
- Performs vector search in document
- Retrieves relevant passages
- Returns: "I found 5 mentions of authentication: [citations]"
```

---

## Creating Custom Agents

### Via UI (Agent Builder)

1. **Open Agent Builder**:
   - Click **"Agents"** in the endpoint selector
   - Click **"+ Create Agent"** button

2. **Configure Basic Settings**:
   ```
   Name: "Research Assistant"
   Description: "An agent that searches the web and summarizes findings"
   Provider: OpenAI, Anthropic, Google, or Vertex AI
   Model: Select the AI model (e.g., gpt-4o, claude-sonnet-4)
   ```

3. **Set Instructions**:
   ```
   You are a research assistant specialized in finding and summarizing
   information from the web. Always cite your sources and provide
   detailed explanations.

   When searching:
   1. Use multiple search queries to gather comprehensive information
   2. Verify information from multiple sources
   3. Provide citations for all claims
   ```

4. **Enable Tools**:
   - ☑ **Code Interpreter** - For code execution
   - ☑ **Web Search** - For real-time information
   - ☑ **File Search** - For document analysis
   - ☑ **MCP Tools** - For custom integrations

5. **Configure Model Parameters** (optional):
   ```
   Temperature: 0.7 (creativity vs. consistency)
   Max Tokens: 4096 (response length)
   Top P: 0.9 (nucleus sampling)
   Recursion Limit: 50 (how many tool calls)
   ```

6. **Advanced Settings**:
   - **Hide Sequential Outputs**: Hide intermediate tool results
   - **End After Tools**: Stop after tool execution (no synthesis)
   - **Artifacts**: Enable code artifacts (React, HTML, Mermaid)
   - **Conversation Starters**: Pre-defined prompts for users

7. **Save and Test**:
   - Click **"Save Agent"**
   - Click **"Test"** to start a conversation
   - Iterate and refine based on results

### Agent Configuration Fields

| Field | Description | Example |
|-------|-------------|---------|
| **Name** | Agent display name | "Python Code Assistant" |
| **Description** | What the agent does | "Helps write and debug Python code" |
| **Provider** | AI provider | OpenAI, Anthropic, Google, Vertex AI |
| **Model** | Specific model | gpt-4o, claude-sonnet-4, gemini-2.5-pro |
| **Instructions** | System prompt | "You are an expert Python developer..." |
| **Tools** | Enabled capabilities | [execute_code, web_search] |
| **Recursion Limit** | Max tool calls | 25-100 |
| **Category** | Marketplace category | coding, research, writing, general |

---

## Agent Tools

### Built-in Tools

#### 1. Code Interpreter (`execute_code`)

**Purpose**: Execute code in 70+ programming languages

**When to enable**:
- Programming assistance
- Data analysis
- Algorithm development
- Testing and debugging

**Configuration**:
- Requires: `CODE_API_KEY` (RapidAPI Judge0 key)
- Languages: Python, JavaScript, Java, C++, Go, Rust, Ruby, PHP, and 60+ more
- Timeout: 1-15 seconds (default: 5s)
- Memory: 128MB per execution

**Example usage**:
```
User: "Calculate the first 100 prime numbers"
Agent: Uses execute_code to run Python/JavaScript
Returns: [2, 3, 5, 7, 11, 13, ...]
```

#### 2. Web Search (`web_search`)

**Purpose**: Search the web and retrieve current information

**When to enable**:
- Research tasks
- Current events
- Fact-checking
- Finding documentation

**Configuration**:
- Requires: `SERPER_API_KEY` (Google Search API)
- Optional: `JINA_API_KEY` (for reranking)
- Results: Top 10 search results
- Scraping: Full page content extraction

**Example usage**:
```
User: "What's the weather in Tokyo today?"
Agent: Uses web_search to find current weather
Returns: "According to weather.com, Tokyo is currently 15°C..."
```

#### 3. File Search (`file_search`)

**Purpose**: Semantic search within uploaded documents

**When to enable**:
- Document analysis
- Information extraction
- Research assistance
- Content summarization

**Configuration**:
- Requires: RAG API (vector database)
- Supported formats: PDF, TXT, DOCX, MD
- Max file size: 20MB (configurable)
- Vector embeddings: OpenAI, Azure, or local

**Example usage**:
```
User uploads contract.pdf
User: "What are the termination clauses?"
Agent: Uses file_search to find relevant sections
Returns: "I found 3 termination clauses: [citations]"
```

#### 4. MCP Tools (Model Context Protocol)

**Purpose**: Connect to external tool servers

**When to enable**:
- Custom integrations
- Third-party APIs
- Database access
- External services

**Configuration**:
- Requires: MCP server URL and authentication
- Tools: Defined by MCP server
- Security: Per-user authentication

**Example MCP tools**:
- Database queries (PostgreSQL, MySQL)
- Cloud services (AWS, GCP, Azure)
- Business tools (Slack, GitHub, Jira)
- Custom APIs

---

## Agent Marketplace

### What is the Marketplace?

The **Agent Marketplace** is a centralized hub for:
- Discovering pre-built agents
- Sharing your agents with others
- Finding specialized agents for specific tasks
- Rating and reviewing agents

### Browsing the Marketplace

1. **Access Marketplace**:
   - Click **"Marketplace"** in the sidebar
   - Or navigate to `/marketplace` in the UI

2. **Filter by Category**:
   - **Coding**: Programming and development assistants
   - **Research**: Web search and analysis agents
   - **Writing**: Content creation and editing
   - **Data Analysis**: Data processing and visualization
   - **General**: Multi-purpose assistants

3. **Search Agents**:
   - Use the search bar to find specific agents
   - Filter by provider, tools, or capabilities

4. **View Agent Details**:
   - Click an agent card to see full details
   - View description, tools, model, author
   - See conversation starters (example prompts)
   - Check ratings and reviews (if enabled)

### Publishing Your Agent

1. **Create an agent** in the Agent Builder
2. **Test thoroughly** to ensure it works as expected
3. **Set metadata**:
   - Category: Choose appropriate category
   - Description: Clear, concise description
   - Conversation Starters: Example prompts
   - Avatar: Upload a custom icon (optional)
4. **Publish**: Click **"Publish to Marketplace"**
5. **Promote** (optional): Admin can feature your agent

### Agent Categories

| Category | Description | Example Agents |
|----------|-------------|----------------|
| **coding** | Programming assistance | Python Code Assistant, Debugger Pro |
| **research** | Web research and analysis | Research Assistant, Fact Checker |
| **writing** | Content creation | Creative Writer, Blog Assistant |
| **data** | Data analysis | Data Analyst, CSV Parser |
| **general** | Multi-purpose | General Assistant, Task Helper |

---

## Multi-Agent Workflows

### What are Multi-Agent Workflows?

Multi-agent workflows allow you to:
- **Orchestrate** multiple specialized agents
- **Chain** tasks across agents
- **Parallelize** operations
- **Build** complex automation

### Creating Multi-Agent Workflows

#### Method 1: Agent Edges (Graph-based)

**Concept**: Define directed graph of agent relationships

**Example**:
```
Research Agent → Summarizer Agent → Writer Agent
     ↓
  Fact Checker Agent
```

**Configuration**:
1. Create individual agents for each task
2. Define **edges** between agents:
   ```json
   {
     "edges": [
       { "from": "research-agent-id", "to": "summarizer-agent-id" },
       { "from": "research-agent-id", "to": "fact-checker-id" },
       { "from": "summarizer-agent-id", "to": "writer-agent-id" }
     ]
   }
   ```
3. Set the **root agent** as the entry point
4. Agent system automatically orchestrates workflow

#### Method 2: Collaborative Agents

**Concept**: Agents call each other as tools

**Configuration**:
1. Enable **"Collaborative"** mode on agents
2. Agents can invoke other agents by name
3. Context is passed between agents
4. Results are aggregated

**Example**:
```
User: "Research quantum computing and write a blog post"

Master Agent:
  1. Calls Research Agent → Gathers sources
  2. Calls Fact Checker Agent → Verifies claims
  3. Calls Writer Agent → Drafts blog post
  4. Returns: Final blog post with citations
```

### Multi-Agent Best Practices

1. **Specialize agents**: Each agent should have a clear, focused purpose
2. **Limit depth**: Avoid recursive loops (max recursion: 100)
3. **Pass context**: Ensure agents have necessary information
4. **Handle errors**: Set fallback strategies for agent failures
5. **Monitor costs**: Multi-agent workflows consume more tokens

---

## Best Practices

### 1. Writing Effective Instructions

**Do**:
- ✅ Be specific and clear
- ✅ Provide examples of desired behavior
- ✅ Define output format expectations
- ✅ Include error handling guidance
- ✅ Use role-based instructions ("You are an expert...")

**Don't**:
- ❌ Be vague or ambiguous
- ❌ Contradict tool capabilities
- ❌ Exceed context limits (keep under 2000 characters)
- ❌ Include sensitive information in instructions

**Example - Good Instructions**:
```
You are a Python debugging expert. When users share code:

1. Analyze the code for syntax errors, logic bugs, and performance issues
2. Use the code interpreter to test fixes when possible
3. Provide explanations for why bugs occurred
4. Suggest best practices and optimizations

Always format code in markdown code blocks with syntax highlighting.
```

**Example - Bad Instructions**:
```
Help with code.
```

### 2. Choosing the Right Model

| Task Type | Recommended Models |
|-----------|-------------------|
| **Complex reasoning** | GPT-4o, Claude Sonnet 4, Gemini Pro 2.5 |
| **Fast responses** | GPT-4o-mini, Claude Haiku, Gemini Flash |
| **Code generation** | GPT-4o, DeepSeek Coder, Codestral |
| **Long context** | Claude Sonnet (200k), Gemini Pro (2M) |
| **Cost-effective** | GPT-4o-mini, Llama 3.3 70B, Mixtral |

### 3. Tool Selection Strategy

**Enable only necessary tools**:
- Each enabled tool consumes tokens in the prompt
- Too many tools can confuse the agent
- Focus on tools relevant to the agent's purpose

**Example**:
- **Research Agent**: web_search, file_search ✅ | execute_code ❌
- **Code Assistant**: execute_code ✅ | web_search ❌ (unless looking up docs)
- **Document Analyzer**: file_search ✅ | web_search ❌

### 4. Recursion Limit Guidelines

| Use Case | Recommended Limit |
|----------|------------------|
| **Simple tasks** | 10-25 |
| **Research workflows** | 25-50 |
| **Complex multi-step** | 50-75 |
| **Multi-agent systems** | 75-100 |

**Warning**: Higher limits = higher costs and longer response times

### 5. Cost Optimization

**Reduce costs by**:
- Using smaller models when appropriate (gpt-4o-mini vs. gpt-4o)
- Limiting recursion depth
- Disabling unnecessary tools
- Caching frequently used instructions
- Setting max token limits

**Example cost comparison**:
- GPT-4o: $2.50 per 1M input tokens
- GPT-4o-mini: $0.15 per 1M input tokens
- Claude Haiku: $0.25 per 1M input tokens

---

## Troubleshooting

### Agent Not Using Tools

**Symptoms**:
- Agent responds without using enabled tools
- Tool calls are ignored

**Solutions**:
1. Check tool is enabled in agent configuration
2. Verify API keys are set (CODE_API_KEY, SERPER_API_KEY, etc.)
3. Update instructions to explicitly mention tool usage
4. Check provider supports tool calling (all major providers do)
5. Increase recursion limit if agent stops early

**Example fix**:
```
# Add to instructions:
"When asked to search for information, ALWAYS use the web_search tool.
When asked to run code, ALWAYS use the code interpreter."
```

### Tool Execution Errors

**Code Interpreter Errors**:
- "Missing CODE_API_KEY": Set environment variable or enter in UI
- "Execution timeout": Increase timeout parameter (max: 15s)
- "Compilation error": Check code syntax, agent may need refinement

**Web Search Errors**:
- "Missing SERPER_API_KEY": Configure in environment or librechat.yaml
- "Rate limit exceeded": Upgrade Serper plan or add delay between searches

**File Search Errors**:
- "RAG API not configured": Ensure RAG service is running
- "File not found": Check file was uploaded and attached to conversation
- "Unsupported file type": Verify file format is supported

### Agent Produces Incomplete Results

**Symptoms**:
- Agent stops mid-task
- Results are truncated

**Solutions**:
1. **Increase max tokens**: Set higher output limit in model parameters
2. **Increase recursion limit**: Allow more tool calls
3. **Simplify task**: Break into smaller sub-tasks
4. **Check context limits**: Reduce input size if exceeding model limits

### Multi-Agent Workflow Failures

**Symptoms**:
- Sub-agents not being called
- Context loss between agents
- Infinite loops

**Solutions**:
1. **Verify edges**: Check agent graph is correctly defined
2. **Enable collaborative mode**: Set `isCollaborative: true`
3. **Add loop detection**: Set reasonable recursion limits
4. **Check permissions**: Ensure agents have access to call sub-agents

### Performance Issues

**Symptoms**:
- Slow response times
- High token usage
- Timeout errors

**Solutions**:
1. **Use faster models**: Switch to GPT-4o-mini, Claude Haiku, or Gemini Flash
2. **Reduce tool count**: Disable unnecessary tools
3. **Limit file sizes**: Smaller files = faster processing
4. **Cache results**: Enable caching in librechat.yaml
5. **Optimize instructions**: Shorter instructions = less tokens

---

## Advanced Topics

### For Developers

For technical customization, API integration, and advanced agent development, see:

📘 **[AGENTS_CUSTOMIZATIONS.md](./AGENTS_CUSTOMIZATIONS.md)**

Topics covered:
- Agent schema and database structure
- Creating agents programmatically via API
- Building custom tools
- MCP server integration
- Multi-agent orchestration with LangGraph
- Advanced tool configurations
- Debugging and monitoring

---

## Quick Reference

### Agent Lifecycle

```
1. User selects agent
2. Agent loads configuration (model, tools, instructions)
3. User sends message
4. Agent analyzes request
5. Agent decides which tools to use (if any)
6. Agent executes tools and collects results
7. Agent synthesizes final response
8. Response displayed to user
```

### Environment Variables

```bash
# Code Interpreter
CODE_API_KEY=your_rapidapi_judge0_key

# Web Search
SERPER_API_KEY=your_serper_api_key

# Optional: Jina Reranker
JINA_API_KEY=your_jina_api_key

# RAG/File Search
RAG_API_URL=http://rag_api:8000
```

### API Endpoints

```
GET    /api/agents              # List all agents
GET    /api/agents/:id          # Get agent details
POST   /api/agents              # Create new agent
PUT    /api/agents/:id          # Update agent
DELETE /api/agents/:id          # Delete agent
POST   /api/agents/:id/execute  # Execute agent
```

See [AGENTS_CUSTOMIZATIONS.md](./AGENTS_CUSTOMIZATIONS.md) for detailed API documentation.

---

## Resources

- **LibreChat Documentation**: https://docs.librechat.ai/
- **Agent API Reference**: https://docs.librechat.ai/api/agents
- **Tool Development Guide**: [AGENTS_CUSTOMIZATIONS.md](./AGENTS_CUSTOMIZATIONS.md#custom-tools)
- **GitHub Repository**: https://github.com/danny-avila/LibreChat
- **Discord Community**: https://discord.librechat.ai

---

**Need Help?**
- Check [Troubleshooting](#troubleshooting) section
- Visit [GitHub Discussions](https://github.com/danny-avila/LibreChat/discussions)
- Join [Discord Community](https://discord.librechat.ai)
- Read [AGENTS_CUSTOMIZATIONS.md](./AGENTS_CUSTOMIZATIONS.md) for technical details

---

*Document Version: 1.0.0 | LibreChat v0.8.1-rc1*
