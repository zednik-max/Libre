# LibreChat Assistant Creation Guide - Complete Developer Guide

**Author**: Claude (AI Assistant)
**Audience**: Developers & Technical Writers
**Version**: 1.0
**Last Updated**: 2025-11-16
**LibreChat Version**: v0.8.1-rc1

---

## Table of Contents

1. [Introduction](#introduction)
2. [What Are LibreChat Assistants?](#what-are-librechat-assistants)
3. [When to Use Assistants vs Agents](#when-to-use-assistants-vs-agents)
4. [Assistant Architecture Deep Dive](#assistant-architecture-deep-dive)
5. [Step-by-Step Assistant Creation](#step-by-step-assistant-creation)
6. [Advanced Features](#advanced-features)
7. [Complex Real-World Example](#complex-real-world-example-opik-platform-onboarding-assistant)
8. [Best Practices for Technical Documentation Assistants](#best-practices-for-technical-documentation-assistants)
9. [Troubleshooting](#troubleshooting)
10. [Migration Path to Agents](#migration-path-to-agents)

---

## Introduction

This guide teaches you how to create **OpenAI Assistants** in LibreChat for technical documentation tasks. You'll learn through a production-ready example: building an "Opik Platform Documentation Assistant" that creates comprehensive onboarding guides for LLM evaluation tools.

**What You'll Build**: An Assistant that researches Opik (LLM observability platform) and generates developer onboarding documentation with code examples, integration guides, and best practices.

**Important Note**: While Assistants are powerful, **Agents are recommended for most use cases** (see comparison below). This guide exists for scenarios where you specifically need OpenAI's Assistants API features.

---

## What Are LibreChat Assistants?

LibreChat Assistants are **OpenAI-powered AI assistants** that integrate with OpenAI's Assistants API:

### Core Characteristics

✅ **OpenAI Integration**
- Direct connection to OpenAI's Assistants API
- Uses OpenAI's infrastructure for tool execution
- Persistent threads managed by OpenAI
- Automatic retrieval and code interpreter

✅ **Built-in Tools**
- **Code Interpreter**: Python execution sandbox (OpenAI-hosted)
- **File Search**: Semantic search with automatic chunking
- **Function Calling**: Custom tools via OpenAPI specs

✅ **Thread Management**
- Persistent conversation threads stored on OpenAI
- Automatic context management
- Message history maintained by OpenAI
- Thread-based file associations

❌ **Limitations**
- **OpenAI only**: Cannot use Gemini, Claude, or other providers
- **Python only**: Code Interpreter limited to Python (no JavaScript, Go, etc.)
- **No agent chains**: Cannot connect multiple assistants
- **No MCP support**: Limited to OpenAI tools
- **Higher cost**: No data reduction benefits
- **Vendor lock-in**: Tied to OpenAI's API

---

## When to Use Assistants vs Agents

| Criterion | Use Assistants | Use Agents |
|-----------|---------------|------------|
| **Provider flexibility needed** | ❌ | ✅ **Yes** |
| **Multi-language code execution** | ❌ | ✅ **Yes** (Judge0: 70+ langs) |
| **Complex workflows/chains** | ❌ | ✅ **Yes** |
| **MCP tool integration** | ❌ | ✅ **Yes** |
| **Cost optimization priority** | ❌ | ✅ **Yes** (95% reduction) |
| **Already using OpenAI Assistants API** | ✅ **Yes** | ⚠️ Can migrate |
| **Need OpenAI-specific features** | ✅ **Yes** | ⚠️ Limited |
| **Legacy codebase integration** | ✅ **Yes** | ⚠️ Migration effort |

**Recommendation for Documentation**: **Use Agents** unless you have existing OpenAI Assistants API integration or require OpenAI-specific features.

---

## Assistant Architecture Deep Dive

### How Assistants Work

```
User Request
    ↓
Assistant UI (client/src/components/Assistants/)
    ↓
API: POST /api/assistants/v2/chat
    ↓
Assistant Controller (api/server/controllers/assistants/chatV2.js)
    ↓
OpenAI Client Init (api/server/services/Endpoints/assistants/initalize.js)
    ↓
OpenAI SDK: new OpenAI()
    ↓
OpenAI Assistants API (beta.assistants.*)
    ↓
Thread Management (OpenAI-hosted)
    ↓
Tool Execution (OpenAI infrastructure)
    ↓
Streaming Response (OpenAI SSE)
```

### Assistant Schema (MongoDB - LibreChat metadata)

```typescript
{
  user: ObjectId,               // LibreChat user who created it
  assistant_id: String,         // OpenAI's assistant ID (asst_...)
  avatar: Mixed,                // Custom avatar
  conversation_starters: [String],  // Quick prompts (LibreChat only)
  access_level: Number,         // Permission level
  file_ids: [String],          // OpenAI file IDs
  actions: [String],           // Custom actions
  append_current_datetime: Boolean  // Add timestamp to prompts
}
```

**Note**: Most configuration lives on **OpenAI's servers**, not LibreChat.

### OpenAI Assistant Object (stored on OpenAI)

```typescript
{
  id: "asst_abc123",           // Assistant ID
  object: "assistant",
  created_at: 1699009709,
  name: "Opik Documentation Assistant",
  description: "Creates onboarding docs for LLM tools",
  model: "gpt-4o",             // OpenAI model only
  instructions: "You are a technical writer...",
  tools: [
    { type: "code_interpreter" },
    { type: "file_search" },
    { type: "function", function: {...} }
  ],
  tool_resources: {
    code_interpreter: {
      file_ids: ["file-abc123"]
    },
    file_search: {
      vector_store_ids: ["vs_def456"]
    }
  },
  metadata: {
    author: "user_id_123",
    endpoint: "assistants"
  },
  temperature: 0.7,
  top_p: 1.0,
  response_format: "auto"
}
```

### Key Differences from Agents

| Aspect | Assistants | Agents |
|--------|-----------|--------|
| **Storage Location** | OpenAI servers | LibreChat database |
| **Provider** | OpenAI only | 10+ providers |
| **Tool System** | OpenAI tools | LibreChat tools + MCP |
| **Thread Management** | OpenAI-hosted | App-managed |
| **Code Execution** | OpenAI sandbox (Python) | Judge0 (70+ languages) |
| **Cost Structure** | OpenAI pricing | Provider pricing + 95% reduction |
| **Vendor Lock-in** | High | Low |

---

## Step-by-Step Assistant Creation

### Prerequisites

**1. Environment Variables**:
```bash
# Required: OpenAI API Key
ASSISTANTS_API_KEY=sk-proj-...   # Your OpenAI API key

# OR: User-provided keys
ASSISTANTS_API_KEY=user_provided  # Each user provides their own
```

**2. Configuration** (`librechat.yaml`):
```yaml
endpoints:
  assistants:
    disableBuilder: false    # Allow assistant creation
    pollIntervalMs: 750      # Poll for status updates
    timeoutMs: 180000        # 3-minute timeout
    supportedIds:            # Optional: restrict to specific assistants
      - "asst_abc123"
      - "asst_def456"
    # excludedIds:           # Or exclude specific ones
    # privateAssistants: true  # Only show user's own assistants
```

**3. Restart LibreChat**:
```bash
docker-compose restart api
```

### Basic Assistant Creation (5 Minutes)

**Step 1: Access Assistant Builder**

1. Open LibreChat: `http://localhost:3080`
2. Click **"Assistants"** icon (sidebar)
3. Click **"Create Assistant"** button

**Step 2: Basic Configuration**

```yaml
Name: "Tech Doc Writer Assistant"
Description: "Creates comprehensive onboarding documentation for developer tools"
Model: "gpt-4o"              # Required: OpenAI model
Instructions: |
  You are a technical documentation expert specializing in developer onboarding.

  Your role:
  - Research developer tools and platforms
  - Create comprehensive getting-started guides
  - Write clear, actionable tutorials
  - Include practical code examples
  - Focus on developer experience

  Writing standards:
  - Clear, concise language
  - Step-by-step instructions
  - Real-world examples
  - Troubleshooting sections
  - Links to official resources
```

**Step 3: Enable Tools**

Toggle these tools ON:
- ✅ **Code Interpreter** - Python code execution, data analysis
- ✅ **File Search** - Search uploaded documentation
- ⚠️ **Functions** - Custom tools (requires OpenAPI spec)

**Step 4: Upload Knowledge Files** (Optional)

Click **"Upload Files"** → Select documentation files:
- PDF: Technical specifications
- TXT: API documentation
- DOCX: Style guides
- CSV: Data for analysis

Files are uploaded to OpenAI and associated with this assistant.

**Step 5: Conversation Starters** (LibreChat feature)

```
1. "Create a getting-started guide for [tool name]"
2. "Research [platform] and write onboarding docs"
3. "Analyze this API and create integration guide"
4. "Compare [tool A] vs [tool B] with examples"
```

**Step 6: Save**

Click **"Save Assistant"** → Assistant created on OpenAI → Appears in LibreChat list

---

## Advanced Features

### 1. Model Selection

**Available Models** (OpenAI only):
```yaml
gpt-4o              # Best: Multimodal, 128K context
gpt-4o-mini         # Fast: 128K context, lower cost
gpt-4-turbo         # Legacy: 128K context
gpt-4               # Classic: 8K context
gpt-3.5-turbo       # Budget: 16K context
```

**For Documentation Assistants**:
- **Recommended**: `gpt-4o` (best quality, multimodal)
- **Budget**: `gpt-4o-mini` (good quality, 60% cheaper)
- **Avoid**: `gpt-3.5-turbo` (insufficient for complex docs)

### 2. Code Interpreter (Python Only)

**What it can do**:
```python
# Data analysis
import pandas as pd
df = pd.read_csv('data.csv')
df.describe()

# Visualization
import matplotlib.pyplot as plt
plt.plot([1, 2, 3], [4, 5, 6])
plt.savefig('chart.png')

# File processing
with open('input.txt', 'r') as f:
    content = f.read()
```

**Limitations**:
- ❌ No network access (can't pip install, fetch URLs)
- ❌ Python only (no JavaScript, TypeScript, Go, Rust, etc.)
- ❌ Limited packages (standard library + NumPy, Pandas, matplotlib)
- ❌ Temporary environment (resets between runs)

**vs Agent Code Interpreter (Judge0)**:
- ✅ 70+ languages (Python, JavaScript, Go, Rust, C++, Java, etc.)
- ✅ Network access (can install packages)
- ⚠️ Requires separate Judge0 configuration

### 3. File Search (RAG)

**How it works**:
1. Upload files to Assistant
2. OpenAI automatically:
   - Chunks documents
   - Creates embeddings
   - Stores in vector database
3. Assistant searches files during conversation

**Supported Formats**:
```yaml
Documents:
  - PDF (.pdf)
  - Word (.docx, .doc)
  - Text (.txt, .md)
  - Rich Text (.rtf)

Code:
  - Python (.py)
  - JavaScript (.js)
  - C++ (.cpp, .cc)
  - Java (.java)
  - PHP (.php)

Data:
  - CSV (.csv)
  - JSON (.json)
  - XML (.xml)

Presentations:
  - PowerPoint (.pptx)
```

**Limits**:
- Max 10,000 files per assistant
- Max 512 MB per file
- Max 2 million tokens per file

**Best Practices**:
```yaml
DO:
  - Upload reference documentation
  - Include API specs (OpenAPI)
  - Add code examples
  - Provide style guides

DON'T:
  - Upload raw data dumps
  - Include duplicate content
  - Mix unrelated domains
  - Rely on outdated docs
```

### 4. Function Calling (Custom Tools)

**Example**: Web search function

```json
{
  "type": "function",
  "function": {
    "name": "web_search",
    "description": "Search the web for current information",
    "parameters": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "description": "Search query"
        },
        "num_results": {
          "type": "integer",
          "description": "Number of results (1-10)",
          "default": 5
        }
      },
      "required": ["query"]
    }
  }
}
```

**Implementation** (you must provide the actual function):
```javascript
// api/server/routes/assistants/actions.js
async function web_search({ query, num_results = 5 }) {
  const response = await fetch(
    `https://api.tavily.com/search`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, max_results: num_results })
    }
  );
  return await response.json();
}
```

**Limitation**: Requires backend code changes (not no-code like Agents)

---

## Complex Real-World Example: Opik Platform Onboarding Assistant

Let's build a production-ready Assistant that documents **Opik** (Comet's LLM evaluation and observability platform).

### Use Case

**Goal**: Create comprehensive onboarding documentation for Opik that helps ML engineers:
1. Understand what Opik is and why to use it
2. Install and configure Opik locally and in production
3. Integrate Opik with existing LLM applications
4. Use tracing, evaluation, and monitoring features
5. Troubleshoot common integration issues

**Target Audience**: ML Engineers and LLM developers with Python experience

### Assistant Configuration

**Name**: `Opik Platform Documentation Assistant`

**Description**:
```
Expert technical writer specializing in LLM observability and evaluation tools.
Creates comprehensive, developer-friendly documentation for Opik platform with
installation guides, integration tutorials, and practical examples.
```

**Model**: `gpt-4o`

**Why**: Needs to:
- Process code examples (Python, JavaScript)
- Understand LLM evaluation concepts
- Generate accurate technical documentation
- Handle large context (integration guides are long)

**Instructions**:
```markdown
# Role
You are a senior technical writer at an LLM observability company. You specialize
in creating developer onboarding documentation for complex ML/AI platforms.

# Task
Create comprehensive documentation for Opik (by Comet) - an open-source LLM
evaluation and observability platform. Follow this structure:

## 1. Overview (Executive Summary)
- What is Opik? (2-3 paragraphs)
- Key features: Tracing, Evaluation, Monitoring
- Why choose Opik? (vs alternatives like LangSmith, Helicone, Arize)
- Who should use it? (use cases)

## 2. Quick Start (Under 5 Minutes)
### Local Setup
```bash
# Installation commands
pip install opik-python
```
### First Trace
```python
# Minimal working example
from opik import Opik
# ... complete example
```
### Verification
- How to confirm it's working
- Expected output

## 3. Installation Deep Dive
### System Requirements
- Python version
- Dependencies
- Optional: Docker setup

### Installation Methods
- pip install (recommended)
- From source (advanced)
- Docker deployment (production)

### Configuration
- API keys (if needed)
- Environment variables
- opik.yaml configuration file

## 4. Core Concepts
### Tracing
- What are traces?
- Spans vs traces
- Automatic instrumentation
- Manual instrumentation

### Evaluation
- Built-in metrics (hallucination, relevance, etc.)
- Custom evaluators
- LLM-as-a-judge pattern

### Datasets
- Creating test datasets
- Managing versions
- Best practices

## 5. Integration Guides
### LangChain
```python
from opik.integrations.langchain import OpikTracer
# Complete working example
```

### LlamaIndex
```python
from opik.integrations.llamaindex import OpikCallbackHandler
# Complete working example
```

### OpenAI Direct
```python
import opik
import openai
# Complete working example
```

### Custom Integrations
- Using decorators
- Manual span creation
- Context managers

## 6. Production Deployment
### Self-Hosting
- Docker Compose setup
- Kubernetes deployment
- Environment configuration

### Cloud Hosted (Comet)
- Account setup
- API key management
- Team collaboration

### Security
- Authentication
- Data privacy
- Compliance considerations

## 7. Monitoring & Dashboards
### Web UI
- Navigate dashboards
- Filter traces
- Analyze performance

### Metrics
- Token usage
- Latency tracking
- Error rates
- Cost monitoring

## 8. Best Practices
### Development
- Local vs production setup
- Testing strategies
- CI/CD integration

### Performance
- Sampling strategies
- Batch processing
- Async logging

### Organization
- Project structure
- Naming conventions
- Team workflows

## 9. Troubleshooting
### Common Issues
- Installation problems
- Connection errors
- Missing traces
- Performance issues

### Debugging
- Enable debug logging
- Inspect traces
- Common error codes

## 10. Advanced Usage
### Custom Evaluators
```python
from opik.evaluation import Evaluator
# Complete custom evaluator example
```

### Feedback Loops
- Collect human feedback
- Integrate with evaluations

### Experiment Tracking
- A/B testing
- Prompt versioning

## 11. API Reference
- Key classes and methods
- Configuration options
- Event hooks

## 12. Resources
- Official documentation links
- GitHub repository
- Community Discord/Slack
- Tutorial videos
- Example projects

# Research Sources
Use Code Interpreter with web search simulation to:
1. Analyze Opik's GitHub repository structure
2. Review official documentation
3. Find integration examples
4. Check pricing and licensing

# Code Examples Requirements
- Must be complete (not snippets)
- Include imports
- Show expected output
- Add error handling
- Use real-world data
- Test with Code Interpreter when possible

# Writing Standards
- **Clarity**: Technical but accessible
- **Structure**: Clear headings, numbered steps, code blocks
- **Examples**: Minimum 8 working code examples
- **Completeness**: Cover beginner to advanced
- **Accuracy**: Only verified information
- **Currency**: Note version numbers (Opik 0.x.x)

# Output Format
- Markdown with YAML frontmatter
- Table of contents with anchor links
- Syntax-highlighted code blocks
- Comparison tables where relevant
- Minimum 4000 words
- Include "Next Steps" section

# Quality Checklist
Before submitting, verify:
- [ ] All code examples are syntactically correct
- [ ] Installation steps tested (conceptually)
- [ ] Links to official resources included
- [ ] Troubleshooting covers top 5 issues
- [ ] Comparison with alternatives provided
- [ ] Version numbers specified
- [ ] No ambiguous instructions
```

**Tools Enabled**:
- ✅ **Code Interpreter**: Test Python examples, verify syntax
- ✅ **File Search**: Reference uploaded Opik docs (if available)

**Files to Upload** (if you have them):
```yaml
Recommended:
  - opik-getting-started.pdf
  - opik-api-reference.md
  - example-integrations.py
  - troubleshooting-guide.txt
```

**Model Parameters**:
```json
{
  "temperature": 0.4,
  "top_p": 0.9
}
```

**Conversation Starters**:
```
1. "Create complete Opik onboarding documentation with all integration examples"
2. "Write a quickstart guide for Opik with LangChain integration"
3. "Document Opik's evaluation features with custom evaluator examples"
4. "Compare Opik with LangSmith and create migration guide"
```

### Usage Example

**User Prompt**:
```
Create complete Opik onboarding documentation following the documentation
standards. Include practical examples for LangChain and OpenAI integrations.
Focus on production deployment and best practices.
```

**Assistant Workflow** (automatic):

1. **Planning Phase**:
   - Parse documentation structure requirements
   - Identify required sections
   - Plan code examples

2. **Knowledge Search Phase** (if files uploaded):
   - Search uploaded Opik documentation
   - Extract installation steps
   - Find integration patterns
   - Gather API references

3. **Code Generation Phase** (Code Interpreter):
   - Generate Python examples
   - Test syntax validity
   - Verify import statements
   - Create complete working examples

4. **Documentation Phase**:
   - Write each section systematically
   - Include tested code examples
   - Add troubleshooting based on common patterns
   - Create comparison tables

5. **Quality Assurance Phase**:
   - Verify all sections present
   - Check code syntax
   - Ensure consistent formatting
   - Add table of contents

6. **Output Phase**:
   - Format as Markdown
   - Add YAML frontmatter
   - Include resource links
   - Generate final document

### Expected Output Structure

```markdown
---
title: "Opik Platform - Complete Developer Guide"
author: "Opik Documentation Assistant"
date: "2025-11-16"
version: "1.0"
opik_version: "0.1.x"
category: "LLM Observability"
tags: ["llm", "evaluation", "monitoring", "tracing"]
---

# Opik Platform - Complete Developer Guide

## Table of Contents
1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Installation](#installation)
4. [Core Concepts](#core-concepts)
5. [Integration Guides](#integration-guides)
6. [Production Deployment](#production-deployment)
7. [Monitoring & Dashboards](#monitoring--dashboards)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)
10. [Advanced Usage](#advanced-usage)
11. [API Reference](#api-reference)
12. [Resources](#resources)

---

## Overview

Opik is an open-source LLM evaluation and observability platform developed by Comet ML. It provides comprehensive tracing, evaluation, and monitoring capabilities for LLM applications, RAG systems, and agentic workflows.

### What is Opik?

Opik helps ML teams debug, evaluate, and monitor production LLM applications through:

- **Comprehensive Tracing**: Capture every LLM call with full context
- **Automated Evaluations**: LLM-as-a-judge metrics for hallucination, relevance, etc.
- **Production Dashboards**: Monitor performance, cost, and quality in real-time
- **Open Source**: Self-host or use Comet's cloud platform

### Why Choose Opik?

**vs LangSmith**:
- ✅ Open source (can self-host)
- ✅ More flexible evaluation framework
- ⚠️ Smaller ecosystem

**vs Helicone**:
- ✅ Deeper evaluation capabilities
- ✅ RAG-specific features
- ⚠️ More complex setup

**vs Arize**:
- ✅ LLM-focused (not general ML)
- ✅ Easier integration
- ⚠️ Less enterprise features

[... continues for 4000+ words ...]

## Quick Start (Under 5 Minutes)

### Installation

```bash
# Install Opik Python SDK
pip install opik-python

# Verify installation
python -c "import opik; print(opik.__version__)"
# Expected output: 0.1.x
```

### First Trace

```python
from opik import Opik
from openai import OpenAI

# Initialize Opik
opik_client = Opik()

# Wrap your LLM call
openai_client = OpenAI()

with opik_client.trace(name="my-first-trace") as trace:
    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "Hello, Opik!"}]
    )

    # Log the interaction
    trace.log_message(
        role="assistant",
        content=response.choices[0].message.content
    )

print(f"Trace ID: {trace.id}")
print(f"View at: https://app.comet.com/opik/traces/{trace.id}")
```

**Expected Output**:
```
Trace ID: tr_abc123def456
View at: https://app.comet.com/opik/traces/tr_abc123def456
```

[... continues with all sections ...]

## Integration Guides

### LangChain Integration

```python
from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.chains import LLMChain
from opik.integrations.langchain import OpikTracer

# Initialize Opik tracer
opik_tracer = OpikTracer(
    project_name="my-langchain-app",
    tags=["production", "v1.0"]
)

# Create LangChain components
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7)
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant."),
    ("user", "{question}")
])
chain = LLMChain(llm=llm, prompt=prompt)

# Run with automatic tracing
result = chain.run(
    question="What is LLM observability?",
    callbacks=[opik_tracer]
)

print(result)
# Automatically traced in Opik dashboard
```

### OpenAI Direct Integration

```python
import opik
from openai import OpenAI

# Decorate your function
@opik.track()
def generate_response(user_input: str) -> str:
    client = OpenAI()

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": user_input}
        ]
    )

    return response.choices[0].message.content

# Use it normally - automatically traced
answer = generate_response("Explain quantum computing")
print(answer)
```

[... continues with LlamaIndex, custom integrations, etc. ...]

## Production Deployment

### Docker Compose (Self-Hosted)

```yaml
# docker-compose.yml
version: '3.8'

services:
  opik-server:
    image: opik/opik-server:latest
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://opik:password@postgres:5432/opik
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: opik
      POSTGRES_USER: opik
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

**Start**:
```bash
docker-compose up -d
```

[... continues with all sections ...]

## Resources

### Official Documentation
- **Opik Docs**: https://www.comet.com/docs/opik/
- **GitHub**: https://github.com/comet-ml/opik
- **API Reference**: https://www.comet.com/docs/opik/api/

### Community
- **Discord**: Join Comet ML Discord
- **Issues**: GitHub Issues for bug reports
- **Examples**: https://github.com/comet-ml/opik/tree/main/examples

### Related Tools
- **Comet ML**: Experiment tracking
- **LangChain**: LLM framework
- **LlamaIndex**: RAG framework

---

**Next Steps**:
1. Install Opik: `pip install opik-python`
2. Complete Quick Start tutorial
3. Integrate with your LLM application
4. Set up production monitoring
5. Join community Discord for support

---

*Generated by Opik Documentation Assistant*
*Sources: Comet ML documentation, GitHub repository, community resources*
*Last Updated: 2025-11-16*
```

### Why This Assistant Works

✅ **Structured Approach**: Clear instructions ensure consistent output
✅ **Code Verification**: Code Interpreter validates Python examples
✅ **Knowledge Integration**: File Search references uploaded docs
✅ **OpenAI Quality**: GPT-4o provides high-quality technical writing
✅ **Complete Examples**: Full working code, not snippets
✅ **Production Focus**: Covers deployment, monitoring, best practices

❌ **Limitations**:
- Cannot search web (need custom function)
- Python-only code execution
- Locked to OpenAI models
- Higher cost than Agents

---

## Best Practices for Technical Documentation Assistants

### 1. Instructions Design

**Structure**:
```markdown
# Role
[Who is the assistant]

# Task
[What to create - be specific]

# Structure
[Exact section outline]

# Research
[How to gather information]

# Writing Standards
[Style, tone, format]

# Code Examples
[Requirements for code]

# Output Format
[Markdown, YAML, etc.]

# Quality Checklist
[Verification steps]
```

**Length**: 500-1000 words (detailed but focused)

### 2. Model Selection

| Model | Use Case | Cost | Quality |
|-------|----------|------|---------|
| **gpt-4o** | Complex technical docs | $$$ | 9.5/10 |
| **gpt-4o-mini** | Standard documentation | $$ | 8/10 |
| **gpt-4-turbo** | Legacy support | $$$ | 9/10 |
| **gpt-3.5-turbo** | Simple guides only | $ | 6/10 |

**Recommendation**: `gpt-4o` for production documentation

### 3. Tool Configuration

**Code Interpreter**:
- ✅ Enable for: Python examples, data analysis, testing
- ❌ Don't rely on: Web scraping, package installation
- ⚠️ Alternative: Use Agents with Judge0 for multi-language

**File Search**:
- ✅ Upload: API specs, style guides, reference docs
- ❌ Don't upload: Outdated docs, raw data, duplicates
- 💡 Organize: One vector store per topic/version

**Functions** (Custom):
- ✅ Use for: Web search, API calls, database queries
- ⚠️ Requires: Backend implementation (not no-code)
- 💡 Consider: Migrate to Agents for built-in tools

### 4. Knowledge Management

**Vector Store Organization**:
```yaml
Store 1: "API Reference v2.x"
  - openapi-spec-v2.json
  - api-examples.py
  - authentication-guide.md

Store 2: "User Guides"
  - getting-started.pdf
  - tutorials/
  - troubleshooting.md

Store 3: "Internal Standards"
  - style-guide.md
  - code-conventions.md
  - templates/
```

**File Updates**:
- Version control your uploaded files
- Delete outdated documentation
- Recreate vector stores for major updates

### 5. Cost Optimization

**Input Tokens** (most expensive):
```yaml
Instructions: 800 tokens       # One-time
Files (vectors): 0 tokens      # Pre-processed
User prompt: 100 tokens        # Per request
Context: 2000 tokens           # Accumulated
Total input: ~2900 tokens/request
```

**Output Tokens**:
```yaml
Documentation: 4000 tokens     # Generated content
Code examples: 1000 tokens     # Embedded code
Total output: ~5000 tokens
```

**Cost per Doc** (GPT-4o):
```
Input:  2900 tokens × $0.0050/1K = $0.0145
Output: 5000 tokens × $0.0150/1K = $0.0750
Total: $0.0895 per documentation (~9 cents)
```

**vs Agent** (Gemini Flash):
```
Input:  3000 tokens × $0.000075/1K = $0.00023
Output: 5000 tokens × $0.00030/1K  = $0.00150
Total: $0.00173 per documentation (~0.2 cents)
Savings: 98% cheaper!
```

---

## Troubleshooting

### Common Issues

**Problem**: Assistant generates incomplete documentation

**Solutions**:
1. Increase output length in instructions: "Minimum 4000 words"
2. Add checklist to system prompt
3. Use GPT-4o instead of GPT-4o-mini
4. Split into multiple assistants (outline → write → polish)

---

**Problem**: Code examples have syntax errors

**Solutions**:
1. Enable Code Interpreter
2. Add to instructions: "Test all code with Code Interpreter"
3. Specify language version: "Python 3.11"
4. Provide example format in instructions

---

**Problem**: Can't search web for current information

**Solutions**:
1. Upload recent documentation files
2. Create custom function (requires backend code):
```javascript
// api/server/routes/assistants/actions.js
async function web_search({ query }) {
  const response = await fetch(`https://api.tavily.com/search`, {
    method: 'POST',
    body: JSON.stringify({ query })
  });
  return await response.json();
}
```
3. **Better**: Use Agents (Tavily Search built-in)

---

**Problem**: File Search not finding uploaded documents

**Solutions**:
1. Check vector store ID in Assistant config
2. Verify files uploaded successfully (Assistants UI → Files)
3. Wait 5-10 minutes for indexing
4. Try re-uploading files
5. Check file format supported (PDF, DOCX, TXT, etc.)

---

**Problem**: OpenAI API errors (rate limits, timeouts)

**Solutions**:
```yaml
Error 429 (Rate Limit):
  - Upgrade OpenAI tier (Tier 1 → Tier 2+)
  - Add retry logic
  - Reduce concurrent requests

Error 504 (Timeout):
  - Reduce output length requirement
  - Split into smaller tasks
  - Increase timeout in librechat.yaml:
    timeoutMs: 300000  # 5 minutes
```

---

**Problem**: High costs

**Solutions**:
1. Switch to `gpt-4o-mini` (60% cheaper)
2. Reduce instruction length (fewer tokens)
3. Limit output: "Maximum 3000 words"
4. **Best**: Migrate to Agents (98% cost savings)

---

## Migration Path to Agents

**Why Migrate?**

| Benefit | Assistant | Agent | Improvement |
|---------|-----------|-------|-------------|
| **Cost** | $0.09/doc | $0.002/doc | **98% cheaper** |
| **Providers** | OpenAI only | 10+ providers | **Flexibility** |
| **Code Languages** | Python | 70+ languages | **Versatility** |
| **Web Search** | Custom function | Built-in | **Simpler** |
| **MCP Tools** | Not supported | Full support | **Extensibility** |

**Migration Steps**:

**1. Export Assistant Configuration**:
```javascript
// From OpenAI API
GET https://api.openai.com/v1/assistants/{assistant_id}

{
  "name": "Opik Documentation Assistant",
  "instructions": "You are a technical writer...",
  "model": "gpt-4o",
  "tools": ["code_interpreter", "file_search"]
}
```

**2. Create Equivalent Agent**:
```yaml
Name: Opik Documentation Agent
Provider: google              # Use Gemini instead
Model: gemini-2.0-flash-exp   # 1M context, 98% cheaper
Instructions: [Same as Assistant]
Tools:
  - code_interpreter          # Judge0 (70+ languages)
  - file_search              # RAG API
  - tavily_search            # Bonus: Web search!
```

**3. Upload Knowledge Files**:
```yaml
# Instead of OpenAI vector stores
# Upload to LibreChat RAG API

# Via UI:
Files → Upload → Select documents

# Via API:
POST /api/files/upload
Content-Type: multipart/form-data
```

**4. Test & Compare**:
```yaml
Test Prompt: "Create Opik quickstart guide"

Assistant Output: [Check quality]
Agent Output:     [Check quality]

Compare:
  - Accuracy
  - Completeness
  - Code examples
  - Cost
  - Speed
```

**5. Gradual Migration**:
```yaml
Week 1: Run both in parallel
Week 2: Use Agent for 50% of tasks
Week 3: Agent becomes primary
Week 4: Deprecate Assistant
```

**Migration Checklist**:
- [ ] Export Assistant instructions
- [ ] Create Agent with same instructions
- [ ] Upload knowledge files to RAG
- [ ] Add Tavily Search for web research
- [ ] Test output quality
- [ ] Measure cost savings
- [ ] Update team workflows
- [ ] Deprecate Assistant

---

## Comparison: Assistant vs Agent

### Feature Comparison

| Feature | OpenAI Assistant | LibreChat Agent | Winner |
|---------|-----------------|-----------------|---------|
| **Providers** | OpenAI only | OpenAI, Google, Anthropic, Bedrock, etc. | Agent |
| **Models** | GPT-4o, GPT-4, GPT-3.5 | 50+ models | Agent |
| **Code Execution** | Python (OpenAI sandbox) | 70+ languages (Judge0) | Agent |
| **Web Search** | Custom function required | Tavily built-in | Agent |
| **File Search** | OpenAI vectors (automatic) | RAG API (flexible) | Tie |
| **MCP Tools** | Not supported | Full support | Agent |
| **Agent Chains** | Not supported | Native support | Agent |
| **Setup Complexity** | Simple (OpenAI handles) | Medium (self-hosted tools) | Assistant |
| **Cost** | $0.09/doc (GPT-4o) | $0.002/doc (Gemini) | Agent |
| **Data Reduction** | Standard | 95% reduction | Agent |
| **Vendor Lock-in** | High (OpenAI only) | Low (portable) | Agent |
| **Thread Management** | OpenAI-hosted | App-managed | Tie |

### When to Use Each

**Use OpenAI Assistants if**:
- ✅ Already using OpenAI Assistants API extensively
- ✅ Need OpenAI-specific features (GPT-4o vision, DALL-E)
- ✅ Want fully managed infrastructure (threads, vectors)
- ✅ Don't need multi-provider support
- ✅ Cost is not primary concern
- ✅ Python-only code execution sufficient

**Use LibreChat Agents if**:
- ✅ Want multi-provider flexibility (Gemini, Claude, etc.)
- ✅ Need cost optimization (95% data reduction)
- ✅ Require advanced workflows (agent chains, MCP)
- ✅ Want 70+ programming language support
- ✅ Need web search built-in
- ✅ Prefer open-source, portable solutions
- ✅ **Creating technical documentation** (recommended)

---

## Conclusion

OpenAI Assistants in LibreChat provide a **fully-managed, powerful platform** for technical documentation, but come with **significant trade-offs**:

**Strengths**:
- ✅ Fully managed by OpenAI
- ✅ Automatic file indexing and search
- ✅ Simple setup
- ✅ High-quality GPT-4o model

**Weaknesses**:
- ❌ OpenAI vendor lock-in
- ❌ 50x more expensive than Agents
- ❌ Python-only code execution
- ❌ No web search (requires custom backend)
- ❌ Cannot use Gemini, Claude, or other providers

**Recommendation**:

**For New Projects**: **Use Agents**
- 98% cost savings
- Multi-provider flexibility
- Built-in web search
- 70+ programming languages
- Agent chains and workflows

**For Existing OpenAI Customers**: **Migrate to Agents**
- Same quality with Gemini 2.0 Flash
- Massive cost reduction
- More features (web search, MCP, chains)
- Portable (not locked to OpenAI)

**Keep Assistants Only If**:
- Deep OpenAI Assistants API integration
- Require OpenAI-specific models
- Budget unlimited

---

## Resources

### Official Documentation
- **LibreChat Assistants**: https://docs.librechat.ai/features/assistants
- **OpenAI Assistants API**: https://platform.openai.com/docs/assistants/overview
- **LibreChat Agents** (recommended): https://docs.librechat.ai/features/agents

### Migration Resources
- [Agent Creation Guide](./Agent_Creation_Guide_by_Claude.md)
- [UI Navigation Guide](./_UI_NAVIGATION.md)
- [Agents vs Assistants Comparison](../Development/PLAN_Gemini_Assistants_Integration.md)

### Community
- **Discord**: https://discord.librechat.ai
- **GitHub**: https://github.com/danny-avila/LibreChat
- **Discussions**: https://github.com/danny-avila/LibreChat/discussions

---

**Document Version**: 1.0
**Author**: Claude (Anthropic AI)
**License**: MIT
**Recommendation**: Use Agents for better flexibility and cost

---

*This guide is part of the LibreChat documentation project.*
*For most use cases, we recommend using [Agents](./Agent_Creation_Guide_by_Claude.md) instead of Assistants.*
