/**
 * Judge0 Code Execution Tool for LibreChat
 *
 * Replaces the LibreChat Code Interpreter with Judge0 integration
 * Provides code execution in 70+ programming languages
 */

const { z } = require('zod');
const { DynamicStructuredTool } = require('@langchain/core/tools');
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
 * @returns {DynamicStructuredTool} LangChain structured tool
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

  // Define Zod schema for input validation
  const schema = z.object({
    code: z
      .string()
      .max(65000)
      .describe(
        'The source code to execute. Maximum 65KB. Can be any of 70+ supported programming languages.',
      ),
    language: z
      .string()
      .optional()
      .describe(
        'Programming language of the code (e.g., "python", "javascript", "java", "cpp", "go", "rust"). If not specified, will attempt auto-detection.',
      ),
    stdin: z
      .string()
      .optional()
      .describe('Standard input to provide to the program during execution.'),
    timeout: z
      .number()
      .min(1)
      .max(15)
      .optional()
      .default(5)
      .describe('Maximum execution time in seconds. Default is 5 seconds. Maximum is 15.'),
  });

  // Create LangChain DynamicStructuredTool
  const tool = new DynamicStructuredTool({
    name: 'execute_code',
    description:
      'Execute code in 70+ programming languages including Python, JavaScript, Java, C++, Go, Rust, and more. Returns execution output, errors, execution time, and memory usage.',
    schema,
    func: async ({ code, language, stdin, timeout }) => {
      try {
        logger.debug(`[Judge0Tool] Executing code for user ${user_id}`);

        // Auto-detect language if not provided
        let languageId;
        if (language) {
          languageId = getLanguageId(language);
          if (!languageId) {
            return formatError(`Unsupported language: ${language}`);
          }
        } else {
          languageId = detectLanguage(code);
          if (!languageId) {
            languageId = 71; // Default to Python
          }
        }

        const detectedLanguage = getLanguageName(languageId);

        // Execute code
        const result = await judge0.execute({
          code,
          language: languageId,
          stdin: stdin || '',
          timeout: timeout || 5,
          memory: 128000,
        });

        // Format and return output
        return formatOutput(result, detectedLanguage);
      } catch (error) {
        logger.error('[Judge0Tool] Execution error:', error);
        return formatError(`Execution failed: ${error.message}`);
      }
    },
  });

  // Attach apiKey for LibreChat's credential system
  tool.apiKey = apiKey;

  return tool;
}

/**
 * Format successful execution output
 * @param {Object} result - Judge0 execution result
 * @param {string} language - Programming language name
 * @returns {string} Formatted output
 */
function formatOutput(result, language) {
  if (result.success) {
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
    // Error output
    const emoji =
      {
        'Compilation Error': '❌',
        'Runtime Error': '⚠️',
        'Time Limit Exceeded': '⏱️',
        'Memory Limit Exceeded': '💾',
      }[result.status] || '❌';

    let output = `${emoji} **${result.status}**\n\n`;
    output += `**Language:** ${language}\n\n`;

    if (result.error) {
      output += `**Error:**\n\`\`\`\n${result.error}\n\`\`\`\n\n`;
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
 * Format error message
 * @param {string} message - Error message
 * @returns {string} Formatted error
 */
function formatError(message) {
  return `❌ **Error**\n\n${message}`;
}

module.exports = { createJudge0ExecutionTool };
