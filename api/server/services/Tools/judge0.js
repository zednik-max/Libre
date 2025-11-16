/**
 * Judge0 Code Execution Tool for LibreChat
 *
 * Replaces the LibreChat Code Interpreter with Judge0 integration
 * Provides code execution in 70+ programming languages
 */

const { logger } = require('@librechat/data-schemas');
const { Judge0Client } = require('./judge0-client');
const { detectLanguage, getLanguageId, getLanguageName } = require('./languages');

/**
 * Create Judge0 execution tool compatible with LibreChat's tool interface
 * @param {Object} config
 * @param {string} config.user_id - User ID
 * @param {string} config.apiKey - RapidAPI key for Judge0
 * @param {string} [config.baseURL] - Optional custom Judge0 endpoint
 * @param {boolean} [config.selfHosted] - Whether using self-hosted Judge0
 * @returns {Object} Tool object with invoke method
 */
function createJudge0ExecutionTool(config) {
  const { user_id, apiKey, baseURL, selfHosted } = config;

  if (!apiKey) {
    logger.error('[Judge0Tool] API key is required');
    throw new Error('Judge0 API key is required');
  }

  // Create Judge0 client
  const judge0 = new Judge0Client({
    apiKey,
    baseURL,
    selfHosted,
  });

  logger.debug(`[Judge0Tool] Created for user ${user_id}`);

  // Return tool object matching LibreChat's expected interface
  return {
    // Top-level metadata (required by LangChain/LibreChat)
    name: 'execute_code',
    description:
      'Execute code in 70+ programming languages including Python, JavaScript, Java, C++, Go, Rust, and more. Returns execution output, errors, execution time, and memory usage.',

    // API key (required by LibreChat)
    apiKey,

    // Tool metadata for function calling (OpenAI/Anthropic format)
    type: 'function',
    function: {
      name: 'execute_code',
      description:
        'Execute code in 70+ programming languages including Python, JavaScript, Java, C++, Go, Rust, and more. Returns execution output, errors, execution time, and memory usage.',
      parameters: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description:
              'The source code to execute. Maximum 65KB. Can be any of 70+ supported programming languages.',
          },
          language: {
            type: 'string',
            description:
              'Programming language of the code (e.g., "python", "javascript", "java", "cpp", "go", "rust"). If not specified, will attempt auto-detection.',
          },
          stdin: {
            type: 'string',
            description: 'Standard input to provide to the program during execution (optional).',
          },
          timeout: {
            type: 'number',
            description: 'Maximum execution time in seconds. Default is 5 seconds. Maximum is 15.',
          },
        },
        required: ['code'],
      },
    },

    /**
     * Invoke the tool to execute code
     * @param {Object} params
     * @param {Object} params.args - Tool arguments
     * @param {string} params.args.code - Source code to execute
     * @param {string} [params.args.language] - Programming language
     * @param {string} [params.args.stdin] - Standard input
     * @param {number} [params.args.timeout] - Timeout in seconds
     * @param {string} params.name - Tool name
     * @param {string} params.id - Tool call ID
     * @param {string} params.type - Tool call type
     * @returns {Promise<{content: string, artifact?: Object}>}
     */
    async invoke({ args, name, id, type }) {
      try {
        logger.debug(`[Judge0Tool] Invoked: ${name} (${id})`);

        const { code, language, stdin, timeout } = args;

        // Validate input
        if (!code || typeof code !== 'string') {
          return {
            content: formatError('No code provided or invalid code format'),
          };
        }

        if (code.length > 65000) {
          return {
            content: formatError('Code exceeds maximum size (65KB)'),
          };
        }

        // Auto-detect language if not provided
        let languageId;
        if (language) {
          languageId = getLanguageId(language);
          if (!languageId) {
            return {
              content: formatError(`Unsupported language: ${language}`),
            };
          }
        } else {
          languageId = detectLanguage(code);
          if (!languageId) {
            // Default to Python if detection fails
            logger.debug('[Judge0Tool] Language detection failed, defaulting to Python');
            languageId = 71; // Python
          }
        }

        const detectedLanguage = getLanguageName(languageId);
        logger.debug(`[Judge0Tool] Executing ${detectedLanguage} code (${code.length} chars)`);

        // Execute code
        const result = await judge0.execute({
          code,
          language: languageId,
          stdin: stdin || '',
          timeout: timeout || 5,
          memory: 128000,
        });

        // Format response
        const content = formatOutput(result, detectedLanguage);

        // Return in LibreChat's expected format
        return {
          content,
          // Note: artifact for file outputs can be added in future
          // artifact: { files: [], session_id: '' }
        };
      } catch (error) {
        logger.error('[Judge0Tool] Execution error:', error);
        return {
          content: formatError(`Execution failed: ${error.message}`),
        };
      }
    },
  };
}

/**
 * Format successful or failed execution output for display
 * @param {Object} result - Judge0 execution result
 * @param {string} language - Detected language name
 * @returns {string} Formatted output
 */
function formatOutput(result, language) {
  if (result.success) {
    // Successful execution
    let output = `✅ **Code Executed Successfully**\n\n`;
    output += `**Language:** ${language}\n\n`;
    output += `**Output:**\n\`\`\`\n${result.output || '(no output)'}\n\`\`\`\n\n`;

    if (result.executionTime !== null) {
      output += `⏱️ **Time:** ${result.executionTime.toFixed(3)}s`;
    }
    if (result.memory !== null) {
      output += ` | 💾 **Memory:** ${(result.memory / 1024).toFixed(2)} MB`;
    }

    return output;
  } else {
    // Execution failed
    const statusEmoji = {
      'Compilation Error': '❌',
      'Runtime Error': '⚠️',
      'Time Limit Exceeded': '⏱️',
      'Memory Limit Exceeded': '💾',
      'Wrong Answer': '❓',
      'Internal Error': '🔴',
    };

    const emoji = statusEmoji[result.status] || '❌';

    let output = `${emoji} **${result.status}**\n\n`;
    output += `**Language:** ${language}\n\n`;

    if (result.error) {
      output += `**Error:**\n\`\`\`\n${result.error}\n\`\`\`\n\n`;
    }

    if (result.stdout) {
      output += `**Output:**\n\`\`\`\n${result.stdout}\n\`\`\`\n\n`;
    }

    if (result.executionTime !== null) {
      output += `⏱️ **Time:** ${result.executionTime.toFixed(3)}s`;
    }
    if (result.memory !== null) {
      output += ` | 💾 **Memory:** ${(result.memory / 1024).toFixed(2)} MB`;
    }

    return output;
  }
}

/**
 * Format error messages for display
 * @param {string} message - Error message
 * @returns {string} Formatted error
 */
function formatError(message) {
  return `❌ **Error**\n\n${message}`;
}

module.exports = {
  createJudge0ExecutionTool,
};
