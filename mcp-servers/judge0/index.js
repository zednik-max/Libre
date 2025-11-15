#!/usr/bin/env node

/**
 * Judge0 MCP Server for LibreChat
 *
 * Provides code execution capabilities for 70+ programming languages
 * using the Judge0 CE API via Model Context Protocol (MCP)
 *
 * @see https://www.librechat.ai/docs/features/mcp
 * @see https://ce.judge0.com/
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Judge0Client } from './lib/judge0-client.js';
import {
  detectLanguage,
  getLanguageId,
  getSupportedLanguages,
  LANGUAGE_INFO,
} from './lib/languages.js';

// Configuration from environment variables
const config = {
  apiKey: process.env.RAPIDAPI_KEY || process.env.JUDGE0_API_KEY,
  baseURL: process.env.JUDGE0_BASE_URL,
  selfHosted: !!process.env.JUDGE0_BASE_URL,
};

// Validate configuration
if (!config.apiKey && !config.selfHosted) {
  console.error('ERROR: RAPIDAPI_KEY or JUDGE0_API_KEY environment variable is required');
  console.error('Get your key at: https://rapidapi.com/judge0-official/api/judge0-ce');
  process.exit(1);
}

// Initialize Judge0 client
const judge0 = new Judge0Client(config);

// Create MCP server
const server = new Server(
  {
    name: 'judge0-code-executor',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Tool definitions
 */
const TOOLS = [
  {
    name: 'execute_code',
    description:
      'Execute code in 70+ programming languages including Python, JavaScript, Java, C++, Go, Rust, and many more. ' +
      'Automatically detects the programming language or you can specify it explicitly. ' +
      'Returns the output, errors, execution time, and memory usage.',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'The source code to execute',
        },
        language: {
          type: 'string',
          description:
            'Programming language (optional, will auto-detect if not specified). ' +
            'Examples: python, javascript, java, cpp, go, rust, php, ruby, swift, kotlin, bash, etc.',
        },
        stdin: {
          type: 'string',
          description: 'Standard input for the program (optional)',
        },
        timeout: {
          type: 'number',
          description: 'CPU time limit in seconds (default: 5, max: 15)',
        },
      },
      required: ['code'],
    },
  },
  {
    name: 'list_languages',
    description:
      'List all 70+ supported programming languages with their aliases and IDs. ' +
      'Use this to discover what languages are available for code execution.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'execute_python',
    description:
      'Execute Python 3 code. Convenient shortcut for Python execution without specifying language.',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Python code to execute',
        },
        stdin: {
          type: 'string',
          description: 'Standard input (optional)',
        },
      },
      required: ['code'],
    },
  },
  {
    name: 'execute_javascript',
    description:
      'Execute JavaScript (Node.js) code. Convenient shortcut for JavaScript execution.',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'JavaScript code to execute',
        },
        stdin: {
          type: 'string',
          description: 'Standard input (optional)',
        },
      },
      required: ['code'],
    },
  },
];

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

/**
 * Execute code tool handler
 */
async function handleExecuteCode(args) {
  const { code, language, stdin, timeout } = args;

  // Detect or validate language
  let languageId;
  if (language) {
    languageId = getLanguageId(language);
    if (!languageId) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Unsupported language: "${language}"\n\nUse the 'list_languages' tool to see all supported languages.`,
          },
        ],
        isError: true,
      };
    }
  } else {
    // Auto-detect language
    languageId = detectLanguage(code);
    if (!languageId) {
      return {
        content: [
          {
            type: 'text',
            text:
              '❌ Could not auto-detect programming language.\n\n' +
              'Please specify the language explicitly using the "language" parameter.\n' +
              'Example: language: "python" or language: "javascript"\n\n' +
              'Use the "list_languages" tool to see all supported languages.',
          },
        ],
        isError: true,
      };
    }
  }

  // Execute code
  const result = await judge0.execute({
    code,
    language: languageId,
    stdin: stdin || '',
    timeout: timeout && timeout <= 15 ? timeout : 5,
  });

  // Format response
  if (result.success) {
    let response = `✅ **Execution Successful**\n\n`;
    response += `**Language:** ${LANGUAGE_INFO[languageId]?.name || `ID ${languageId}`}\n`;

    if (result.output) {
      response += `\n**Output:**\n\`\`\`\n${result.output}\n\`\`\`\n`;
    }

    if (result.executionTime !== null) {
      response += `\n**Performance:**\n`;
      response += `- Execution time: ${result.executionTime.toFixed(3)}s\n`;
      response += `- Memory used: ${(result.memory / 1024).toFixed(2)} MB\n`;
    }

    return {
      content: [
        {
          type: 'text',
          text: response,
        },
      ],
    };
  } else {
    let response = `❌ **Execution Failed**\n\n`;
    response += `**Language:** ${LANGUAGE_INFO[languageId]?.name || `ID ${languageId}`}\n`;
    response += `**Status:** ${result.status}\n\n`;

    if (result.error) {
      response += `**Error:**\n\`\`\`\n${result.error}\n\`\`\`\n`;
    }

    return {
      content: [
        {
          type: 'text',
          text: response,
        },
      ],
      isError: true,
    };
  }
}

/**
 * List languages tool handler
 */
function handleListLanguages() {
  const languages = getSupportedLanguages();

  let response = `# Supported Programming Languages (${languages.length})\n\n`;

  // Group by category
  const categories = {
    'Popular Languages': ['Python', 'JavaScript', 'TypeScript', 'Java', 'C', 'C++', 'C#', 'Go', 'Rust'],
    'Web & Scripting': ['PHP', 'Ruby', 'Perl', 'Bash', 'Lua'],
    'Functional': ['Haskell', 'Clojure', 'Elixir', 'Erlang', 'OCaml', 'F#', 'Lisp'],
    'Mobile & Modern': ['Swift', 'Kotlin', 'Objective-C'],
    'Data & Statistics': ['R', 'SQL'],
    'Systems & Low-Level': ['Assembly', 'D', 'Fortran'],
    'JVM & Enterprise': ['Scala', 'Groovy'],
    'Other': [],
  };

  for (const [category, categoryLangs] of Object.entries(categories)) {
    const matched = languages.filter((l) => categoryLangs.includes(l.name));
    if (matched.length === 0 && category === 'Other') {
      // Skip empty "Other" category
      continue;
    }

    if (matched.length > 0 || category === 'Other') {
      response += `\n## ${category}\n\n`;

      const langsToShow = matched.length > 0
        ? matched
        : languages.filter((l) => !Object.values(categories).flat().includes(l.name));

      for (const lang of langsToShow) {
        response += `- **${lang.name}** (ID: ${lang.id})\n`;
        response += `  - Aliases: ${lang.aliases.join(', ')}\n`;
      }
    }
  }

  response += `\n\n**Usage Example:**\n`;
  response += `\`\`\`json\n`;
  response += `{\n`;
  response += `  "code": "print('Hello, World!')",\n`;
  response += `  "language": "python"\n`;
  response += `}\n`;
  response += `\`\`\`\n`;

  return {
    content: [
      {
        type: 'text',
        text: response,
      },
    ],
  };
}

/**
 * Handle tool execution
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'execute_code':
        return await handleExecuteCode(args);

      case 'execute_python':
        return await handleExecuteCode({ ...args, language: 'python' });

      case 'execute_javascript':
        return await handleExecuteCode({ ...args, language: 'javascript' });

      case 'list_languages':
        return handleListLanguages();

      default:
        return {
          content: [
            {
              type: 'text',
              text: `❌ Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    console.error(`Error executing tool ${name}:`, error);
    return {
      content: [
        {
          type: 'text',
          text: `❌ Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Start the server
 */
async function main() {
  console.error('Judge0 MCP Server starting...');

  // Check API health
  const isHealthy = await judge0.checkHealth();
  if (!isHealthy) {
    console.error('WARNING: Cannot connect to Judge0 API. Check your configuration.');
  } else {
    console.error('✓ Connected to Judge0 API successfully');
  }

  console.error(`✓ Supports 70+ programming languages`);
  console.error(`✓ Ready to execute code via MCP`);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Judge0 MCP Server running');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
