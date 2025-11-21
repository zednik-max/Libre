# AGENTS.md

**AI Coding Agent Guide for LibreChat**

This file provides context and instructions for AI coding agents working on the LibreChat project. For technical implementation details, see [AGENTS_CUSTOMIZATIONS.md](./AGENTS_CUSTOMIZATIONS.md).

---

## Project Overview

LibreChat is an open-source, all-in-one AI chat platform (v0.8.1-rc1) that integrates multiple AI providers into a unified interface. It's a production-ready, multi-tenant application built with:
- **Backend**: Node.js, Express, MongoDB, Redis, Meilisearch
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Monorepo**: npm workspaces with 4 shared packages

**Repository**: https://github.com/danny-avila/LibreChat

---

## Dev Environment Tips

### Prerequisites
```bash
# Required
- Node.js 18+
- MongoDB 6+
- Redis 6+
- npm or bun

# Optional for full features
- Docker & Docker Compose
- Meilisearch (search functionality)
- PostgreSQL (RAG/vector search)
```

### Initial Setup
```bash
# 1. Install dependencies
npm install

# 2. Environment configuration
cp .env.example .env
# Edit .env with your API keys

# 3. Start infrastructure (MongoDB, Redis, Meilisearch)
docker-compose up -d mongodb redis meilisearch

# 4. Build shared packages (CRITICAL - build order matters!)
npm run build:packages

# 5. Start development servers
# Terminal 1: Backend
npm run backend:dev

# Terminal 2: Frontend
npm run frontend:dev
```

### Project Structure Navigation
```bash
# Shared packages (build order dependency!)
packages/data-provider/     # API client (build FIRST)
packages/data-schemas/      # Mongoose schemas (build SECOND)
packages/api/               # MCP services (build THIRD)
packages/client/            # Shared components (build FOURTH)

# Backend
api/server/routes/          # Express routes
api/server/controllers/     # Request handlers
api/server/services/        # Business logic
api/app/clients/            # AI provider clients
api/models/                 # Mongoose models

# Frontend
client/src/components/      # React components (feature-based)
client/src/hooks/           # Custom React hooks
client/src/store/           # Jotai atoms (global state)
client/src/Providers/       # React Context providers
```

### Import Aliases
Both frontend and backend use `~/` alias for cleaner imports:

```javascript
// Backend (api/)
const { logger } = require('~/config');
const User = require('~/models/User');

// Frontend (client/src/)
import { cn } from '~/utils';
import Button from '~/components/ui/Button';
```

### Critical Build Order
**ALWAYS build packages in this order when modified**:
```bash
# Rebuild all packages
npm run build:packages

# Or rebuild specific package
cd packages/data-provider && npm run build
cd packages/data-schemas && npm run build
cd packages/api && npm run build
cd packages/client && npm run build

# Then restart frontend dev server
cd client && npm run dev
```

**When to rebuild**:
- Modified anything in `packages/*/src/`
- Changed API types or schemas
- Updated database models
- Modified shared utilities

---

## Agent-Specific Development

### Working with Agents (LibreChat's AI Agent System)

**Key Files**:
```
packages/data-schemas/src/schema/agent.ts      # Agent MongoDB schema
api/server/routes/agents.js                    # Agent CRUD routes
api/server/services/Endpoints/agents/          # Agent services
  ├── agent.js                                  # Agent initialization
  ├── initialize.js                             # Tool loading
  └── build.js                                  # Agent builder
api/server/services/Tools/                      # Tool implementations
  ├── judge0.js                                 # Code execution tool
  ├── search.js                                 # Web search tool
  └── mcp.js                                    # MCP tools
client/src/components/Agents/                   # Agent UI
```

**Technical Reference**: See [AGENTS_CUSTOMIZATIONS.md](./AGENTS_CUSTOMIZATIONS.md) for:
- Complete agent schema
- Creating agents programmatically
- Custom tool development
- MCP server integration
- API reference

### Creating a New Tool

1. **Create tool file** in `api/server/services/Tools/`:
```javascript
// my-tool.js
const { z } = require('zod');
const { DynamicStructuredTool } = require('@langchain/core/tools');

function createMyTool(config) {
  const schema = z.object({
    param: z.string().describe('Parameter description')
  });

  const tool = new DynamicStructuredTool({
    name: 'my_tool',
    description: 'What this tool does',
    schema,
    func: async ({ param }) => {
      // Implementation
      return 'Result';
    }
  });

  tool.apiKey = config.apiKey;
  return tool;
}

module.exports = { createMyTool };
```

2. **Register tool** in `api/server/services/ToolService.js`
3. **Add to constants** in `packages/data-provider/src/config.ts`
4. **Add auth** (if needed) in `api/server/controllers/tools.js`
5. **Rebuild packages**: `npm run build:packages`
6. **Test**: Create agent with new tool via UI or API

### Modifying Existing Agent Code

**Backend changes** (routes, services, controllers):
```bash
# Make changes in api/server/
# Restart backend (nodemon auto-restarts)
npm run backend:dev
```

**Frontend changes** (UI, hooks, components):
```bash
# Make changes in client/src/components/Agents/
# Hot reload automatically updates browser
npm run frontend:dev
```

**Schema changes** (database models):
```bash
# 1. Modify packages/data-schemas/src/schema/agent.ts
# 2. Rebuild package
cd packages/data-schemas && npm run build

# 3. Restart backend
cd ../../api && npm run backend:dev

# 4. Restart frontend (if using types)
cd ../client && npm run frontend:dev
```

---

## Testing Instructions

### Running Tests

**Backend tests** (Jest):
```bash
cd api
npm test                     # All tests
npm test -- SomeService      # Specific test
npm test -- --coverage       # With coverage
npm test -- --watch          # Watch mode
```

**Frontend tests** (Jest + React Testing Library):
```bash
cd client
npm test                     # All tests
npm test Button              # Specific test
npm test -- --coverage       # With coverage
npm test -- --watch          # Watch mode
```

**E2E tests** (Playwright):
```bash
npm run e2e                  # Headless
npm run e2e:headed           # With browser UI
npm run e2e:debug            # Debug mode
npm run e2e -- chat.spec.ts  # Specific test
npm run e2e:a11y             # Accessibility tests
```

### Test Locations
```
api/test/                    # Backend tests
client/src/**/*.test.tsx     # Frontend tests (colocated)
e2e/specs/                   # E2E tests
```

### CI/CD
See `.github/workflows/` for CI pipeline configuration.

### Linting and Formatting
```bash
npm run lint                 # Check linting
npm run lint:fix             # Fix linting issues
npm run format               # Format with Prettier

# Type checking (frontend)
cd client && npx tsc --noEmit
```

---

## Making Changes

### Backend Workflow

1. **Modify code** in `api/`
2. **If modifying models**: Update in `packages/data-schemas/src/models/`
3. **Run tests**: `npm run test:api`
4. **Backend auto-restarts** with nodemon

**Example - Adding new endpoint**:
```javascript
// 1. Create route: api/server/routes/myRoute.js
const express = require('express');
const router = express.Router();
const { requireJwtAuth } = require('~/server/middleware');

router.get('/', requireJwtAuth, async (req, res) => {
  // Implementation
  res.json({ success: true });
});

module.exports = router;

// 2. Register: api/server/index.js
app.use('/api/myRoute', require('~/server/routes/myRoute'));

// 3. Add controller/service as needed
```

### Frontend Workflow

1. **Modify code** in `client/src/`
2. **Hot reload** automatically updates browser
3. **Run tests**: `npm run test:client`
4. **Check types**: `cd client && npx tsc --noEmit`

**Example - Adding component**:
```tsx
// client/src/components/MyFeature/MyComponent.tsx
import { useState } from 'react';
import { useMyQuery } from 'librechat-data-provider/react-query';

export default function MyComponent() {
  const { data, isLoading } = useMyQuery();

  if (isLoading) return <div>Loading...</div>;

  return <div className="flex flex-col gap-2">{/* Implementation */}</div>;
}
```

### Shared Package Workflow

**CRITICAL**: If modifying shared packages, rebuild them:

```bash
# Rebuild all packages
npm run build:packages

# Or specific package
cd packages/data-provider && npm run build

# Then restart frontend dev server
cd ../../client
# Ctrl+C and restart
npm run frontend:dev
```

### Database Changes

**Adding a model**:
```typescript
// 1. Define schema: packages/data-schemas/src/models/myModel.ts
import mongoose from 'mongoose';

const mySchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('MyModel', mySchema);

// 2. Export: packages/data-schemas/src/index.ts
export { default as MyModel } from './models/myModel';

// 3. Rebuild
cd packages/data-schemas && npm run build

// 4. Use in API
const { MyModel } = require('@librechat/data-schemas');
```

---

## Configuration Files

### Environment Variables
```bash
# .env - Main configuration
MONGO_URI=mongodb://...          # Required
REDIS_URI=redis://...            # Recommended
JWT_SECRET=...                   # Required

# AI Provider API Keys
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
GOOGLE_API_KEY=...

# Tool API Keys
CODE_API_KEY=...                 # Judge0 (RapidAPI)
SERPER_API_KEY=...               # Web search
JINA_API_KEY=...                 # Reranker

# Feature Flags
SEARCH=true
CODE_INTERPRETER=true
AGENTS=true
```

### librechat.yaml
Main application configuration:
```yaml
version: 1.3.1
cache: true

endpoints:
  custom:
    - name: 'Vertex-AI'
      apiKey: 'dummy'
      baseURL: 'http://vertex-proxy:4000'
      models:
        default: ['deepseek-r1', 'deepseek-v3', ...]

    - name: 'Mistral'
      apiKey: '${MISTRAL_API_KEY}'
      baseURL: 'https://api.mistral.ai/v1'
      models:
        default: ['mistral-large-latest', ...]

    - name: 'Perplexity'
      apiKey: '${PERPLEXITY_API_KEY}'
      baseURL: 'https://api.perplexity.ai'
      models:
        default: ['sonar', 'sonar-pro', ...]

    - name: 'OpenRouter'
      apiKey: '${OPENROUTER_KEY}'
      baseURL: 'https://openrouter.ai/api/v1'
      models:
        default: ['google/gemma-3-4b-it:free', ...]
        fetch: true

    - name: 'HuggingFace'
      apiKey: '${HUGGINGFACE_TOKEN}'
      baseURL: 'https://router.huggingface.co/v1'
      models:
        default: ['meta-llama/Llama-3.2-3B-Instruct:together', ...]
        fetch: false  # Requires :provider suffix

    - name: 'Z.ai'
      apiKey: '${ZAI_API_KEY}'
      baseURL: 'https://api.z.ai/api/coding/paas/v4'
      models:
        default: ['GLM-4.5', 'GLM-4.5-Air', 'GLM-4.6']

webSearch:
  serperApiKey: '${SERPER_API_KEY}'
  searchProvider: 'serper'
```

**Version**: Always use `1.3.1` (current latest)

---

## Docker Development

### Using Docker Compose

```bash
# Start all services
docker-compose -f docker-compose.windows.yml up -d

# Start specific service
docker-compose -f docker-compose.windows.yml up -d mongodb redis

# View logs
docker logs -f LibreChat

# Rebuild and restart
docker-compose -f docker-compose.windows.yml down
docker-compose -f docker-compose.windows.yml build api
docker-compose -f docker-compose.windows.yml up -d
```

### Custom Docker Build (Judge0 Integration)

**Dockerfile.judge0**: Custom image with Judge0 code execution integrated
```bash
# Build custom image
docker build -f Dockerfile.judge0 -t librechat-judge0:latest .

# Use in docker-compose.windows.yml
# (already configured)
```

---

## Git Workflow

### Branch Strategy
- `main` - Production-ready code
- Feature branches - `claude/{feature-name}-{session-id}` pattern

### Commit Conventions
```bash
feat: Add new feature
fix: Bug fix
docs: Documentation update
refactor: Code refactoring
test: Add tests
chore: Maintenance
```

**Examples**:
```bash
feat: Add Judge0 code execution tool
fix: Resolve authentication token expiration
docs: Update agent customization guide
refactor: Simplify message streaming logic
```

### Making Commits
```bash
# Stage changes
git add .

# Commit with semantic message
git commit -m "feat: Add comprehensive agent documentation"

# Push to current branch
git push -u origin <current-branch>
```

---

## Common Tasks

### User Management
```bash
npm run create-user              # Create user account
npm run reset-password           # Reset password
npm run add-balance              # Add token balance
npm run list-users               # List all users
```

### Database Operations
```bash
npm run flush-cache              # Clear Redis cache
npm run reset-meili-sync         # Reset Meilisearch
npm run migrate:agent-permissions  # Migrate agent permissions
```

### Building for Production
```bash
# Build all packages + frontend
npm run frontend

# Build for Docker
docker-compose up -d --build
```

---

## PR Instructions

### Before Creating PR

1. **Run tests**:
```bash
npm run test:api          # Backend tests
npm run test:client       # Frontend tests
npm run lint:fix          # Fix linting
```

2. **Check TypeScript**:
```bash
cd client && npx tsc --noEmit
```

3. **Rebuild packages if modified**:
```bash
npm run build:packages
```

4. **Test in Docker** (if infrastructure changes):
```bash
docker-compose -f docker-compose.windows.yml build
docker-compose -f docker-compose.windows.yml up -d
# Test manually
```

### PR Title Format
```
<type>: <description>

Examples:
feat: Add Judge0 code execution integration
fix: Resolve Code Interpreter auto-pin issue
docs: Add comprehensive agent documentation
refactor: Migrate from Recoil to Jotai
```

### PR Description Template
```markdown
## Summary
Brief description of changes

## Changes Made
- List of key changes
- File modifications
- New features added

## Testing
- [ ] Backend tests pass
- [ ] Frontend tests pass
- [ ] E2E tests pass (if applicable)
- [ ] Manually tested in development
- [ ] Tested in Docker (if infrastructure changes)

## Related Issues
Fixes #123
Relates to #456

## Screenshots (if UI changes)
[Attach screenshots]
```

### Pre-Commit Checklist
- [ ] Code follows project conventions
- [ ] Tests added/updated for new functionality
- [ ] Documentation updated (if needed)
- [ ] No console.log or debug code
- [ ] TypeScript types are correct
- [ ] Shared packages rebuilt (if modified)
- [ ] Commit messages follow semantic format
- [ ] No secrets or API keys in code

---

## Troubleshooting

### Build Errors

**"Cannot find module '@librechat/data-provider'"**:
```bash
npm run build:packages
```

**Frontend shows 404 for API calls**:
- Check Vite proxy in `client/vite.config.ts`
- Backend should be running on port 3080

**MongoDB connection errors**:
```bash
docker-compose up -d mongodb
# Check .env MONGO_URI is correct
```

**Redis session errors**:
```bash
docker-compose up -d redis
npm run flush-cache
```

### Development Issues

**Hot reload not working**:
```bash
# Kill all node processes
pkill node
# Restart dev servers
npm run backend:dev  # Terminal 1
npm run frontend:dev # Terminal 2
```

**TypeScript errors after pulling changes**:
```bash
npm run reinstall
npm run build:packages
cd client && npx tsc --noEmit
```

**Docker build failing**:
```bash
# Clear Docker cache
docker-compose down -v
docker system prune -a
# Rebuild
docker-compose build --no-cache
```

---

## Additional Resources

- **Technical Customization**: [AGENTS_CUSTOMIZATIONS.md](./AGENTS_CUSTOMIZATIONS.md)
- **Main Documentation**: [CLAUDE.md](./CLAUDE.md)
- **Official Docs**: https://docs.librechat.ai/
- **GitHub**: https://github.com/danny-avila/LibreChat
- **Discord**: https://discord.librechat.ai

---

## Quick Reference

### Essential Commands
```bash
# Development
npm run backend:dev              # Start backend
npm run frontend:dev             # Start frontend
npm run build:packages           # Build shared packages

# Testing
npm run test:api                 # Backend tests
npm run test:client              # Frontend tests
npm run e2e                      # E2E tests

# Database
npm run flush-cache              # Clear Redis
npm run create-user              # Create user

# Docker
docker-compose -f docker-compose.windows.yml up -d
docker-compose -f docker-compose.windows.yml logs -f api
docker-compose -f docker-compose.windows.yml restart api
```

### File Paths
```
packages/data-schemas/src/schema/agent.ts        # Agent schema
api/server/services/Tools/                       # Tool implementations
client/src/components/Agents/                    # Agent UI
librechat.yaml                                   # Main config
.env                                             # Environment variables
```

### Key Conventions
- **Files**: `PascalCase.tsx` (components), `camelCase.ts` (utils)
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **CSS**: `kebab-case` (Tailwind utilities)
- **Imports**: Use `~/` alias for cleaner paths

---

*This AGENTS.md file follows the [agents.md format](https://github.com/openai/agents.md) for guiding AI coding agents.*
