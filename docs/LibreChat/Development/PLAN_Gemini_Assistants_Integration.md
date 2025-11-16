# Plan: Analyze Adding Gemini as Assistants Provider

**Goal**: Understand what's needed to add Google Gemini models as a provider for LibreChat's Assistants endpoint (currently OpenAI-only).

**Status**: Planning Phase
**Complexity**: High
**Estimated Effort**: 2-3 weeks development + testing

---

## Current State Analysis

### What We Know

**Current Implementation**:
- `ASSISTANTS_API_KEY` → OpenAI Assistants API only
- Hardcoded to OpenAI's proprietary API
- Uses OpenAI SDK (`new OpenAI()`)
- OpenAI-specific endpoints and response formats

**Alternative Path**:
- LibreChat Agents already support Gemini
- Agents use different architecture
- Agents are provider-agnostic

**Key Question**: Should we:
1. **Adapt Assistants** to support Gemini (complex, breaking changes)
2. **Migrate to unified system** (Agents become the single framework)
3. **Parallel implementation** (separate Gemini Assistants endpoint)

---

## Phase 1: Deep Dive into Current Assistants Implementation

### 1.1 Map Assistants Architecture

**Objective**: Understand the complete flow of OpenAI Assistants in LibreChat

**Files to Analyze**:
```
Priority 1 (Core):
├── api/server/routes/assistants.js                    # Routes
├── api/server/controllers/assistants/                 # Controllers
│   ├── create.js
│   ├── update.js
│   ├── v1.js
│   └── v2.js
├── api/server/services/Endpoints/assistants/         # Services
│   ├── initalize.js                                   # Client initialization ⚠️ KEY
│   ├── initialize.spec.js
│   └── index.js
├── api/app/clients/                                   # Client implementations
│   └── OpenAIClient.js                               # May handle Assistants

Priority 2 (Supporting):
├── packages/data-schemas/src/models/assistant.ts     # Database schema
├── packages/data-schemas/src/schema/assistant.ts
├── client/src/components/Assistants/                 # Frontend
└── client/src/hooks/Assistants/                      # Frontend hooks
```

**Analysis Tasks**:

1. **Trace Request Flow**:
   ```
   User request → Route → Controller → Service → OpenAI API → Response
   ```
   - Document each step
   - Identify OpenAI-specific code
   - Find hardcoded assumptions

2. **Identify OpenAI API Dependencies**:
   - Which OpenAI SDK methods are used?
   - What OpenAI-specific endpoints are called?
   - What response formats are expected?

3. **Tool/Function Calling**:
   - How are tools registered?
   - How does OpenAI function calling work?
   - Can it be abstracted?

4. **File Handling**:
   - How are files uploaded to OpenAI?
   - How does retrieval/file_search work?
   - Can we replace with RAG API?

**Deliverable**: Architecture diagram + dependency list

---

### 1.2 Analyze OpenAI Assistants API Contract

**Objective**: Document OpenAI's API structure to compare with Gemini

**Key Areas**:

1. **Assistant Creation**:
   ```javascript
   // OpenAI format
   POST /v1/assistants
   {
     "model": "gpt-4o",
     "instructions": "...",
     "tools": [{"type": "code_interpreter"}],
     "file_ids": [...]
   }
   ```
   - What fields are required?
   - What's optional?
   - What's OpenAI-specific?

2. **Thread Management**:
   ```javascript
   POST /v1/threads
   POST /v1/threads/{thread_id}/messages
   POST /v1/threads/{thread_id}/runs
   ```
   - How are conversations structured?
   - What's the state management?
   - Can this map to Gemini's chat API?

3. **Tool Calling**:
   - Function calling format
   - Tool execution flow
   - Result handling

4. **Streaming**:
   - Server-Sent Events (SSE) format
   - Streaming response structure
   - Event types

**Deliverable**: OpenAI API contract specification document

---

### 1.3 Study Gemini API Capabilities

**Objective**: Understand Gemini's equivalent features

**Research Areas**:

1. **Gemini Models API**:
   - Visit: https://ai.google.dev/gemini-api/docs
   - Document: Chat, function calling, file handling
   - Compare with OpenAI Assistants API

2. **Gemini Function Calling**:
   ```javascript
   // Gemini format
   {
     "function_declarations": [
       {
         "name": "tool_name",
         "description": "...",
         "parameters": {...}
       }
     ]
   }
   ```
   - How does it differ from OpenAI?
   - Can we create adapter?

3. **Gemini File API**:
   - How to upload files to Gemini?
   - Does Gemini have built-in retrieval?
   - Or do we need RAG API integration?

4. **Gemini Context/Chat Management**:
   - How are conversations managed?
   - Is there a "thread" equivalent?
   - Or just message history?

**Deliverable**: Gemini API capabilities document + comparison matrix

---

## Phase 2: Analyze LibreChat Agents Implementation

### 2.1 Study How Agents Handle Multiple Providers

**Objective**: Learn from Agents' multi-provider architecture

**Files to Analyze**:
```
├── api/server/services/Endpoints/agents/
│   ├── agent.js                              # Agent initialization
│   ├── initialize.js                         # How agents load providers
│   └── build.js
├── packages/api/src/agents/                  # Agent framework
│   ├── client.ts
│   └── providers/                            # Provider adapters?
└── client/src/components/Agents/             # Agent UI
```

**Analysis Questions**:

1. **Provider Abstraction**:
   - How do Agents handle OpenAI vs Anthropic vs Google?
   - Is there a common interface?
   - How are provider-specific features handled?

2. **Tool Management**:
   - How are tools registered per provider?
   - How does tool execution work across providers?
   - Can we reuse this for Assistants?

3. **File Handling**:
   - How do Agents handle file uploads?
   - Do they use RAG API for all providers?
   - Or provider-specific file APIs?

4. **Streaming**:
   - How is streaming abstracted?
   - Different SSE formats per provider?

**Deliverable**: Agents architecture analysis + reusable patterns

---

### 2.2 Identify Reusable Components

**Objective**: Find code that can be shared between Assistants and Agents

**Look for**:

1. **Provider Clients**:
   - Is there a GoogleClient for Agents?
   - Can it be adapted for Assistants?
   - Location: `api/app/clients/`

2. **Tool System**:
   - Are tools provider-agnostic?
   - Can Assistants use Agent tools?
   - Location: `api/server/services/Tools/`

3. **File Processing**:
   - RAG API integration
   - File upload handlers
   - Vector store management

4. **Streaming Handlers**:
   - SSE utilities
   - Stream processing
   - Response formatting

**Deliverable**: List of reusable components + integration plan

---

## Phase 3: Gap Analysis

### 3.1 Identify Missing Pieces for Gemini Assistants

**Create Matrix**:

| Feature | OpenAI Assistants | Gemini Equivalent | Gap |
|---------|------------------|-------------------|-----|
| **API Endpoint** | /v1/assistants | ? | ? |
| **Thread Management** | /v1/threads | ? | ? |
| **Code Interpreter** | Built-in | ? | Use Judge0 |
| **File Search** | Built-in retrieval | ? | Use RAG API |
| **Function Calling** | OpenAI format | Gemini format | Need adapter |
| **Streaming** | SSE | ? | ? |
| **Model List** | GPT-4, GPT-4o | Gemini models | Config |

**Analysis Questions**:

1. **What features can we directly map?**
   - Chat/completion
   - Function calling (with adapter)
   - File uploads (with RAG)

2. **What features need new implementation?**
   - Thread management (if Gemini doesn't have it)
   - Streaming adapter
   - Tool execution flow

3. **What features can't be supported?**
   - OpenAI-specific capabilities
   - Proprietary features

**Deliverable**: Feature gap matrix + risk assessment

---

### 3.2 Database Schema Analysis

**Objective**: Understand if current Assistant schema works for Gemini

**Files to Analyze**:
```
packages/data-schemas/src/
├── models/assistant.ts       # Mongoose model
└── schema/assistant.ts       # Schema definition
```

**Questions**:

1. **Provider Field**:
   - Is there a `provider` field?
   - Or is it assumed to be OpenAI?
   - Need to add provider discrimination?

2. **OpenAI-Specific Fields**:
   - `assistant_id` from OpenAI
   - `file_ids` from OpenAI
   - How to handle for Gemini?

3. **Model Field**:
   - Currently stores OpenAI models
   - Can it store Gemini models?
   - Validation needed?

**Deliverable**: Schema migration plan

---

## Phase 4: Design Proposal

### 4.1 Architecture Options

**Option 1: Unified Assistants Endpoint (Complex)**

```
Assistants Endpoint
├── Provider Adapter Layer
│   ├── OpenAIAssistantAdapter
│   └── GeminiAssistantAdapter
├── Common Interface
│   ├── createAssistant()
│   ├── createThread()
│   ├── sendMessage()
│   └── streamResponse()
└── Tool System (shared)
```

**Pros**:
- ✅ Single API for users
- ✅ Unified UI
- ✅ Reusable code

**Cons**:
- ❌ Complex abstraction
- ❌ Lowest common denominator
- ❌ Hard to maintain

---

**Option 2: Separate Gemini Assistants (Moderate)**

```
OpenAI Assistants (existing)
└── Uses OpenAI API directly

Gemini Assistants (new)
├── New endpoint: /api/gemini-assistants
├── Similar API structure
└── Gemini-specific implementation
```

**Pros**:
- ✅ No breaking changes to existing
- ✅ Can optimize per provider
- ✅ Easier to implement

**Cons**:
- ❌ Code duplication
- ❌ Separate UI needed
- ❌ User confusion

---

**Option 3: Migrate to Agents (Recommended)**

```
Deprecate Assistants
└── Migrate users to Agents

Agents (enhanced)
├── Already supports all providers
├── Add "Assistant mode" UI
└── Feature parity with Assistants
```

**Pros**:
- ✅ Already supports Gemini
- ✅ Already provider-agnostic
- ✅ More features (web search, MCP)
- ✅ Single codebase

**Cons**:
- ❌ Migration effort for users
- ❌ Breaking change
- ❌ Different API structure

---

### 4.2 Recommended Approach

**Hybrid Strategy**:

**Phase 1**: Enhance Agents
- Add "Assistant mode" to Agents UI
- Ensure feature parity with Assistants
- Polish UX to match Assistants experience

**Phase 2**: Soft Migration
- Show "Try Agents" prompt in Assistants
- Document migration guide
- Support both in parallel

**Phase 3**: Deprecation (6-12 months)
- Mark Assistants as legacy
- Auto-migrate simple assistants
- Eventually sunset Assistants endpoint

**Rationale**:
- Agents already solve the multi-provider problem
- Agents have more features
- Less code to maintain long-term
- Users get Gemini + Claude + others, not just Gemini

---

## Phase 5: Proof of Concept

### 5.1 Minimal Gemini Assistant Prototype

**Goal**: Build smallest viable implementation to validate approach

**Scope**:
1. Create Gemini assistant
2. Send message
3. Get response
4. Basic function calling

**Implementation**:
```javascript
// New file: api/server/services/Endpoints/gemini-assistants/initialize.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

const initializeClient = async ({ req, res }) => {
  const apiKey = process.env.GOOGLE_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);

  return {
    model: genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' }),
    apiKey
  };
};
```

**Test**:
- Create assistant
- Send "Hello"
- Receive response
- Measure: Does it work? Performance? Gaps?

---

### 5.2 Function Calling Test

**Goal**: Validate function calling can be adapted

**Test**:
```javascript
// OpenAI format
{
  "type": "function",
  "function": {
    "name": "get_weather",
    "parameters": {...}
  }
}

// Gemini format
{
  "function_declarations": [
    {
      "name": "get_weather",
      "parameters": {...}
    }
  ]
}
```

**Build Adapter**:
```javascript
function convertOpenAIToolToGemini(openAITool) {
  return {
    function_declarations: [{
      name: openAITool.function.name,
      description: openAITool.function.description,
      parameters: openAITool.function.parameters
    }]
  };
}
```

**Validate**: Tool execution works end-to-end

---

### 5.3 Streaming Test

**Goal**: Ensure streaming responses work

**OpenAI SSE**:
```
data: {"type": "content_delta", "delta": {...}}
```

**Gemini Streaming**:
```javascript
const result = await model.generateContentStream(...);
for await (const chunk of result.stream) {
  const text = chunk.text();
  // Convert to OpenAI format for frontend
}
```

**Deliverable**: Working streaming adapter

---

## Phase 6: Implementation Plan

### 6.1 Code Structure

**If going with Option 1 (Unified)**:
```
api/server/services/Endpoints/assistants/
├── adapters/
│   ├── base.js                 # Abstract adapter
│   ├── openai.js              # OpenAI implementation
│   └── gemini.js              # Gemini implementation
├── initialize.js               # Route to correct adapter
└── shared/
    ├── threadManager.js
    ├── toolExecutor.js
    └── streamHandler.js
```

**If going with Option 3 (Agents)**:
```
1. Enhance Agents UI
2. Add Assistant-like interface
3. No new backend code needed
```

---

### 6.2 Database Changes

**Option 1: Add provider field to assistants**:
```typescript
// packages/data-schemas/src/schema/assistant.ts
{
  provider: {
    type: String,
    enum: ['openai', 'google', 'anthropic'],
    default: 'openai'
  },
  provider_assistant_id: String,  // Replaces assistant_id
  provider_model: String,          // Replaces model
}
```

**Option 3: Use existing agent schema** (no changes needed)

---

### 6.3 Frontend Changes

**Assistants UI** (`client/src/components/Assistants/`):
- Add provider selector
- Conditional rendering based on provider
- Model dropdown per provider

**Or Agents UI** (minimal changes):
- Add "Assistant mode" toggle
- Simplify UI for assistant-like experience

---

### 6.4 Configuration

**New Environment Variables**:
```bash
# Enable Gemini Assistants
GEMINI_ASSISTANTS_ENABLED=true
GOOGLE_API_KEY=your-google-key

# Or reuse existing
GOOGLE_API_KEY=...  # Already exists for Agents
```

**librechat.yaml**:
```yaml
assistants:
  providers:
    - openai    # Existing
    - google    # New
    - anthropic # Future
```

---

## Phase 7: Testing Strategy

### 7.1 Unit Tests

**Test Coverage**:
```
├── Gemini adapter
│   ├── Assistant creation
│   ├── Message sending
│   ├── Function calling
│   ├── Streaming
│   └── Error handling
├── Tool conversion
│   └── OpenAI ↔ Gemini format
└── Thread management
```

---

### 7.2 Integration Tests

**End-to-End Flows**:
1. Create Gemini assistant
2. Start conversation
3. Use function calling
4. Upload file (with RAG)
5. Stream response
6. Delete assistant

---

### 7.3 Comparison Tests

**Validate Parity**:
- Same user request to OpenAI vs Gemini assistant
- Compare: Quality, speed, tool usage
- Document differences

---

## Phase 8: Documentation

### 8.1 Update Existing Docs

**ASSISTANTS_API_KEY.md**:
- Add Gemini provider section
- Update configuration examples
- Add provider comparison table

---

### 8.2 Migration Guide

**For users switching OpenAI → Gemini Assistants**:
1. Export assistant configuration
2. Create equivalent Gemini assistant
3. Test and verify
4. Switch

---

### 8.3 API Documentation

**New endpoints** (if Option 1):
```
POST /api/assistants
  - Accepts `provider` field
  - Routes to correct adapter

GET /api/assistants/:id
  - Returns provider-agnostic format
```

---

## Critical Questions to Answer

### Technical Feasibility

1. **Does Gemini have thread-like conversation management?**
   - If no: How to implement?
   - Use session IDs? Manage in LibreChat?

2. **Can Gemini tools match OpenAI's Assistants API tools?**
   - Code interpreter: Use Judge0
   - File search: Use RAG API
   - Function calling: Adapter needed

3. **Streaming compatibility?**
   - Can we convert Gemini's stream to OpenAI's SSE format?
   - Performance impact?

4. **File handling?**
   - Gemini File API vs OpenAI file IDs
   - Can we abstract?

---

### Business/Product Questions

1. **User demand?**
   - Do users actually want Gemini Assistants?
   - Or would they use Agents with Gemini instead?

2. **Maintenance burden?**
   - Option 1: Maintain abstraction layer (high cost)
   - Option 3: Enhance Agents (lower cost)

3. **Feature parity?**
   - Can we achieve 100% feature match?
   - Or is 80% acceptable?

---

## Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Gemini API incompatibility** | High | POC first, validate feasibility |
| **Complex abstraction** | High | Consider Option 3 (Agents) |
| **Breaking changes** | Medium | Parallel implementation, gradual migration |
| **Performance issues** | Medium | Benchmark early, optimize adapters |
| **User confusion** | Low | Clear documentation, migration guide |

---

## Success Criteria

**Minimum Viable Product (MVP)**:
- ✅ Create Gemini assistant via UI
- ✅ Send messages and receive responses
- ✅ Function calling works
- ✅ Streaming responses work
- ✅ File upload + RAG integration works

**Full Feature Parity**:
- ✅ All OpenAI Assistant features replicated
- ✅ Performance comparable to OpenAI
- ✅ User migration path exists
- ✅ Documentation complete
- ✅ Tests passing

---

## Recommended Next Steps

### Immediate (This Week)

1. **Analyze initalize.js in depth**:
   ```bash
   cat api/server/services/Endpoints/assistants/initalize.js
   ```
   - Document every OpenAI SDK call
   - Identify abstraction points

2. **Research Gemini Assistants API**:
   - Read: https://ai.google.dev/gemini-api/docs
   - Test: Create simple Gemini chat
   - Document: API structure

3. **Prototype conversion**:
   - Build simple OpenAI → Gemini tool converter
   - Test with one function call

---

### Short-term (Next 2 Weeks)

1. **Complete Phase 1 & 2 analysis**
2. **Build POC** (Phase 5)
3. **Decision point**: Option 1, 2, or 3?
4. **Get stakeholder buy-in**

---

### Medium-term (Next Month)

1. **Implement chosen approach**
2. **Write tests**
3. **Update documentation**
4. **Beta testing with users**

---

## Conclusion

**Recommendation**:

Before implementing Gemini Assistants from scratch, I recommend:

1. **Enhance Agents first** - They already support Gemini and all providers
2. **Add "Assistant mode" to Agents** - Simpler UI, same backend
3. **Document migration** - Show users how to move from Assistants to Agents
4. **Long-term: Sunset Assistants** - Maintain one codebase (Agents) instead of two

This approach:
- ✅ Gets users Gemini support faster (Agents already work)
- ✅ Reduces code complexity (one framework vs two)
- ✅ Supports ALL providers (not just Gemini)
- ✅ Easier maintenance

**Alternative**: If pure Gemini Assistants is required, start with **Option 2** (separate endpoint) as proof of concept before committing to full abstraction layer.

---

*This plan should be reviewed with the LibreChat maintainers before implementation.*
