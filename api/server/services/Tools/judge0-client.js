/**
 * Judge0 CE API Client
 *
 * Handles communication with Judge0 Code Execution API
 * Supports both RapidAPI and self-hosted deployments
 */

const axios = require('axios');
const { getLanguageId, getLanguageName } = require('./languages');
const { logger } = require('@librechat/data-schemas');

class Judge0Client {
  /**
   * @param {Object} config
   * @param {string} config.apiKey - RapidAPI key
   * @param {string} [config.baseURL] - Optional custom Judge0 endpoint
   * @param {boolean} [config.selfHosted] - Whether using self-hosted Judge0
   */
  constructor(config) {
    this.apiKey = config.apiKey;
    this.selfHosted = config.selfHosted || false;

    // Default to RapidAPI unless self-hosted URL provided
    if (config.baseURL) {
      this.baseURL = config.baseURL;
      this.selfHosted = true;
    } else {
      this.baseURL = 'https://judge0-ce.p.rapidapi.com';
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 seconds
      headers: this.selfHosted
        ? {
            'Content-Type': 'application/json',
          }
        : {
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': this.apiKey,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
          },
    });
  }

  /**
   * Execute code and wait for result
   * @param {Object} params
   * @param {string} params.code - Source code to execute
   * @param {string|number} params.language - Language name or ID
   * @param {string} [params.stdin] - Standard input
   * @param {number} [params.timeout] - CPU time limit in seconds (default: 5)
   * @param {number} [params.memory] - Memory limit in KB (default: 128000)
   * @returns {Promise<ExecutionResult>}
   */
  async execute({ code, language, stdin = '', timeout = 5, memory = 128000 }) {
    // Get language ID
    let languageId;
    if (typeof language === 'number') {
      languageId = language;
    } else {
      languageId = getLanguageId(language);
      if (!languageId) {
        throw new Error(`Unsupported language: ${language}`);
      }
    }

    try {
      // Submit code for execution
      const submission = {
        source_code: code,
        language_id: languageId,
        stdin: stdin || '',
        cpu_time_limit: timeout,
        memory_limit: memory,
      };

      logger.debug(`[Judge0] Executing ${getLanguageName(languageId)} code...`);

      const response = await this.client.post('/submissions', submission, {
        params: {
          base64_encoded: false,
          wait: true, // Wait for execution to complete
          fields: '*', // Return all fields
        },
      });

      return this.formatResult(response.data);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Format execution result for LibreChat
   * @param {Object} data - Judge0 response data
   * @returns {ExecutionResult}
   */
  formatResult(data) {
    const status = data.status?.description || 'Unknown';
    const statusId = data.status?.id;

    // Status IDs:
    // 1-2: In Queue/Processing
    // 3: Accepted (success)
    // 4: Wrong Answer
    // 5: Time Limit Exceeded
    // 6: Compilation Error
    // 7-14: Various runtime errors

    const result = {
      success: statusId === 3,
      status: status,
      statusId: statusId,
      output: null,
      error: null,
      executionTime: data.time ? parseFloat(data.time) : null,
      memory: data.memory || null,
      stdout: data.stdout || null,
      stderr: data.stderr || null,
      compileOutput: data.compile_output || null,
      message: data.message || null,
    };

    // Determine what to show based on status
    if (statusId === 3) {
      // Accepted - show output
      result.output = data.stdout || '(no output)';
    } else if (statusId === 6) {
      // Compilation Error
      result.error = `Compilation Error:\n${data.compile_output || data.stderr || 'Unknown compilation error'}`;
    } else if (data.stderr) {
      // Runtime Error
      result.error = `Runtime Error (${status}):\n${data.stderr}`;
    } else if (data.message) {
      // Other errors with message
      result.error = `Error (${status}): ${data.message}`;
    } else {
      // Other status
      result.error = `Execution ${status}`;
    }

    return result;
  }

  /**
   * Handle API errors
   * @param {Error} error - Axios error
   * @returns {ExecutionResult}
   */
  handleError(error) {
    logger.error('[Judge0] Error:', error.message);

    let errorMessage = 'Code execution failed';

    if (error.response) {
      // API returned an error
      const status = error.response.status;
      const data = error.response.data;

      if (status === 401 || status === 403) {
        errorMessage = 'Authentication failed. Check your Judge0 API key.';
      } else if (status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later or use a self-hosted Judge0 instance.';
      } else if (data?.message) {
        errorMessage = `Judge0 API error: ${data.message}`;
      } else {
        errorMessage = `Judge0 API error (${status})`;
      }
    } else if (error.request) {
      // No response received
      errorMessage = 'Cannot connect to Judge0 API. Check your internet connection.';
    } else {
      // Other errors
      errorMessage = error.message;
    }

    return {
      success: false,
      status: 'Error',
      statusId: -1,
      output: null,
      error: errorMessage,
      executionTime: null,
      memory: null,
      stdout: null,
      stderr: null,
      compileOutput: null,
      message: errorMessage,
    };
  }

  /**
   * Get list of supported languages from Judge0 API
   * @returns {Promise<Array>}
   */
  async getLanguages() {
    try {
      const response = await this.client.get('/languages');
      return response.data;
    } catch (error) {
      logger.error('[Judge0] Failed to fetch languages:', error.message);
      return [];
    }
  }

  /**
   * Check API health and authentication
   * @returns {Promise<boolean>}
   */
  async checkHealth() {
    try {
      // Try to get languages as a health check
      const languages = await this.getLanguages();
      return languages.length > 0;
    } catch (error) {
      return false;
    }
  }
}

/**
 * @typedef {Object} ExecutionResult
 * @property {boolean} success - Whether execution was successful
 * @property {string} status - Human-readable status
 * @property {number} statusId - Judge0 status ID
 * @property {string|null} output - Standard output (if successful)
 * @property {string|null} error - Error message (if failed)
 * @property {number|null} executionTime - CPU time in seconds
 * @property {number|null} memory - Memory used in KB
 * @property {string|null} stdout - Raw stdout
 * @property {string|null} stderr - Raw stderr
 * @property {string|null} compileOutput - Compilation output
 * @property {string|null} message - Additional message
 */

module.exports = { Judge0Client };
