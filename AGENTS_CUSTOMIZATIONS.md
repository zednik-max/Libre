# LibreChat Agents - Developer Customization Guide

**Version**: v0.8.1-rc1
**Last Updated**: 2025-11-16
**Audience**: Developers, DevOps, System Integrators

**Related Documentation**:
- **For AI Coding Agents**: See [AGENTS.md](./AGENTS.md) - Development environment guide (agents.md format)
- **For End Users**: See [LibreChat - Agents.md](./LibreChat%20-%20Agents.md) - User guide for LibreChat's agent features

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Agent Schema](#agent-schema)
3. [Creating Agents Programmatically](#creating-agents-programmatically)
4. [Custom Tool Development](#custom-tool-development)
5. [MCP Server Integration](#mcp-server-integration)
6. [API Reference](#api-reference)
7. [Multi-Agent Orchestration](#multi-agent-orchestration)
8. [Database Operations](#database-operations)
9. [Advanced Configurations](#advanced-configurations)
10. [Debugging and Monitoring](#debugging-and-monitoring)

---

## Architecture Overview

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Agent Builder│  │  Marketplace │  │  Chat UI     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                    React Query Hooks                         │
└────────────────────────────┼─────────────────────────────────┘
                             │
                    REST API / SSE
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                   Backend (Node.js/Express)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Agent Routes │  │ Agent Service│  │ Tool Service │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                   Agent Initialization                       │
│                            │                                 │
│  ┌──────────────────────────┴─────────────────────────┐    │
│  │         @librechat/agents Package                   │    │
│  │  ┌──────────────┐  ┌──────────────┐               │    │
│  │  │ Agent Executor│  │ Tool Manager │               │    │
│  │  └──────────────┘  └──────────────┘               │    │
│  └─────────────────────────────────────────────────────┘    │
│                            │                                 │
│  ┌─────────────────────────┼──────────────────────────┐    │
│  │              AI Provider Clients                    │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │    │
│  │  │ OpenAI  │ │Anthropic│ │ Google  │ │ Bedrock │ │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────┼───────────────────────────────┘
                              │
                     ┌────────┴────────┐
                     │                 │
              ┌──────▼──────┐   ┌─────▼──────┐
              │   MongoDB   │   │   Redis    │
              │  (Agents,   │   │  (Cache)   │
              │   Tools)    │   │            │
              └─────────────┘   └────────────┘
                     │
              ┌──────▼──────┐
              │ Tool Servers│
              │  - Judge0   │
              │  - Serper   │
              │  - MCP      │
              │  - RAG API  │
              └─────────────┘
```

### Data Flow

**Agent Execution Flow**:
```
1. User message → Frontend
2. Frontend → POST /api/messages (with agent_id)
3. Backend loads agent from MongoDB
4. Agent initialization:
   - Load model configuration
   - Initialize tools (execute_code, web_search, etc.)
   - Load file resources
   - Set up provider client
5. Agent execution loop:
   a. Send message to AI provider
   b. AI decides to call tool or respond
   c. If tool call: Execute tool → Return result → Repeat
   d. If response: Return to user
6. Stream results via SSE
7. Save conversation to MongoDB
```

### File Structure

```
/home/user/Libre/
├── api/
│   ├── server/
│   │   ├── routes/
│   │   │   └── agents.js                    # Agent CRUD routes
│   │   ├── controllers/
│   │   │   └── agents/                      # Agent controllers
│   │   │       ├── client.js                # Agent execution
│   │   │       ├── create.js                # Create agent
│   │   │       ├── update.js                # Update agent
│   │   │       └── delete.js                # Delete agent
│   │   ├── services/
│   │   │   ├── Endpoints/agents/            # Agent services
│   │   │   │   ├── agent.js                 # Agent initialization
│   │   │   │   ├── initialize.js            # Tool loading
│   │   │   │   └── build.js                 # Agent builder
│   │   │   └── Tools/                       # Tool implementations
│   │   │       ├── judge0.js                # Code execution
│   │   │       ├── judge0-client.js         # Judge0 API client
│   │   │       ├── languages.js             # Language detection
│   │   │       ├── search.js                # Web search
│   │   │       └── mcp.js                   # MCP tools
│   │   └── middleware/
│   │       └── accessResources/             # Agent access control
│   └── app/
│       └── clients/
│           └── tools/                       # Tool utilities
│               └── util/
│                   └── handleTools.js       # Tool execution handler
├── packages/
│   ├── data-schemas/
│   │   └── src/
│   │       ├── models/
│   │       │   └── agent.ts                 # Agent Mongoose model
│   │       └── schema/
│   │           └── agent.ts                 # Agent schema definition
│   └── data-provider/
│       └── src/
│           └── react-query/
│               └── agents.ts                # Agent React Query hooks
└── client/
    └── src/
        ├── components/
        │   └── Agents/                      # Agent UI components
        │       ├── AgentCard.tsx
        │       ├── AgentDetail.tsx
        │       ├── Marketplace.tsx
        │       └── ...
        └── hooks/
            └── Agents/                      # Agent hooks
                ├── useCreateAgent.ts
                ├── useUpdateAgent.ts
                └── ...
```

---

## Agent Schema

### Database Schema (MongoDB)

**Location**: `packages/data-schemas/src/schema/agent.ts`

```typescript
interface IAgent {
  // Identity
  id: string;                               // Unique agent ID (UUID)
  name: string;                             // Display name
  description: string;                      // Agent description
  avatar?: string | { source: string };     // Avatar URL or object

  // AI Configuration
  provider: string;                         // AI provider (openAI, anthropic, google, etc.)
  model: string;                            // Model name (gpt-4o, claude-sonnet-4, etc.)
  model_parameters?: {                      // Model parameters
    temperature?: number;                   // 0-2 (default: 1)
    max_tokens?: number;                    // Max output tokens
    top_p?: number;                         // Nucleus sampling
    frequency_penalty?: number;             // -2 to 2
    presence_penalty?: number;              // -2 to 2
    [key: string]: any;                     // Additional provider-specific params
  };

  // Instructions
  instructions?: string;                    // System prompt/instructions
  artifacts?: string;                       // Artifact generation mode (react|html|mermaid)

  // Tools and Capabilities
  tools?: string[];                         // Enabled tools ['execute_code', 'web_search', 'file_search']
  tool_kwargs?: Array<Record<string, any>>; // Tool-specific configurations
  actions?: string[];                       // Custom actions
  tool_resources?: {                        // Tool resource configurations
    file_search?: {
      vector_store_ids?: string[];
    };
    code_interpreter?: {
      file_ids?: string[];
    };
  };

  // Agent Behavior
  recursion_limit?: number;                 // Max tool calls (default: 25, max: 100)
  hide_sequential_outputs?: boolean;        // Hide intermediate tool results
  end_after_tools?: boolean;                // Stop after tool execution

  // Multi-Agent
  edges?: Array<{                           // Agent graph edges
    from: string;                           // Source agent ID
    to: string;                             // Target agent ID
    condition?: string;                     // Conditional edge
  }>;
  isCollaborative?: boolean;                // Enable agent collaboration

  // Conversation
  conversation_starters?: string[];         // Example prompts

  // Versioning
  versions?: Array<{                        // Version history
    version: number;
    timestamp: Date;
    changes: Record<string, any>;
  }>;

  // Marketplace
  category?: string;                        // Category (coding, research, writing, etc.)
  is_promoted?: boolean;                    // Featured in marketplace
  support_contact?: {                       // Support contact info
    email?: string;
    url?: string;
  };

  // Access Control
  access_level?: number;                    // Access level (0=private, 1=shared, 2=public)
  author: ObjectId;                         // User ID of creator
  authorName?: string;                      // Creator's display name
  projectIds?: ObjectId[];                  // Associated projects

  // Metadata
  createdAt: Date;                          // Creation timestamp
  updatedAt: Date;                          // Last update timestamp
}
```

### Field Descriptions

#### Provider Configuration

**provider**: AI provider identifier
- `openAI` - OpenAI API
- `anthropic` - Anthropic Claude
- `google` - Google Gemini
- `azureOpenAI` - Azure OpenAI
- `bedrock` - AWS Bedrock
- `vertexAI` - Google Vertex AI
- `ollama` - Local Ollama

**model**: Model identifier specific to provider
- OpenAI: `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`
- Anthropic: `claude-sonnet-4`, `claude-opus-4`, `claude-haiku-4`
- Google: `gemini-2.5-pro`, `gemini-2.5-flash`
- Vertex AI: Custom model names from Model Garden

#### Tool Configuration

**tools**: Array of tool identifiers
```typescript
[
  'execute_code',      // Code Interpreter (Judge0)
  'web_search',        // Web search (Serper)
  'file_search',       // RAG file search
  'mcp_tool_name'      // MCP tool (dynamic)
]
```

**tool_resources**: Tool-specific resource configurations
```typescript
{
  file_search: {
    vector_store_ids: ['vs_abc123']  // Vector store IDs for RAG
  },
  code_interpreter: {
    file_ids: ['file_xyz789']        // Pre-loaded files for code execution
  }
}
```

#### Agent Edges (Multi-Agent Graphs)

**edges**: Define agent call graph
```typescript
[
  {
    from: 'agent_research',
    to: 'agent_summarizer'
  },
  {
    from: 'agent_summarizer',
    to: 'agent_writer',
    condition: 'length > 1000'  // Conditional edge
  }
]
```

---

## Creating Agents Programmatically

### Via API Endpoint

**Endpoint**: `POST /api/agents`

**Request Body**:
```json
{
  "name": "Python Code Assistant",
  "description": "Expert Python developer that writes, tests, and debugs code",
  "provider": "openAI",
  "model": "gpt-4o",
  "model_parameters": {
    "temperature": 0.3,
    "max_tokens": 4096
  },
  "instructions": "You are an expert Python developer. Always test code using the code interpreter before providing final answers. Focus on clean, efficient, well-documented code.",
  "tools": ["execute_code", "web_search"],
  "recursion_limit": 50,
  "hide_sequential_outputs": false,
  "conversation_starters": [
    "Help me debug this Python function",
    "Write a script to parse CSV files",
    "Optimize this algorithm for performance"
  ],
  "category": "coding",
  "access_level": 1
}
```

**Response**:
```json
{
  "id": "agent_abc123xyz",
  "name": "Python Code Assistant",
  "description": "Expert Python developer...",
  "provider": "openAI",
  "model": "gpt-4o",
  "author": "user_id",
  "createdAt": "2025-11-16T10:00:00.000Z",
  "updatedAt": "2025-11-16T10:00:00.000Z"
}
```

### Via MongoDB Direct Insert

**Node.js Example**:
```javascript
const { Agent } = require('@librechat/data-schemas');

async function createAgent() {
  const agent = await Agent.create({
    id: `agent_${Date.now()}`,
    name: 'Research Assistant',
    description: 'Web research and summarization specialist',
    provider: 'anthropic',
    model: 'claude-sonnet-4',
    model_parameters: {
      temperature: 0.7,
      max_tokens: 8192
    },
    instructions: `You are a research assistant. Follow these steps:
1. Search the web for relevant information
2. Verify facts from multiple sources
3. Cite all sources
4. Provide comprehensive summaries`,
    tools: ['web_search', 'file_search'],
    tool_resources: {
      file_search: {
        vector_store_ids: []
      }
    },
    recursion_limit: 30,
    conversation_starters: [
      'Research the latest developments in quantum computing',
      'Find and summarize studies on climate change mitigation'
    ],
    category: 'research',
    author: userId,
    authorName: 'Admin',
    access_level: 2, // Public
    is_promoted: true
  });

  return agent;
}
```

### Via LibreChat Agent Service

**Location**: `api/server/services/Endpoints/agents/build.js`

```javascript
const { buildAgent } = require('~/server/services/Endpoints/agents');

async function createCustomAgent(req, res) {
  const agentData = {
    name: 'Data Analyst',
    description: 'Analyzes and visualizes data',
    provider: 'openAI',
    model: 'gpt-4o',
    instructions: 'Analyze data and create visualizations...',
    tools: ['execute_code', 'file_search'],
    model_parameters: {
      temperature: 0.5
    }
  };

  const agent = await buildAgent({
    req,
    res,
    agentData,
    userId: req.user.id
  });

  res.json({ agent });
}
```

---

## Custom Tool Development

### Tool Structure

All tools must extend LangChain's `DynamicStructuredTool`:

```javascript
const { z } = require('zod');
const { DynamicStructuredTool } = require('@langchain/core/tools');

function createMyCustomTool(config) {
  const { user_id, apiKey, baseURL } = config;

  // Define Zod schema for input validation
  const schema = z.object({
    parameter1: z.string().describe('Description of parameter 1'),
    parameter2: z.number().optional().describe('Optional parameter 2'),
  });

  // Create LangChain DynamicStructuredTool
  const tool = new DynamicStructuredTool({
    name: 'my_custom_tool',
    description: 'Description of what this tool does. AI uses this to decide when to call it.',
    schema,
    func: async ({ parameter1, parameter2 }) => {
      try {
        // Tool implementation
        const result = await performToolOperation(parameter1, parameter2);

        // Return formatted result
        return formatOutput(result);
      } catch (error) {
        logger.error('[MyCustomTool] Error:', error);
        return formatError(`Tool failed: ${error.message}`);
      }
    },
  });

  // Attach apiKey for credential system
  tool.apiKey = apiKey;
  return tool;
}

module.exports = { createMyCustomTool };
```

### Real Example: Judge0 Code Execution Tool

**Location**: `api/server/services/Tools/judge0.js`

```javascript
const { z } = require('zod');
const { DynamicStructuredTool } = require('@langchain/core/tools');
const { logger } = require('@librechat/data-schemas');
const { Judge0Client } = require('./judge0-client');
const { detectLanguage, getLanguageId, getLanguageName } = require('./languages');

function createJudge0ExecutionTool(config) {
  const { user_id, apiKey, baseURL, selfHosted } = config;

  if (!apiKey) {
    throw new Error('Judge0 API key is required');
  }

  const judge0 = new Judge0Client({ apiKey, baseURL, selfHosted });

  // Define input schema
  const schema = z.object({
    code: z.string().max(65000).describe('The source code to execute (max 65KB)'),
    language: z.string().optional().describe('Programming language (e.g., python, javascript, java). Auto-detected if not provided.'),
    stdin: z.string().optional().describe('Standard input for the program'),
    timeout: z.number().min(1).max(15).optional().default(5).describe('Execution timeout in seconds (1-15, default: 5)'),
  });

  // Create tool
  const tool = new DynamicStructuredTool({
    name: 'execute_code',
    description: `Execute code in 70+ programming languages including Python, JavaScript, Java, C++, Go, Rust, and more.
Returns stdout, stderr, execution time, and memory usage. Supports stdin for input.
Use this tool when users ask to run, test, or debug code.`,
    schema,
    func: async ({ code, language, stdin, timeout }) => {
      try {
        // Auto-detect language if not provided
        let languageId = language ? getLanguageId(language) : detectLanguage(code);
        if (!languageId) languageId = 71; // Default to Python

        const detectedLanguage = getLanguageName(languageId);

        // Execute code
        const result = await judge0.execute({
          code,
          language: languageId,
          stdin: stdin || '',
          timeout: timeout || 5,
          memory: 128000,
        });

        // Format output
        return formatOutput(result, detectedLanguage);
      } catch (error) {
        logger.error('[Judge0Tool] Execution error:', error);
        return formatError(`Execution failed: ${error.message}`);
      }
    },
  });

  tool.apiKey = apiKey;
  return tool;
}

function formatOutput(result, language) {
  let output = `**Language**: ${language}\n\n`;

  if (result.stdout) {
    output += `**Output**:\n\`\`\`\n${result.stdout}\n\`\`\`\n\n`;
  }

  if (result.stderr) {
    output += `**Errors**:\n\`\`\`\n${result.stderr}\n\`\`\`\n\n`;
  }

  if (result.compile_output) {
    output += `**Compilation**:\n\`\`\`\n${result.compile_output}\n\`\`\`\n\n`;
  }

  output += `**Execution Time**: ${result.time || 0}s\n`;
  output += `**Memory Used**: ${result.memory || 0} KB\n`;
  output += `**Status**: ${result.status?.description || 'Unknown'}`;

  return output;
}

function formatError(message) {
  return `**Error**: ${message}\n\nPlease check the code and try again.`;
}

module.exports = { createJudge0ExecutionTool };
```

### Registering Custom Tools

**1. Add tool to Tool Service**:

**Location**: `api/server/services/ToolService.js`

```javascript
const { createJudge0ExecutionTool } = require('./Tools/judge0');
const { createMyCustomTool } = require('./Tools/myCustomTool');

const toolFactories = {
  execute_code: createJudge0ExecutionTool,
  my_custom_tool: createMyCustomTool,
  web_search: createWebSearchTool,
  // ... other tools
};

async function loadAgentTools({ provider, tools, apiKey }) {
  const loadedTools = [];

  for (const toolName of tools) {
    const factory = toolFactories[toolName];
    if (!factory) {
      logger.warn(`Unknown tool: ${toolName}`);
      continue;
    }

    const tool = factory({
      apiKey,
      provider,
      user_id: req.user.id
    });

    loadedTools.push(tool);
  }

  return loadedTools;
}
```

**2. Add tool to constants**:

**Location**: `packages/data-provider/src/config.ts`

```typescript
export enum Tools {
  execute_code = 'execute_code',
  web_search = 'web_search',
  file_search = 'file_search',
  my_custom_tool = 'my_custom_tool',  // Add your tool
}
```

**3. Add tool authentication** (if requires API key):

**Location**: `api/server/controllers/tools.js`

```javascript
const fieldsMap = {
  [Tools.execute_code]: ['CODE_API_KEY'],
  [Tools.my_custom_tool]: ['MY_CUSTOM_TOOL_API_KEY'],
};
```

**4. Add frontend UI** (optional):

**Location**: `client/src/components/SidePanel/Agents/Code/ApiKeyDialog.tsx`

Create a dialog for API key input similar to Code Interpreter.

---

## MCP Server Integration

### What is MCP?

**Model Context Protocol (MCP)** is a standardized protocol for connecting AI models to external tools and data sources.

### MCP Architecture

```
LibreChat Agent
    ↓
MCP Client (packages/api/src/mcp/)
    ↓ (JSON-RPC over stdio/HTTP)
MCP Server (External process/service)
    ↓
Tools: Database, API, Files, etc.
```

### Configuring MCP Servers

**Location**: `librechat.yaml`

```yaml
# MCP Configuration (Model Context Protocol)
mcp:
  postgres:
    command: 'npx'
    args:
      - '-y'
      - '@modelcontextprotocol/server-postgres'
      - 'postgresql://user:pass@localhost/db'
    env:
      DATABASE_URL: '${POSTGRES_URL}'

  filesystem:
    command: 'npx'
    args:
      - '-y'
      - '@modelcontextprotocol/server-filesystem'
      - '/allowed/path'

  github:
    command: 'npx'
    args:
      - '-y'
      - '@modelcontextprotocol/server-github'
    env:
      GITHUB_TOKEN: '${GITHUB_TOKEN}'
```

### MCP Tool Implementation

**Location**: `api/server/services/Tools/mcp.js`

```javascript
const { MCPClient } = require('@librechat/api/mcp');

async function createMCPTool(config) {
  const { mcpServerName, toolName, toolDefinition } = config;

  const tool = new DynamicStructuredTool({
    name: toolName,
    description: toolDefinition.description,
    schema: convertMCPSchemaToZod(toolDefinition.inputSchema),
    func: async (args) => {
      // Connect to MCP server
      const mcpClient = await MCPClient.connect(mcpServerName);

      // Call tool
      const result = await mcpClient.callTool(toolName, args);

      // Return result
      return formatMCPResult(result);
    }
  });

  return tool;
}
```

### Available MCP Servers

**Official MCP Servers**:
- `@modelcontextprotocol/server-postgres` - PostgreSQL database
- `@modelcontextprotocol/server-filesystem` - File system access
- `@modelcontextprotocol/server-github` - GitHub API
- `@modelcontextprotocol/server-slack` - Slack integration
- `@modelcontextprotocol/server-google-drive` - Google Drive

**Community MCP Servers**:
- AWS services
- Azure services
- MongoDB
- Redis
- Elasticsearch

### Creating Custom MCP Server

**Example: Custom REST API MCP Server**

```typescript
// mcp-server-custom-api.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'custom-api-server',
  version: '1.0.0',
});

// Register tools
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'fetch_api_data',
        description: 'Fetch data from custom API',
        inputSchema: {
          type: 'object',
          properties: {
            endpoint: {
              type: 'string',
              description: 'API endpoint path'
            },
            method: {
              type: 'string',
              enum: ['GET', 'POST'],
              default: 'GET'
            }
          },
          required: ['endpoint']
        }
      }
    ]
  };
});

// Handle tool execution
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'fetch_api_data') {
    const response = await fetch(`https://api.example.com${args.endpoint}`, {
      method: args.method || 'GET'
    });
    const data = await response.json();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2)
        }
      ]
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

**Register in librechat.yaml**:
```yaml
mcp:
  custom_api:
    command: 'node'
    args:
      - './mcp-servers/custom-api.js'
    env:
      API_KEY: '${CUSTOM_API_KEY}'
```

---

## API Reference

### Agent Endpoints

#### List Agents

```http
GET /api/agents?page=1&limit=20&category=coding
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20)
- `category` (optional): Filter by category
- `search` (optional): Search by name/description

**Response**:
```json
{
  "data": [
    {
      "id": "agent_abc123",
      "name": "Python Assistant",
      "description": "Expert Python developer",
      "provider": "openAI",
      "model": "gpt-4o",
      "category": "coding",
      "author": "user_id",
      "createdAt": "2025-11-16T10:00:00.000Z"
    }
  ],
  "page": 1,
  "totalPages": 5,
  "total": 100
}
```

#### Get Agent

```http
GET /api/agents/:id
```

**Response**:
```json
{
  "id": "agent_abc123",
  "name": "Python Assistant",
  "description": "Expert Python developer",
  "provider": "openAI",
  "model": "gpt-4o",
  "model_parameters": {
    "temperature": 0.3,
    "max_tokens": 4096
  },
  "instructions": "You are an expert Python developer...",
  "tools": ["execute_code", "web_search"],
  "recursion_limit": 50,
  "conversation_starters": ["Help me debug this code"],
  "category": "coding",
  "author": "user_id",
  "authorName": "John Doe",
  "createdAt": "2025-11-16T10:00:00.000Z",
  "updatedAt": "2025-11-16T10:00:00.000Z"
}
```

#### Create Agent

```http
POST /api/agents
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Data Analyst",
  "description": "Analyzes data and creates visualizations",
  "provider": "anthropic",
  "model": "claude-sonnet-4",
  "instructions": "You are a data analyst...",
  "tools": ["execute_code", "file_search"],
  "model_parameters": {
    "temperature": 0.5
  },
  "category": "data"
}
```

**Response**: `201 Created` with agent object

#### Update Agent

```http
PUT /api/agents/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Updated Name",
  "instructions": "Updated instructions...",
  "recursion_limit": 75
}
```

**Response**: `200 OK` with updated agent object

#### Delete Agent

```http
DELETE /api/agents/:id
Authorization: Bearer <token>
```

**Response**: `204 No Content`

#### Execute Agent

```http
POST /api/agents/:id/execute
Content-Type: application/json
Authorization: Bearer <token>

{
  "message": "Write a Python script to parse CSV files",
  "conversationId": "conv_xyz789",
  "files": ["file_id1", "file_id2"]
}
```

**Response**: Server-Sent Events (SSE) stream
```
event: message
data: {"type":"text","content":"I'll help you with that..."}

event: tool_call
data: {"tool":"execute_code","status":"running"}

event: tool_result
data: {"tool":"execute_code","output":"..."}

event: message
data: {"type":"text","content":"Here's the result..."}

event: done
data: {"conversationId":"conv_xyz789","messageId":"msg_abc123"}
```

### Tool Endpoints

#### List Available Tools

```http
GET /api/tools
```

**Response**:
```json
{
  "tools": [
    {
      "name": "execute_code",
      "displayName": "Code Interpreter",
      "description": "Execute code in 70+ languages",
      "requiresAuth": true,
      "authField": "CODE_API_KEY"
    },
    {
      "name": "web_search",
      "displayName": "Web Search",
      "description": "Search the web with Serper",
      "requiresAuth": true,
      "authField": "SERPER_API_KEY"
    }
  ]
}
```

#### Check Tool Authentication

```http
GET /api/tools/execute_code/auth
Authorization: Bearer <token>
```

**Response**:
```json
{
  "authenticated": true,
  "message": "system_defined"
}
```

or

```json
{
  "authenticated": false,
  "message": "missing_credentials"
}
```

---

## Multi-Agent Orchestration

### LangGraph Integration

LibreChat agents support **LangGraph** for complex multi-agent workflows.

**Example: Research → Summarize → Write Pipeline**

```javascript
const { StateGraph } = require('@langchain/langgraph');

// Define agent state
const agentState = {
  messages: [],
  research_results: [],
  summary: '',
  final_output: ''
};

// Create graph
const workflow = new StateGraph({
  channels: agentState
});

// Add nodes (agents)
workflow.addNode('researcher', async (state) => {
  const agent = await loadAgent('agent_researcher_id');
  const result = await agent.invoke({
    input: state.messages[state.messages.length - 1]
  });

  return {
    ...state,
    research_results: result.research_data
  };
});

workflow.addNode('summarizer', async (state) => {
  const agent = await loadAgent('agent_summarizer_id');
  const result = await agent.invoke({
    input: state.research_results
  });

  return {
    ...state,
    summary: result.summary
  };
});

workflow.addNode('writer', async (state) => {
  const agent = await loadAgent('agent_writer_id');
  const result = await agent.invoke({
    input: state.summary
  });

  return {
    ...state,
    final_output: result.article
  };
});

// Define edges
workflow.addEdge('researcher', 'summarizer');
workflow.addEdge('summarizer', 'writer');

// Set entry point
workflow.setEntryPoint('researcher');

// Compile and execute
const app = workflow.compile();
const result = await app.invoke({
  messages: [{ role: 'user', content: 'Research quantum computing' }]
});
```

### Agent Edges (Built-in)

LibreChat supports agent edges natively via the `edges` field:

```javascript
const masterAgent = await Agent.create({
  name: 'Master Research Agent',
  provider: 'openAI',
  model: 'gpt-4o',
  edges: [
    {
      from: 'agent_research_id',
      to: 'agent_summarizer_id'
    },
    {
      from: 'agent_summarizer_id',
      to: 'agent_writer_id',
      condition: 'length > 1000'  // Conditional edge
    }
  ],
  isCollaborative: true
});
```

**Execution**: When the master agent is invoked, it automatically orchestrates the sub-agents according to the edge graph.

---

## Database Operations

### Direct MongoDB Queries

```javascript
const { Agent } = require('@librechat/data-schemas');

// Find agents by category
const codingAgents = await Agent.find({ category: 'coding' })
  .sort({ updatedAt: -1 })
  .limit(20);

// Find public agents
const publicAgents = await Agent.find({ access_level: 2 });

// Find promoted agents
const featuredAgents = await Agent.find({ is_promoted: true });

// Find agents by author
const myAgents = await Agent.find({ author: userId });

// Full-text search
const searchResults = await Agent.find({
  $or: [
    { name: { $regex: 'python', $options: 'i' } },
    { description: { $regex: 'python', $options: 'i' } }
  ]
});

// Complex query
const advancedQuery = await Agent.find({
  category: 'coding',
  provider: 'openAI',
  tools: { $in: ['execute_code'] },
  'model_parameters.temperature': { $lte: 0.5 }
});
```

### Aggregation Pipelines

```javascript
// Get agent statistics by category
const stats = await Agent.aggregate([
  {
    $group: {
      _id: '$category',
      count: { $sum: 1 },
      avgRecursionLimit: { $avg: '$recursion_limit' }
    }
  },
  { $sort: { count: -1 } }
]);

// Most popular tools
const toolStats = await Agent.aggregate([
  { $unwind: '$tools' },
  {
    $group: {
      _id: '$tools',
      count: { $sum: 1 }
    }
  },
  { $sort: { count: -1 } }
]);
```

### Indexing for Performance

**Default indexes** (defined in schema):
```javascript
agentSchema.index({ updatedAt: -1, _id: 1 });  // Compound index for sorting
agentSchema.index({ category: 1 });             // Category filter
agentSchema.index({ is_promoted: 1 });          // Featured agents
agentSchema.index({ projectIds: 1 });           // Project lookup
```

**Add custom indexes**:
```javascript
// Text index for search
await Agent.collection.createIndex({
  name: 'text',
  description: 'text'
});

// Compound index for marketplace queries
await Agent.collection.createIndex({
  category: 1,
  is_promoted: -1,
  updatedAt: -1
});
```

---

## Advanced Configurations

### Custom Model Parameters

**Provider-specific parameters**:

**OpenAI**:
```javascript
model_parameters: {
  temperature: 0.7,
  max_tokens: 4096,
  top_p: 0.9,
  frequency_penalty: 0.5,
  presence_penalty: 0.5,
  response_format: { type: 'json_object' },  // JSON mode
  seed: 12345  // Reproducible outputs
}
```

**Anthropic**:
```javascript
model_parameters: {
  temperature: 0.7,
  max_tokens: 8192,
  top_p: 0.9,
  top_k: 40,
  stop_sequences: ['\n\nHuman:', '\n\nAssistant:']
}
```

**Google Gemini**:
```javascript
model_parameters: {
  temperature: 0.7,
  maxOutputTokens: 8192,
  topP: 0.9,
  topK: 40,
  safetySettings: [
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    }
  ]
}
```

### Environment Variables for Tools

**Judge0 Code Execution**:
```bash
CODE_API_KEY=your_rapidapi_judge0_key
JUDGE0_BASE_URL=https://judge0-ce.p.rapidapi.com  # Optional: self-hosted
```

**Web Search (Serper)**:
```bash
SERPER_API_KEY=your_serper_api_key
```

**Jina Reranker**:
```bash
JINA_API_KEY=your_jina_api_key
```

**RAG/File Search**:
```bash
RAG_API_URL=http://localhost:8000
RAG_OPENAI_API_KEY=your_openai_key  # For embeddings
```

### RBAC (Role-Based Access Control)

**Access Levels**:
```javascript
const AccessLevel = {
  PRIVATE: 0,   // Only creator can use
  SHARED: 1,    // Shared with specific users/groups
  PUBLIC: 2     // Available to all users
};
```

**Checking access**:
```javascript
// Middleware: api/server/middleware/accessResources/agents.js
async function checkAgentAccess(req, res, next) {
  const agent = await Agent.findOne({ id: req.params.id });

  if (!agent) {
    return res.status(404).json({ message: 'Agent not found' });
  }

  // Owner always has access
  if (agent.author.toString() === req.user.id) {
    return next();
  }

  // Check access level
  if (agent.access_level === 0) {
    return res.status(403).json({ message: 'Access denied' });
  }

  if (agent.access_level === 1) {
    // Check if user is in shared list (implement based on your needs)
    const hasAccess = await checkSharedAccess(agent, req.user.id);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }
  }

  // Public agents (access_level === 2) are accessible to all
  next();
}
```

---

## Debugging and Monitoring

### Logging

**Enable debug logging**:
```javascript
// Set in environment
DEBUG=librechat:agents,librechat:tools

// Or in code
const logger = require('@librechat/data-schemas').logger;

logger.debug('[Agent] Initializing agent', { agentId, provider, model });
logger.info('[Agent] Tool execution started', { tool: 'execute_code' });
logger.warn('[Agent] Recursion limit approaching', { current: 45, max: 50 });
logger.error('[Agent] Tool execution failed', { error: error.message });
```

### Monitoring Agent Execution

**Track token usage**:
```javascript
// In agent execution handler
const tokenUsage = {
  prompt_tokens: result.usage.prompt_tokens,
  completion_tokens: result.usage.completion_tokens,
  total_tokens: result.usage.total_tokens,
  cost: calculateCost(result.usage, model)
};

await TokenUsage.create({
  userId: req.user.id,
  agentId: agent.id,
  conversationId,
  ...tokenUsage
});
```

**Track tool calls**:
```javascript
const toolCallLog = {
  userId: req.user.id,
  agentId: agent.id,
  toolName: 'execute_code',
  timestamp: new Date(),
  executionTime: elapsed,
  success: true,
  error: null
};

await ToolCallLog.create(toolCallLog);
```

### Performance Monitoring

**Add timing metrics**:
```javascript
const { performance } = require('perf_hooks');

async function executeAgent(agentId, message) {
  const startTime = performance.now();

  try {
    const result = await agent.invoke(message);

    const endTime = performance.now();
    const duration = endTime - startTime;

    logger.info('[Agent] Execution completed', {
      agentId,
      duration: `${duration.toFixed(2)}ms`,
      toolCalls: result.toolCalls.length
    });

    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;

    logger.error('[Agent] Execution failed', {
      agentId,
      duration: `${duration.toFixed(2)}ms`,
      error: error.message
    });

    throw error;
  }
}
```

### Error Tracking

**Structured error logging**:
```javascript
try {
  await agent.invoke(message);
} catch (error) {
  logger.error('[Agent] Execution error', {
    agentId: agent.id,
    userId: req.user.id,
    conversationId,
    errorType: error.constructor.name,
    errorMessage: error.message,
    stack: error.stack,
    provider: agent.provider,
    model: agent.model,
    tools: agent.tools
  });

  // Send to error tracking service (e.g., Sentry)
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, {
      tags: {
        component: 'agent',
        agentId: agent.id,
        provider: agent.provider
      }
    });
  }

  throw error;
}
```

---

## Testing

### Unit Testing Agents

```javascript
// test/agents/agent.spec.js
const { Agent } = require('@librechat/data-schemas');
const { initializeAgent } = require('~/server/services/Endpoints/agents');

describe('Agent Initialization', () => {
  it('should load agent with tools', async () => {
    const agent = await Agent.create({
      id: 'test_agent',
      name: 'Test Agent',
      provider: 'openAI',
      model: 'gpt-4o',
      tools: ['execute_code'],
      author: userId
    });

    const initialized = await initializeAgent({
      req,
      res,
      agent,
      loadTools: mockLoadTools
    });

    expect(initialized.tools).toHaveLength(1);
    expect(initialized.tools[0].name).toBe('execute_code');
  });

  it('should validate recursion limit', () => {
    expect(() => {
      Agent.create({
        recursion_limit: 200  // Exceeds max of 100
      });
    }).toThrow();
  });
});
```

### Integration Testing

```javascript
// test/integration/agents.spec.js
const request = require('supertest');
const app = require('~/server');

describe('Agent API', () => {
  let authToken;
  let agentId;

  beforeAll(async () => {
    authToken = await getAuthToken();
  });

  it('should create agent', async () => {
    const res = await request(app)
      .post('/api/agents')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Agent',
        provider: 'openAI',
        model: 'gpt-4o',
        instructions: 'Test instructions'
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    agentId = res.body.id;
  });

  it('should execute agent', async () => {
    const res = await request(app)
      .post(`/api/agents/${agentId}/execute`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        message: 'Hello, agent!'
      });

    expect(res.status).toBe(200);
  });
});
```

---

## Migration Scripts

### Migrate Assistants to Agents

```javascript
// scripts/migrate-assistants-to-agents.js
const { Assistant, Agent } = require('@librechat/data-schemas');

async function migrateAssistantsToAgents() {
  const assistants = await Assistant.find({});

  for (const assistant of assistants) {
    const agent = await Agent.create({
      id: `agent_${assistant.id}`,
      name: assistant.name,
      description: assistant.description,
      provider: assistant.provider || 'openAI',
      model: assistant.model,
      instructions: assistant.instructions,
      tools: convertAssistantTools(assistant.tools),
      tool_resources: assistant.tool_resources,
      author: assistant.author,
      access_level: 1
    });

    console.log(`Migrated assistant ${assistant.id} to agent ${agent.id}`);
  }
}

function convertAssistantTools(assistantTools) {
  // Convert OpenAI Assistant tools to Agent tools
  return assistantTools.map(tool => {
    if (tool.type === 'code_interpreter') return 'execute_code';
    if (tool.type === 'retrieval') return 'file_search';
    if (tool.type === 'function') return tool.function.name;
    return null;
  }).filter(Boolean);
}

migrateAssistantsToAgents().then(() => {
  console.log('Migration complete');
  process.exit(0);
});
```

---

## Best Practices for Developers

### 1. Tool Development

- ✅ Use `DynamicStructuredTool` from LangChain
- ✅ Define clear Zod schemas for input validation
- ✅ Provide detailed descriptions for AI understanding
- ✅ Handle errors gracefully and return formatted messages
- ✅ Log all tool executions for debugging
- ✅ Implement rate limiting and timeouts

### 2. Agent Design

- ✅ Keep instructions concise (< 2000 characters)
- ✅ Test with multiple providers (OpenAI, Anthropic, Google)
- ✅ Set appropriate recursion limits
- ✅ Use specific tool combinations (avoid enabling all tools)
- ✅ Version your agents for reproducibility

### 3. Performance

- ✅ Cache agent configurations in Redis
- ✅ Use connection pooling for database queries
- ✅ Implement pagination for agent lists
- ✅ Optimize tool execution (parallel when possible)
- ✅ Monitor token usage and costs

### 4. Security

- ✅ Validate all user inputs (Zod schemas)
- ✅ Sanitize agent instructions (prevent injection)
- ✅ Implement RBAC for agent access
- ✅ Encrypt API keys in database
- ✅ Rate limit agent executions per user
- ✅ Audit tool calls for compliance

---

## Troubleshooting Common Issues

### Agent Not Loading

**Check**:
1. Agent exists in database: `db.agents.findOne({ id: 'agent_id' })`
2. User has access permissions
3. Provider credentials are configured
4. Model is available for provider

### Tool Not Executing

**Check**:
1. Tool is enabled in agent configuration
2. API key is set (environment or user-provided)
3. Tool service is running (Judge0, Serper, RAG API)
4. Provider supports tool calling
5. Check logs for tool execution errors

### Performance Issues

**Solutions**:
1. Enable Redis caching
2. Use faster models (gpt-4o-mini, claude-haiku)
3. Reduce recursion limit
4. Optimize database indexes
5. Implement rate limiting

---

## Reference Links

- **AI Coding Agent Guide**: [AGENTS.md](./AGENTS.md) - Development environment guide (agents.md format)
- **User Guide**: [LibreChat - Agents.md](./LibreChat%20-%20Agents.md) - End-user agent documentation
- **Main LibreChat Guide**: [CLAUDE.md](./CLAUDE.md) - Complete LibreChat development guide
- **LibreChat Docs**: https://docs.librechat.ai/
- **LangChain Documentation**: https://js.langchain.com/
- **MCP Protocol Spec**: https://modelcontextprotocol.io/
- **GitHub Repository**: https://github.com/danny-avila/LibreChat

---

*Document Version: 1.0.0 | LibreChat v0.8.1-rc1*
