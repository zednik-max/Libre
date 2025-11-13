# LibreChat - AI Assistant Development Guide

**Version**: v0.8.1-rc1
**Last Updated**: 2025-11-13
**Repository**: https://github.com/danny-avila/LibreChat

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Getting Started](#getting-started)
4. [Codebase Structure](#codebase-structure)
5. [Development Workflows](#development-workflows)
6. [Key Conventions](#key-conventions)
7. [Common Tasks](#common-tasks)
8. [Testing Strategy](#testing-strategy)
9. [Important Patterns](#important-patterns)
10. [Troubleshooting](#troubleshooting)

---

## Project Overview

LibreChat is an open-source, all-in-one AI chat platform that integrates multiple AI providers (OpenAI, Anthropic, Google, AWS Bedrock, Azure, Ollama, and more) into a unified interface. It's a production-ready, multi-tenant application with advanced features including:

- Multi-model AI conversations with provider switching
- Agent framework with tool calling and MCP (Model Context Protocol) support
- Code artifacts (React, HTML, Mermaid diagrams)
- RAG (Retrieval-Augmented Generation) with vector search
- Multi-user authentication (OAuth2, LDAP, SAML)
- File uploads with multiple storage backends
- Image generation and editing
- Speech-to-text and text-to-speech
- 40+ language internationalization
- RBAC (Role-Based Access Control)
- Token-based balance and rate limiting

**Technology Stack**:
- **Backend**: Node.js, Express, MongoDB, Redis, Meilisearch
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **State**: React Query, Jotai, Recoil (legacy)
- **Monorepo**: npm workspaces with 4 shared packages

---

## Architecture

### Monorepo Structure

LibreChat uses **npm workspaces** organized as follows:

```
/home/user/Libre/
├── api/                    # Backend Express API (Node.js)
├── client/                 # Frontend React application (Vite)
├── packages/               # Shared packages (build order matters!)
│   ├── data-provider/     # API client, data fetching (build first)
│   ├── data-schemas/      # Mongoose schemas, validation (build second)
│   ├── api/               # MCP services, shared API logic (build third)
│   └── client/            # Shared React components (build fourth)
├── config/                 # CLI utility scripts (user management, etc.)
├── e2e/                    # Playwright end-to-end tests
├── helm/                   # Kubernetes/Helm deployment charts
└── utils/                  # Miscellaneous utility scripts
```

### Critical Build Order

**IMPORTANT**: Packages must be built in dependency order:

```bash
1. packages/data-provider      # No internal dependencies
2. packages/data-schemas       # Depends on data-provider
3. packages/api               # Depends on 1 & 2
4. packages/client            # Depends on 1, 2, 3
5. client/                    # Depends on all packages
```

Use `npm run build:packages` to build all packages in the correct order.

### Frontend ↔ Backend Communication

```
Component
  ↓
React Query Hook (useQuery/useMutation)
  ↓
data-provider API function (packages/data-provider/src/)
  ↓
axios HTTP request
  ↓
Backend Express Route (api/server/routes/)
  ↓
Controller (api/server/controllers/)
  ↓
Service Layer (api/server/services/)
  ↓
Mongoose Model (packages/data-schemas/)
  ↓
MongoDB
```

**Real-time Communication**: Server-Sent Events (SSE) for AI response streaming.

---

## Getting Started

### Prerequisites

- Node.js 18+ (or Bun)
- MongoDB 6+
- Redis 6+
- npm or bun package manager

### Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   # or: bun install
   ```

2. **Environment configuration**:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

3. **Start MongoDB and Redis** (via Docker):
   ```bash
   docker-compose up -d mongodb redis meilisearch
   ```

4. **Build shared packages**:
   ```bash
   npm run build:packages
   ```

5. **Run development servers**:
   ```bash
   # Terminal 1: Backend
   npm run backend:dev

   # Terminal 2: Frontend
   npm run frontend:dev
   ```

6. **Access the application**:
   - Frontend dev server: http://localhost:3090
   - Backend API: http://localhost:3080
   - Vite proxy forwards API requests to backend

### Using Bun (Alternative)

```bash
bun install
bun run b:api:dev        # Backend with watch mode
bun run b:client:dev     # Frontend dev server
```

---

## Codebase Structure

### API Structure (`api/`)

```
api/
├── server/
│   ├── index.js                    # Entry point - Express server initialization
│   ├── routes/                     # Express route definitions (30+ files)
│   │   ├── agents.js              # Agent CRUD and execution
│   │   ├── assistants.js          # OpenAI Assistants API
│   │   ├── messages.js            # Message sending and streaming
│   │   ├── convos.js              # Conversation management
│   │   ├── files.js               # File upload/download
│   │   ├── auth.js, oauth.js      # Authentication
│   │   ├── mcp.js                 # Model Context Protocol
│   │   └── ...
│   ├── controllers/                # Request handlers organized by feature
│   ├── middleware/                 # Express middleware
│   │   ├── limiters/              # Rate limiting per endpoint
│   │   ├── roles/                 # RBAC authorization
│   │   ├── validate/              # Request validation (Zod schemas)
│   │   └── accessResources/       # Resource access control
│   ├── services/                   # Business logic layer
│   │   ├── Config/                # Application configuration loader
│   │   ├── Endpoints/             # AI provider integrations
│   │   │   ├── anthropic/         # Claude API integration
│   │   │   ├── openAI/            # OpenAI/Azure integration
│   │   │   ├── google/            # Google Gemini
│   │   │   ├── bedrock/           # AWS Bedrock
│   │   │   ├── agents/            # Agent execution engine
│   │   │   └── assistants/        # Assistants API implementation
│   │   ├── Files/                 # File storage strategies
│   │   │   ├── Local/             # Local filesystem
│   │   │   ├── S3/                # AWS S3
│   │   │   ├── Azure/             # Azure Blob Storage
│   │   │   ├── Firebase/          # Firebase Storage
│   │   │   └── images/            # Image processing (Sharp)
│   │   ├── Artifacts/             # Code artifact management
│   │   ├── Tools/                 # Tool calling implementations
│   │   └── start/                 # Startup initialization services
│   └── utils/                      # Server utilities
├── app/                            # Application logic
│   └── clients/                    # AI client implementations
│       ├── BaseClient.js          # Abstract base class for all AI clients
│       ├── OpenAIClient.js        # OpenAI/Azure client
│       ├── AnthropicClient.js     # Anthropic Claude client
│       ├── GoogleClient.js        # Google Gemini client
│       ├── TextStream.js          # Streaming response handler
│       ├── tools/                 # Tool calling logic
│       └── prompts/               # System prompt templates
├── models/                         # Mongoose model definitions (20+ files)
├── db/                             # Database connection and utilities
├── strategies/                     # Passport.js auth strategies (15+ files)
├── cache/                          # Redis caching implementations
├── lib/                            # Shared libraries
└── test/                           # Backend tests
```

**Key Files**:
- `api/server/index.js` - Server entry point (3080)
- `api/app/clients/BaseClient.js` - Base class for all AI provider clients
- `api/server/services/Config/` - Loads `librechat.yaml` configuration

### Client Structure (`client/`)

```
client/
├── src/
│   ├── main.jsx                    # Entry point - React 18 initialization
│   ├── App.jsx                     # Root component with providers
│   ├── routes/                     # React Router v6 configuration
│   │   ├── index.tsx              # Route definitions
│   │   ├── ChatRoute.tsx          # Main chat interface route
│   │   ├── Dashboard.tsx          # Dashboard view
│   │   ├── Search.tsx             # Conversation search
│   │   └── Layouts/               # Layout components
│   ├── components/                 # React components (feature-based organization)
│   │   ├── Chat/                  # Main chat UI
│   │   │   ├── ChatView.tsx       # Chat message display
│   │   │   ├── ChatContainer.tsx  # Chat layout container
│   │   │   └── ...
│   │   ├── Messages/              # Message rendering
│   │   │   ├── Content/           # Message content types
│   │   │   ├── MessageContent.tsx # Main message renderer
│   │   │   └── ...
│   │   ├── Input/                 # Message input components
│   │   │   ├── ChatForm.tsx       # Main input form
│   │   │   ├── Textarea/          # Auto-resizing textarea
│   │   │   └── Footer/            # Input footer with actions
│   │   ├── Nav/                   # Navigation sidebar
│   │   ├── Conversations/         # Conversation list
│   │   ├── Agents/                # Agent marketplace UI
│   │   ├── Artifacts/             # Code artifact viewer/editor
│   │   ├── Endpoints/             # Model/endpoint selection
│   │   ├── Files/                 # File upload/management UI
│   │   ├── Prompts/               # Prompt library UI
│   │   ├── MCP/                   # MCP server management UI
│   │   ├── Auth/                  # Login/registration forms
│   │   └── ui/                    # Base UI components (Radix UI wrappers)
│   ├── hooks/                      # Custom React hooks (feature-based)
│   │   ├── Agents/                # Agent-related hooks
│   │   ├── Assistants/            # Assistant hooks
│   │   ├── Chat/                  # Chat functionality hooks
│   │   ├── Conversations/         # Conversation management
│   │   ├── Messages/              # Message handling
│   │   ├── Files/                 # File upload hooks
│   │   ├── MCP/                   # MCP hooks
│   │   ├── SSE/                   # Server-Sent Events hooks
│   │   └── Generic/               # Reusable generic hooks
│   ├── store/                      # Jotai atoms for global state (20+ files)
│   │   ├── agents.ts              # Agent state
│   │   ├── artifacts.ts           # Artifact state
│   │   ├── conversation.ts        # Current conversation
│   │   ├── endpoints.ts           # Available endpoints/models
│   │   ├── settings.ts            # User settings
│   │   └── ...
│   ├── Providers/                  # React Context providers (30+)
│   │   ├── ChatContext.tsx        # Chat state and actions
│   │   ├── MessageContext.tsx     # Message state
│   │   ├── AgentsContext.tsx      # Agents state
│   │   └── ...
│   ├── data-provider/              # API integration (uses packages/data-provider)
│   │   ├── Auth/                  # Auth API calls
│   │   ├── Agents/                # Agent API calls
│   │   ├── Messages/              # Message API calls
│   │   ├── Files/                 # File API calls
│   │   └── ...
│   ├── locales/                    # i18n translation files (40+ languages)
│   │   ├── en/                    # English
│   │   ├── es/                    # Spanish
│   │   ├── zh-Hans/               # Chinese (Simplified)
│   │   └── ...
│   ├── utils/                      # Utility functions
│   ├── constants/                  # Application constants
│   └── @types/                     # TypeScript type definitions
├── public/                         # Static assets
│   ├── assets/                    # Images, icons, logos
│   └── fonts/                     # Font files
├── vite.config.ts                 # Vite build configuration
├── tsconfig.json                  # TypeScript configuration
├── tailwind.config.cjs            # Tailwind CSS configuration
└── package.json
```

**Key Files**:
- `client/src/main.jsx` - Frontend entry point
- `client/src/routes/ChatRoute.tsx` - Main chat interface
- `client/vite.config.ts` - Dev server proxies `/api/*` to `localhost:3080`

### Shared Packages (`packages/`)

#### 1. `data-provider` (Build First)

**Purpose**: API client layer, data fetching utilities, React Query hooks

```
packages/data-provider/src/
├── data-service.ts             # Core axios API client
├── api-endpoints.ts            # Endpoint URL definitions
├── config.ts                   # Configuration schemas
├── schemas.ts                  # Zod validation schemas
├── parsers.ts                  # Data parsing utilities
├── artifacts.ts                # Artifact-related API calls
├── actions.ts                  # Action API calls
├── mcp.ts                      # MCP API calls
└── react-query/                # React Query hooks (export path)
    ├── queries.ts              # useQuery hooks
    ├── mutations.ts            # useMutation hooks
    └── ...
```

**Usage**:
```typescript
// Import API service
import { dataService } from 'librechat-data-provider';

// Import React Query hooks
import { useConversations } from 'librechat-data-provider/react-query';
```

#### 2. `data-schemas` (Build Second)

**Purpose**: Mongoose schemas, database models, validation

```
packages/data-schemas/src/
├── models/                     # Mongoose schema definitions (30+ models)
│   ├── user.ts                # User model
│   ├── convo.ts               # Conversation model
│   ├── message.ts             # Message model
│   ├── agent.ts               # Agent model
│   ├── assistant.ts           # Assistant model
│   └── ...
├── schema/                     # Schema factories and defaults
├── methods/                    # Database operation methods
├── types/                      # TypeScript type definitions
├── utils/                      # Utility functions
└── config/                     # Configuration validation
```

**Key Models**:
- `user.ts` - User accounts, authentication
- `convo.ts` - Conversations with messages
- `message.ts` - Individual chat messages
- `file.ts` - Uploaded files metadata
- `agent.ts` - Custom agent configurations
- `assistant.ts` - OpenAI Assistant API assistants
- `prompt.ts` - Prompt templates
- `preset.ts` - Conversation presets
- `role.ts` - RBAC roles
- `balance.ts` - Token balances
- `transaction.ts` - Token usage tracking

#### 3. `api` (Build Third)

**Purpose**: MCP (Model Context Protocol) services, shared API logic

```
packages/api/src/
├── agents/                     # Agent framework
├── mcp/                        # MCP server management
├── endpoints/                  # Endpoint-specific logic
├── files/                      # File handling utilities
├── auth/                       # Authentication services
├── cache/                      # Caching utilities
├── tools/                      # Tool calling
└── middleware/                 # Shared middleware
```

#### 4. `client` (Build Fourth)

**Purpose**: Reusable React component library

Shared UI components extracted for reuse across the application.

---

## Development Workflows

### Making Changes

#### Backend Changes

1. **Modify code** in `api/` directory
2. **If modifying models**: Update in `packages/data-schemas/src/models/`
3. **Run tests**: `npm run test:api`
4. **Restart dev server**: Auto-restarts with nodemon

**Example - Adding a new API endpoint**:

```javascript
// 1. Create route file: api/server/routes/newFeature.js
const express = require('express');
const router = express.Router();
const { requireJwtAuth } = require('~/server/middleware');

router.get('/', requireJwtAuth, async (req, res) => {
  // Implementation
  res.json({ success: true });
});

module.exports = router;

// 2. Register route: api/server/index.js
app.use('/api/newFeature', require('~/server/routes/newFeature'));

// 3. Add controller/service as needed
```

#### Frontend Changes

1. **Modify code** in `client/src/`
2. **Hot reload** automatically updates the browser
3. **Run tests**: `npm run test:client`
4. **Check types**: `cd client && npx tsc --noEmit`

**Example - Adding a new component**:

```tsx
// client/src/components/NewFeature/NewComponent.tsx
import { useState } from 'react';
import { useNewFeatureQuery } from 'librechat-data-provider/react-query';

export default function NewComponent() {
  const { data, isLoading } = useNewFeatureQuery();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="flex flex-col gap-2">
      {/* Implementation */}
    </div>
  );
}
```

#### Shared Package Changes

**CRITICAL**: If you modify shared packages, you must rebuild them:

```bash
# Rebuild specific package
cd packages/data-provider
npm run build

# Or rebuild all packages
npm run build:packages

# Then restart frontend dev server
cd ../../client
# Ctrl+C and restart npm run frontend:dev
```

**When to rebuild packages**:
- Modified anything in `packages/data-provider/src/`
- Modified anything in `packages/data-schemas/src/`
- Modified anything in `packages/api/src/`
- Added/changed API types or schemas
- Changed database models

### Adding a New AI Provider

1. **Create client class** in `api/app/clients/`:
   ```javascript
   // NewProviderClient.js
   const BaseClient = require('./BaseClient');

   class NewProviderClient extends BaseClient {
     constructor(apiKey, options) {
       super(apiKey, options);
       // Provider-specific initialization
     }

     async sendMessage(message, opts) {
       // Implementation
     }
   }

   module.exports = NewProviderClient;
   ```

2. **Create service** in `api/server/services/Endpoints/newProvider/`:
   ```javascript
   // initializeClient.js
   const NewProviderClient = require('~/app/clients/NewProviderClient');

   const initializeClient = async ({ req, res }) => {
     const { apiKey } = req.body;
     return new NewProviderClient(apiKey, { req, res });
   };

   module.exports = initializeClient;
   ```

3. **Add route handler** in `api/server/routes/`:
   ```javascript
   // In appropriate route file
   router.post('/newProvider', requireJwtAuth, async (req, res) => {
     const client = await initializeClient({ req, res });
     // Handle request
   });
   ```

4. **Add frontend configuration** in `client/src/`:
   - Add endpoint to constants
   - Create endpoint-specific UI components
   - Add to endpoint selector

### Adding a Database Model

1. **Define schema** in `packages/data-schemas/src/models/`:
   ```typescript
   // newModel.ts
   import mongoose from 'mongoose';

   const newModelSchema = new mongoose.Schema({
     name: { type: String, required: true },
     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
     // ... fields
   }, {
     timestamps: true,
     collection: 'newModels'
   });

   export default mongoose.model('NewModel', newModelSchema);
   ```

2. **Export from index**:
   ```typescript
   // packages/data-schemas/src/index.ts
   export { default as NewModel } from './models/newModel';
   ```

3. **Rebuild package**:
   ```bash
   cd packages/data-schemas
   npm run build
   ```

4. **Use in API**:
   ```javascript
   // api/server/services/SomeService.js
   const { NewModel } = require('@librechat/data-schemas');

   const newItem = await NewModel.create({ name: 'example' });
   ```

### Adding a React Query Hook

1. **Define in data-provider**:
   ```typescript
   // packages/data-provider/src/react-query/newFeature.ts
   import { useQuery, useMutation } from '@tanstack/react-query';
   import { dataService } from '../data-service';

   export const useNewFeatureQuery = () => {
     return useQuery({
       queryKey: ['newFeature'],
       queryFn: () => dataService.get('/api/newFeature'),
     });
   };

   export const useNewFeatureMutation = () => {
     return useMutation({
       mutationFn: (data) => dataService.post('/api/newFeature', data),
     });
   };
   ```

2. **Export from index**:
   ```typescript
   // packages/data-provider/src/react-query/index.ts
   export * from './newFeature';
   ```

3. **Rebuild and use**:
   ```bash
   cd packages/data-provider
   npm run build
   ```

   ```tsx
   // client/src/components/SomeComponent.tsx
   import { useNewFeatureQuery } from 'librechat-data-provider/react-query';
   ```

---

## Key Conventions

### Import Aliases

Both frontend and backend use `~/` alias:

```javascript
// Backend (api/)
const { logger } = require('~/config');
const User = require('~/models/User');

// Frontend (client/src/)
import { cn } from '~/utils';
import Button from '~/components/ui/Button';
```

**Configuration**:
- Backend: `api/jest.config.js` moduleNameMapper
- Frontend: `client/tsconfig.json` paths

### Naming Conventions

**Files**:
- Components: `PascalCase.tsx` (e.g., `ChatMessage.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useConversation.ts`)
- Utilities: `camelCase.ts` (e.g., `formatDate.ts`)
- Constants: `UPPER_SNAKE_CASE.ts` (e.g., `API_ENDPOINTS.ts`)
- Tests: Same name + `.spec.ts` or `.test.ts`

**Code**:
- React components: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Types/Interfaces: `PascalCase`
- CSS classes: `kebab-case` (Tailwind utilities)

### Code Organization

1. **Feature-based structure**: Group by feature, not file type
   ```
   components/Agents/
   ├── AgentList.tsx
   ├── AgentCard.tsx
   ├── AgentForm.tsx
   └── index.ts
   ```

2. **Colocation**: Keep related files together
   - Tests next to implementation
   - Styles (if any) next to components
   - Types next to usage

3. **Barrel exports**: Use `index.ts` for clean imports
   ```typescript
   // components/Agents/index.ts
   export { default as AgentList } from './AgentList';
   export { default as AgentCard } from './AgentCard';
   ```

### State Management Rules

**Choose the right tool**:

1. **Server state** → React Query
   ```tsx
   const { data } = useConversationsQuery();
   ```

2. **Global UI state** → Jotai atoms (preferred) or Recoil (legacy)
   ```tsx
   import { useAtom } from 'jotai';
   import { settingsAtom } from '~/store/settings';

   const [settings, setSettings] = useAtom(settingsAtom);
   ```

3. **Local component state** → useState/useReducer
   ```tsx
   const [isOpen, setIsOpen] = useState(false);
   ```

4. **Form state** → React Hook Form
   ```tsx
   const { register, handleSubmit } = useForm();
   ```

**Migration note**: The codebase is migrating from Recoil to Jotai. Prefer Jotai for new code.

### API Response Format

**Consistent response structure**:

```javascript
// Success
res.json({
  data: { /* payload */ },
  message: 'Optional success message'
});

// Error (handled by error middleware)
res.status(400).json({
  message: 'Error message',
  error: 'ERROR_CODE'
});
```

### Error Handling

**Backend**:
```javascript
// Use custom error classes
const { AuthenticationError, ValidationError } = require('~/server/utils');

if (!user) {
  throw new AuthenticationError('Invalid credentials');
}

// Errors caught by middleware and formatted consistently
```

**Frontend**:
```tsx
// React Query handles errors
const { data, error, isError } = useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
});

if (isError) {
  return <ErrorMessage error={error} />;
}
```

### Styling Guidelines

**Tailwind CSS**:
- Use utility classes (e.g., `className="flex items-center gap-2"`)
- Use `cn()` utility for conditional classes:
  ```tsx
  import { cn } from '~/utils';

  <div className={cn(
    'base-classes',
    isActive && 'active-classes',
    disabled && 'opacity-50'
  )} />
  ```

**Theme system**:
- Uses CSS variables in `client/src/index.css`
- Dark mode supported via `dark:` prefix
- Responsive: Mobile-first approach (e.g., `sm:`, `md:`, `lg:`)

### Accessibility Standards

**Required practices**:
1. **Semantic HTML**: Use proper elements (`<button>`, `<nav>`, `<article>`)
2. **ARIA labels**: For icons and non-text elements
3. **Keyboard navigation**: All interactive elements must be keyboard accessible
4. **Focus indicators**: Visible focus states
5. **Screen reader support**: Meaningful labels and announcements

**Example**:
```tsx
<button
  aria-label="Close dialog"
  onClick={handleClose}
  className="focus:ring-2 focus:ring-offset-2"
>
  <XIcon aria-hidden="true" />
</button>
```

### TypeScript Guidelines

**Type safety**:
- Prefer `interface` for public APIs
- Use `type` for unions, intersections, utilities
- Avoid `any` - use `unknown` if type is truly unknown
- Use Zod schemas for runtime validation

**Example**:
```typescript
// Define types
interface Agent {
  id: string;
  name: string;
  description: string;
}

// Use in components
const AgentCard: React.FC<{ agent: Agent }> = ({ agent }) => {
  // Implementation
};
```

---

## Common Tasks

### Creating a User

```bash
npm run create-user
# Follow prompts to create user account
```

### Resetting a Password

```bash
npm run reset-password
# Follow prompts
```

### Managing Token Balances

```bash
# Add balance
npm run add-balance

# Set balance
npm run set-balance

# List balances
npm run list-balances

# View user stats
npm run user-stats
```

### Database Migrations

```bash
# Agent permissions migration
npm run migrate:agent-permissions:dry-run  # Preview
npm run migrate:agent-permissions          # Execute

# Prompt permissions migration
npm run migrate:prompt-permissions:dry-run
npm run migrate:prompt-permissions
```

### Clearing Cache

```bash
npm run flush-cache
```

### Running Tests

```bash
# Backend tests
npm run test:api

# Frontend tests
npm run test:client

# E2E tests
npm run e2e              # Headless
npm run e2e:headed       # With browser UI
npm run e2e:debug        # Debug mode
npm run e2e:a11y         # Accessibility tests
```

### Building for Production

```bash
# Build all packages + frontend
npm run frontend

# Build backend (transpilation not required - Node.js runs directly)

# Build for Docker
docker-compose up -d --build
```

### Linting and Formatting

```bash
# Lint
npm run lint

# Lint and fix
npm run lint:fix

# Format with Prettier
npm run format
```

### Debugging

**Backend debugging**:
```bash
# With Bun
bun run b:api-inspect

# Then attach debugger to the port shown
```

**Frontend debugging**:
- Use browser DevTools
- React DevTools extension
- Redux DevTools for Recoil/Jotai

**E2E test debugging**:
```bash
npm run e2e:debug
# Opens Playwright Inspector
```

---

## Testing Strategy

### Backend Testing (Jest)

**Location**: `api/test/`

**Test types**:
1. **Unit tests**: Individual functions/classes
2. **Integration tests**: Service interactions
3. **API tests**: Route handlers with Supertest

**Example test**:
```javascript
// api/test/services/SomeService.spec.js
const { SomeService } = require('~/server/services');

describe('SomeService', () => {
  it('should do something', async () => {
    const result = await SomeService.doSomething();
    expect(result).toBeDefined();
  });
});
```

**Running**:
```bash
cd api
npm test                  # All tests
npm test -- SomeService   # Specific test
npm test -- --coverage    # With coverage
```

### Frontend Testing (Jest + React Testing Library)

**Location**: `client/src/` (colocated with components)

**Test types**:
1. **Component tests**: Render and interaction
2. **Hook tests**: Custom hook behavior
3. **Utility tests**: Pure function tests

**Example test**:
```tsx
// client/src/components/Button/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

**Running**:
```bash
cd client
npm test                       # All tests
npm test Button                # Specific test
npm test -- --coverage         # With coverage
```

### E2E Testing (Playwright)

**Location**: `e2e/specs/`

**Test types**:
1. **User flows**: Complete user journeys
2. **Integration**: Frontend + backend + database
3. **Accessibility**: a11y audits with axe-core

**Example test**:
```typescript
// e2e/specs/chat.spec.ts
import { test, expect } from '@playwright/test';

test('should send a message', async ({ page }) => {
  await page.goto('http://localhost:3080');

  // Type message
  await page.fill('textarea[placeholder="Send a message"]', 'Hello!');
  await page.click('button[type="submit"]');

  // Verify message appears
  await expect(page.locator('text=Hello!')).toBeVisible();
});
```

**Running**:
```bash
npm run e2e                    # All tests
npm run e2e:headed             # With browser
npm run e2e -- chat.spec.ts    # Specific test
npm run e2e:a11y               # Accessibility tests
```

### Test Mocking

**Backend mocks**: `api/test/__mocks__/`
- Logger mock
- Redis mock
- External API mocks

**Frontend mocks**:
- MSW (Mock Service Worker) for API mocking
- Jest mocks for modules

---

## Important Patterns

### BaseClient Pattern (AI Providers)

All AI provider clients extend `BaseClient`:

```javascript
// api/app/clients/BaseClient.js
class BaseClient {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.sender = options.sender;
    // Token counting, balance checking
  }

  async sendMessage(message, opts) {
    // To be implemented by subclasses
    throw new Error('Not implemented');
  }

  // Common utilities
  async getTokenCount(text) { /* ... */ }
  async checkBalance() { /* ... */ }
}

// Subclass example
class OpenAIClient extends BaseClient {
  async sendMessage(message, opts) {
    // OpenAI-specific implementation
  }
}
```

**Key features**:
- Token counting and tracking
- Balance verification
- Streaming support via `TextStream`
- File context extraction
- Tool calling support

### Service Layer Pattern

Routes delegate to controllers, which use services:

```javascript
// Route: api/server/routes/agents.js
router.post('/', requireJwtAuth, agentController.create);

// Controller: api/server/controllers/agents/create.js
const create = async (req, res) => {
  const agent = await AgentService.create(req.body, req.user.id);
  res.json({ agent });
};

// Service: api/server/services/Agents/create.js
const create = async (data, userId) => {
  // Business logic
  return await Agent.create({ ...data, userId });
};
```

**Benefits**:
- Separation of concerns
- Testability
- Reusability
- Clear responsibility

### React Query Pattern

All server state managed via React Query:

```tsx
// Query (read)
const { data, isLoading, error } = useConversationsQuery({
  pageNumber: 1
});

// Mutation (write)
const { mutate: updateConversation } = useUpdateConversationMutation();

updateConversation(
  { conversationId, title: 'New title' },
  {
    onSuccess: () => {
      showToast({ message: 'Updated!' });
    },
    onError: (error) => {
      showToast({ message: error.message, status: 'error' });
    }
  }
);
```

**Features**:
- Automatic caching
- Background refetching
- Optimistic updates
- Error handling
- Loading states

### Context Provider Pattern

Feature-specific contexts wrap components:

```tsx
// Provider definition
export const AgentsProvider = ({ children }) => {
  const [state, setState] = useState(initialState);

  const value = {
    ...state,
    updateAgent: (agent) => setState({ ...state, agent })
  };

  return (
    <AgentsContext.Provider value={value}>
      {children}
    </AgentsContext.Provider>
  );
};

// Hook for accessing context
export const useAgentsContext = () => {
  const context = useContext(AgentsContext);
  if (!context) {
    throw new Error('useAgentsContext must be used within AgentsProvider');
  }
  return context;
};
```

### Streaming Pattern (SSE)

AI responses streamed via Server-Sent Events:

**Backend**:
```javascript
// api/server/services/Endpoints/openAI/sendMessage.js
const stream = await openaiClient.sendMessage(message, {
  stream: true,
  onProgress: (token) => {
    // Send to client via SSE
    res.write(`data: ${JSON.stringify({ token })}\n\n`);
  }
});
```

**Frontend**:
```tsx
// client/src/hooks/SSE/useSSE.ts
const useSSE = (conversationId) => {
  useEffect(() => {
    const eventSource = new EventSource(`/api/stream/${conversationId}`);

    eventSource.onmessage = (event) => {
      const { token } = JSON.parse(event.data);
      // Update UI with new token
    };

    return () => eventSource.close();
  }, [conversationId]);
};
```

### Middleware Chain Pattern

Express middleware for cross-cutting concerns:

```javascript
// api/server/routes/messages.js
router.post(
  '/send',
  requireJwtAuth,              // Authentication
  validateMessageBody,         // Validation
  checkTokenBalance,           // Authorization
  rateLimitMessage,            // Rate limiting
  messageController.send       // Handler
);
```

**Common middleware**:
- `requireJwtAuth` - JWT authentication
- `validateBody` - Request validation
- `checkRole` - RBAC authorization
- `rateLimiter` - Rate limiting
- `mongoSanitize` - Security

---

## Troubleshooting

### Build Errors

**Problem**: `Cannot find module '@librechat/data-provider'`

**Solution**: Build packages in order:
```bash
npm run build:packages
```

**Problem**: Frontend shows 404 for API calls

**Solution**: Check Vite proxy configuration in `client/vite.config.ts`:
```typescript
server: {
  proxy: {
    '/api': 'http://localhost:3080'
  }
}
```

### Database Issues

**Problem**: MongoDB connection errors

**Solution**:
1. Ensure MongoDB is running: `docker-compose up -d mongodb`
2. Check connection string in `.env`: `MONGO_URI=mongodb://...`
3. Check MongoDB logs: `docker logs libre_mongodb`

**Problem**: Meilisearch not syncing

**Solution**:
```bash
# Reset Meilisearch sync
npm run reset-meili-sync

# Restart Meilisearch
docker-compose restart meilisearch
```

### Redis Issues

**Problem**: Session not persisting

**Solution**:
1. Check Redis is running: `docker-compose up -d redis`
2. Verify Redis connection in `.env`: `REDIS_URI=redis://...`
3. Clear Redis cache: `npm run flush-cache`

### Authentication Issues

**Problem**: Login not working

**Solution**:
1. Check JWT secret is set in `.env`: `JWT_SECRET=...`
2. Clear browser cookies
3. Check session configuration in `api/server/index.js`

**Problem**: OAuth not working

**Solution**:
1. Verify OAuth credentials in `.env`
2. Check callback URL matches provider configuration
3. Enable OAuth in `librechat.yaml`

### Frontend Issues

**Problem**: Components not updating after package changes

**Solution**:
1. Rebuild packages: `npm run build:packages`
2. Clear Vite cache: `rm -rf client/node_modules/.vite`
3. Restart dev server

**Problem**: TypeScript errors after pulling changes

**Solution**:
```bash
# Reinstall dependencies
npm run reinstall

# Rebuild packages
npm run build:packages

# Clear TypeScript cache
cd client
rm -rf node_modules/.cache
npx tsc --noEmit
```

### Performance Issues

**Problem**: Slow API responses

**Solution**:
1. Check MongoDB indexes: Ensure proper indexing on collections
2. Enable Redis caching
3. Check rate limiting configuration
4. Monitor database query performance

**Problem**: Slow frontend rendering

**Solution**:
1. Check React DevTools Profiler
2. Verify code splitting is working
3. Check for unnecessary re-renders
4. Use `React.memo` for expensive components

### Test Failures

**Problem**: E2E tests failing

**Solution**:
1. Ensure application is running: `npm run backend:dev` + `npm run frontend:dev`
2. Check test environment: `.env.test` if exists
3. Clear test data: Reset test database
4. Update snapshots: `npm run e2e:update`

**Problem**: Unit tests failing after model changes

**Solution**:
1. Rebuild packages: `npm run build:packages`
2. Update test mocks in `test/__mocks__/`
3. Check test data fixtures

---

## Environment Variables Reference

**Critical variables** (see `.env.example` for complete list):

### Server
- `HOST` - Server host (default: localhost)
- `PORT` - Server port (default: 3080)
- `DOMAIN_SERVER` - Public server URL
- `DOMAIN_CLIENT` - Public client URL

### Database
- `MONGO_URI` - MongoDB connection string (required)
- `REDIS_URI` - Redis connection string (optional but recommended)
- `MEILI_HOST` - Meilisearch host (optional)

### Authentication
- `JWT_SECRET` - JWT signing secret (required)
- `JWT_REFRESH_SECRET` - Refresh token secret
- `SESSION_EXPIRY` - Session expiration time
- `ALLOW_EMAIL_LOGIN` - Enable email/password login
- `ALLOW_REGISTRATION` - Enable user registration
- `ALLOW_SOCIAL_LOGIN` - Enable OAuth providers

### AI Providers
- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic (Claude) API key
- `GOOGLE_API_KEY` - Google (Gemini) API key
- `AZURE_OPENAI_API_KEY` - Azure OpenAI key
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` - AWS Bedrock
- `OLLAMA_BASE_URL` - Ollama endpoint

### File Storage
- `FILE_UPLOAD_PATH` - Local file storage path
- `CDN_PROVIDER` - Storage provider (local, s3, azure, firebase)
- `AWS_S3_BUCKET` - S3 bucket name
- `AZURE_STORAGE_ACCOUNT` - Azure storage account
- `FIREBASE_STORAGE_BUCKET` - Firebase bucket

### Features
- `SEARCH` - Enable Meilisearch (true/false)
- `CODE_INTERPRETER` - Enable code interpreter (true/false)
- `IMAGE_GEN` - Enable image generation (true/false)
- `AGENTS` - Enable agents (true/false)
- `ASSISTANTS` - Enable assistants (true/false)

---

## Configuration Files Reference

### librechat.yaml

Main application configuration file. Controls:
- Endpoint configurations
- Model overrides and parameters
- Interface customization
- File handling strategies
- Security policies
- Feature flags

**Location**: `/home/user/Libre/librechat.example.yaml`

**Key sections**:
```yaml
version: 1.1.0

endpoints:
  openAI:
    enabled: true
    models:
      - gpt-4o
      - gpt-4-turbo
  anthropic:
    enabled: true
    models:
      - claude-3-opus
      - claude-3-sonnet

interface:
  privacyPolicy:
    enabled: true
    url: 'https://...'
  termsOfService:
    enabled: true
    url: 'https://...'

fileConfig:
  maxFileSize: 20971520  # 20MB
  supportedMimeTypes:
    - 'image/*'
    - 'application/pdf'
```

### docker-compose.yml

Development stack configuration:
- LibreChat API service
- MongoDB database
- Redis cache
- Meilisearch
- PostgreSQL (for RAG)
- RAG API service

**Usage**:
```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d mongodb redis

# View logs
docker logs -f libre_api

# Stop all services
docker-compose down
```

---

## Git Workflow

### Branch Strategy

**Main branches**:
- `main` - Production-ready code
- Feature branches - `claude/claude-md-{session-id}` pattern

**Current working branch**: `claude/claude-md-mhxw176ffakjbgor-015kDZD3BZQQUpb3R4pHVTGD`

### Commit Message Conventions

Follow semantic commit messages:

```
feat: Add new agent marketplace feature
fix: Resolve authentication token expiration issue
docs: Update API documentation
refactor: Simplify message streaming logic
test: Add e2e tests for file uploads
chore: Update dependencies
```

### Making Commits

```bash
# Stage changes
git add .

# Commit with message
git commit -m "feat: Add comprehensive CLAUDE.md documentation"

# Push to current branch
git push -u origin claude/claude-md-mhxw176ffakjbgor-015kDZD3BZQQUpb3R4pHVTGD
```

### Creating Pull Requests

```bash
# Push changes
git push -u origin <branch-name>

# Create PR via GitHub UI
# Or use gh CLI (if available)
gh pr create --title "..." --body "..."
```

---

## Additional Resources

### Documentation
- **Official Docs**: https://docs.librechat.ai/
- **API Reference**: https://docs.librechat.ai/api/
- **Configuration Guide**: https://docs.librechat.ai/configuration/

### Community
- **Discord**: https://discord.librechat.ai
- **GitHub Issues**: https://github.com/danny-avila/LibreChat/issues
- **Discussions**: https://github.com/danny-avila/LibreChat/discussions

### Related Repositories
- **RAG API**: https://github.com/danny-avila/rag_api
- **Website**: https://github.com/LibreChat-AI/librechat.ai

---

## Quick Reference Commands

```bash
# Development
npm run backend:dev              # Start backend with nodemon
npm run frontend:dev             # Start frontend with Vite
npm run build:packages           # Build all shared packages

# Testing
npm run test:api                 # Backend tests
npm run test:client              # Frontend tests
npm run e2e                      # E2E tests
npm run lint                     # Lint code
npm run format                   # Format code

# User Management
npm run create-user              # Create user account
npm run reset-password           # Reset password
npm run add-balance              # Add token balance
npm run list-users               # List all users

# Database
npm run flush-cache              # Clear Redis cache
npm run reset-meili-sync         # Reset Meilisearch

# Build
npm run frontend                 # Build frontend + packages
docker-compose up -d --build     # Build and start Docker stack

# Bun alternatives (faster)
bun run b:api:dev                # Backend with Bun
bun run b:client:dev             # Frontend with Bun
bun run b:test:client            # Tests with Bun
```

---

## Summary for AI Assistants

When working with LibreChat:

1. **Build order matters**: Always build packages in order (data-provider → data-schemas → api → client)
2. **Use correct state management**: React Query for server state, Jotai for global UI state
3. **Follow file organization**: Feature-based, colocated tests, barrel exports
4. **Respect the architecture**: Route → Controller → Service → Model
5. **Test your changes**: Run relevant tests before committing
6. **Use import aliases**: `~/` for cleaner imports
7. **Follow conventions**: PascalCase components, camelCase functions, UPPER_SNAKE_CASE constants
8. **Check environment**: Ensure MongoDB, Redis running for full functionality
9. **Rebuild packages**: After modifying shared packages, rebuild and restart frontend
10. **Accessibility first**: Semantic HTML, ARIA labels, keyboard navigation

**Most common workflow**:
```bash
# Make changes
# If packages modified: npm run build:packages
npm run test:api          # Test backend
npm run test:client       # Test frontend
npm run lint:fix          # Fix linting issues
git add .
git commit -m "feat: description"
git push -u origin <branch>
```

---

**Document maintained by**: AI Assistant
**For questions or updates**: Create an issue or discussion on GitHub
