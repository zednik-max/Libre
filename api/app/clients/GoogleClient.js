const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { sleep } = require('@librechat/agents');
const { logger } = require('@librechat/data-schemas');
const { getModelMaxTokens } = require('@librechat/api');
const { concat } = require('@langchain/core/utils/stream');
const { ChatVertexAI } = require('@langchain/google-vertexai');
const { Tokenizer, getSafetySettings } = require('@librechat/api');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const {
  GoogleGenerativeAI: GenAI,
  GoogleAIFileManager,
} = require('@google/generative-ai');
const {
  googleGenConfigSchema,
  validateVisionModel,
  getResponseSender,
  endpointSettings,
  parseTextParts,
  EModelEndpoint,
  googleSettings,
  ContentTypes,
  VisionModes,
  ErrorTypes,
  Constants,
  CacheKeys,
  AuthKeys,
} = require('librechat-data-provider');
const { encodeAndFormat } = require('~/server/services/Files/images');
const { spendTokens } = require('~/models/spendTokens');
const { getVertexAIModelName, getMultiplier } = require('~/models/tx');
const { getLogStores } = require('~/cache');
const {
  formatMessage,
  createContextHandlers,
  titleInstruction,
  truncateText,
} = require('./prompts');
const BaseClient = require('./BaseClient');

/**
 * Supported Vertex AI locations
 * See: https://cloud.google.com/vertex-ai/docs/general/locations
 */
const SUPPORTED_LOCATIONS = [
  'us-central1',
  'us-east1',
  'us-east4',
  'us-west1',
  'us-west2',
  'us-west4',
  'europe-west1',
  'europe-west2',
  'europe-west3',
  'europe-west4',
  'europe-north1',
  'asia-east1',
  'asia-northeast1',
  'asia-northeast3',
  'asia-southeast1',
  'asia-south1',
  'australia-southeast1',
  'northamerica-northeast1',
  'southamerica-east1',
  'global',
];

/**
 * Get validated location from environment or default
 * @returns {string} Valid Vertex AI location
 */
function getVertexLocation() {
  const envLoc = process.env.GOOGLE_LOC;
  if (envLoc && SUPPORTED_LOCATIONS.includes(envLoc)) {
    return envLoc;
  }
  if (envLoc) {
    logger.warn(
      `[GoogleClient] Invalid GOOGLE_LOC '${envLoc}'. Supported locations: ${SUPPORTED_LOCATIONS.join(', ')}. Defaulting to 'us-central1'.`,
    );
  }
  return 'us-central1';
}

const loc = getVertexLocation();
const endpointPrefix =
  loc === 'global' ? 'aiplatform.googleapis.com' : `${loc}-aiplatform.googleapis.com`;

const settings = endpointSettings[EModelEndpoint.google];

/**
 * Model configuration for Google/Vertex AI models
 * This replaces fragile regex patterns with a maintainable configuration
 */
const MODEL_CONFIG = {
  // Modern Gemini models (use GenAI SDK)
  'gemini-2.0-flash-exp': { type: 'genai', capabilities: ['vision', 'thinking'] },
  'gemini-1.5-pro-latest': { type: 'genai', capabilities: ['vision', 'thinking'] },
  'gemini-1.5-pro': { type: 'genai', capabilities: ['vision', 'thinking'] },
  'gemini-1.5-flash-latest': { type: 'genai', capabilities: ['vision'] },
  'gemini-1.5-flash': { type: 'genai', capabilities: ['vision'] },
  'gemini-1.5-flash-8b': { type: 'genai', capabilities: ['vision'] },
  'learnlm-1.5-pro-experimental': { type: 'genai', capabilities: ['vision'] },
  'gemma-2-9b-it': { type: 'genai', capabilities: [] },
  'gemma-2-27b-it': { type: 'genai', capabilities: [] },

  // Legacy models (excluded from GenAI SDK)
  'gemini-1.0-pro': { type: 'legacy', capabilities: [] },
  'gemini-1.0-pro-latest': { type: 'legacy', capabilities: [] },
  'gemini-1-0-pro': { type: 'legacy', capabilities: [] },
  'gemini-pro': { type: 'legacy', capabilities: [] },
  'gemini-pro-vision': { type: 'legacy', capabilities: ['vision'] },
};

/**
 * Model Garden publisher prefixes for Vertex AI
 */
const MODEL_GARDEN_PUBLISHERS = [
  'meta', // Meta Llama models
  'mistral-ai', // Mistral models
  'mistralai', // Alternative Mistral prefix
  'anthropic', // Claude via Vertex
  'cohere', // Cohere models
  'ai21', // AI21 Labs
];

/**
 * Check if a model is a GenerativeAI model (uses GenAI SDK)
 * @param {string} modelName - The model name to check
 * @returns {boolean} - True if model uses GenAI SDK
 */
function isGenerativeModel(modelName) {
  if (!modelName) {
    return false;
  }

  // Check exact match in config
  if (MODEL_CONFIG[modelName]) {
    return MODEL_CONFIG[modelName].type === 'genai';
  }

  // Fallback: Check if model name contains known GenAI patterns
  // This handles versioned models like "gemini-1.5-pro-002"
  const genaiPatterns = ['gemini-1.5', 'gemini-2', 'learnlm', 'gemma'];
  const legacyPatterns = ['gemini-1.0', 'gemini-1-0', 'gemini-pro'];

  // Check for legacy patterns first (more specific)
  for (const pattern of legacyPatterns) {
    if (modelName.includes(pattern)) {
      return false;
    }
  }

  // Then check for GenAI patterns
  for (const pattern of genaiPatterns) {
    if (modelName.includes(pattern)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a model is excluded from GenAI SDK (legacy model)
 * @param {string} modelName - The model name to check
 * @returns {boolean} - True if model is legacy
 */
function isLegacyModel(modelName) {
  if (!modelName) {
    return false;
  }

  // Check exact match in config
  if (MODEL_CONFIG[modelName]) {
    return MODEL_CONFIG[modelName].type === 'legacy';
  }

  // Fallback: Check if model name matches legacy patterns
  return /gemini-(?:1\.0|1-0|pro)$/.test(modelName);
}

/**
 * Check if a model is from Vertex AI Model Garden
 * @param {string} modelName - The model name to check
 * @returns {boolean} - True if model is from Model Garden
 */
function isModelGardenModel(modelName) {
  if (!modelName) {
    return false;
  }

  // Check for Model Garden format: publishers/<publisher>/models/<model>
  // or just the publisher prefix
  for (const publisher of MODEL_GARDEN_PUBLISHERS) {
    if (modelName.startsWith(`publishers/${publisher}`) || modelName.startsWith(publisher)) {
      return true;
    }
  }

  return false;
}

/**
 * Get the publisher/provider for a model
 * @param {string} modelName - The model name
 * @returns {string} - The publisher name
 */
function getModelPublisher(modelName) {
  if (!modelName) {
    return 'google';
  }

  // Check for Model Garden format
  const publisherMatch = modelName.match(/^(?:publishers\/)?([^/]+)/);
  if (publisherMatch) {
    const publisher = publisherMatch[1];
    if (MODEL_GARDEN_PUBLISHERS.includes(publisher)) {
      return publisher;
    }
  }

  return 'google'; // Default to Google
}

/** Retry configuration for transient failures */
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  multiplier: 2,
  jitterFactor: 0.2,
  retryableStatusCodes: [429, 500, 502, 503, 504],
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'],
};

/**
 * File API configuration
 * Files larger than this threshold will use File API instead of inline base64
 */
const FILE_API_CONFIG = {
  inlineThresholdBytes: 10 * 1024 * 1024, // 10MB - use File API for files larger than this
  supportedMimeTypes: [
    // Images
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/heic',
    'image/heif',
    // Documents
    'application/pdf',
    'text/plain',
    'text/html',
    'text/css',
    'text/javascript',
    'text/markdown',
    // Audio
    'audio/wav',
    'audio/mp3',
    'audio/aiff',
    'audio/aac',
    'audio/ogg',
    'audio/flac',
    // Video
    'video/mp4',
    'video/mpeg',
    'video/mov',
    'video/avi',
    'video/x-flv',
    'video/mpg',
    'video/webm',
    'video/wmv',
    'video/3gpp',
  ],
};

/**
 * GCS (Google Cloud Storage) configuration for Vertex AI
 * Vertex AI can reference files stored in GCS buckets using gs:// URIs
 */
const GCS_CONFIG = {
  // GCS URI pattern: gs://bucket-name/path/to/file.ext
  uriPattern: /^gs:\/\/[a-z0-9][\w.-]{1,61}[a-z0-9]\/.+$/i,
  // Supported file types for GCS references
  supportedMimeTypes: [
    // Images
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/heic',
    'image/heif',
    'image/gif',
    // Documents
    'application/pdf',
    'text/plain',
    'text/html',
    'text/css',
    'text/javascript',
    'text/markdown',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Audio
    'audio/wav',
    'audio/mp3',
    'audio/mpeg',
    'audio/aiff',
    'audio/aac',
    'audio/ogg',
    'audio/flac',
    // Video
    'video/mp4',
    'video/mpeg',
    'video/mov',
    'video/avi',
    'video/x-flv',
    'video/mpg',
    'video/webm',
    'video/wmv',
    'video/3gpp',
  ],
};

class GoogleClient extends BaseClient {
  constructor(credentials, options = {}) {
    super('apiKey', options);
    let creds = {};

    if (typeof credentials === 'string') {
      creds = JSON.parse(credentials);
    } else if (credentials) {
      creds = credentials;
    }

    const serviceKey = creds[AuthKeys.GOOGLE_SERVICE_KEY] ?? {};
    this.serviceKey =
      serviceKey && typeof serviceKey === 'string' ? JSON.parse(serviceKey) : (serviceKey ?? {});
    /** @type {string | null | undefined} */
    this.project_id = this.serviceKey.project_id;
    this.client_email = this.serviceKey.client_email;
    this.private_key = this.serviceKey.private_key;
    this.access_token = null;

    this.apiKey = creds[AuthKeys.GOOGLE_API_KEY];

    this.reverseProxyUrl = options.reverseProxyUrl;

    this.authHeader = options.authHeader;

    /** @type {UsageMetadata | undefined} */
    this.usage;
    /** The key for the usage object's input tokens
     * @type {string} */
    this.inputTokensKey = 'input_tokens';
    /** The key for the usage object's output tokens
     * @type {string} */
    this.outputTokensKey = 'output_tokens';
    this.visionMode = VisionModes.generative;
    /** @type {string} */
    this.systemMessage;
    if (options.skipSetOptions) {
      return;
    }
    this.setOptions(options);
  }

  /* Google specific methods */
  constructUrl() {
    const modelPublisher = getModelPublisher(this.modelOptions.model);
    return `https://${endpointPrefix}/v1/projects/${this.project_id}/locations/${loc}/publishers/${modelPublisher}/models/${this.modelOptions.model}:serverStreamingPredict`;
  }

  async getClient() {
    const scopes = ['https://www.googleapis.com/auth/cloud-platform'];
    const jwtClient = new google.auth.JWT(this.client_email, null, this.private_key, scopes);

    jwtClient.authorize((err) => {
      if (err) {
        logger.error('jwtClient failed to authorize', err);
        throw err;
      }
    });

    return jwtClient;
  }

  async getAccessToken() {
    // Create cache key based on service account email
    const cacheKey = `${this.project_id}:${this.client_email}`;
    const cache = getLogStores(CacheKeys.VERTEX_ACCESS_TOKENS);

    try {
      // Check cache first
      const cachedToken = await cache.get(cacheKey);
      if (cachedToken) {
        logger.debug(`[GoogleClient] Using cached access token for project: ${this.project_id}`);
        return cachedToken;
      }
    } catch (cacheError) {
      logger.warn('[GoogleClient] Failed to read from access token cache', cacheError.message);
      // Continue to generate new token if cache fails
    }

    // Generate new token
    const scopes = ['https://www.googleapis.com/auth/cloud-platform'];
    const jwtClient = new google.auth.JWT(this.client_email, null, this.private_key, scopes);

    return new Promise((resolve, reject) => {
      jwtClient.authorize(async (err, tokens) => {
        if (err) {
          logger.error('jwtClient failed to authorize', err);
          reject(err);
        } else {
          // Cache the token for future use
          try {
            await cache.set(cacheKey, tokens.access_token);
            logger.debug(`[GoogleClient] Cached new access token for project: ${this.project_id}`);
          } catch (cacheError) {
            logger.warn('[GoogleClient] Failed to cache access token', cacheError.message);
            // Don't fail the request if caching fails
          }
          resolve(tokens.access_token);
        }
      });
    });
  }

  /**
   * Get or create GoogleAIFileManager instance
   * Only available for Google GenAI SDK (not Vertex AI)
   * @returns {GoogleAIFileManager | null}
   */
  getFileManager() {
    if (this.project_id) {
      // Vertex AI doesn't use GoogleAIFileManager
      // Files must be uploaded to Google Cloud Storage separately
      logger.debug('[GoogleClient] File API not available for Vertex AI - use Google Cloud Storage');
      return null;
    }

    if (!this.apiKey) {
      logger.warn('[GoogleClient] Cannot create file manager without API key');
      return null;
    }

    if (!this.fileManager) {
      this.fileManager = new GoogleAIFileManager(this.apiKey);
      logger.debug('[GoogleClient] Created GoogleAIFileManager instance');
    }

    return this.fileManager;
  }

  /**
   * Upload a file using Google AI File API
   * @param {object} file - File object with filepath, type, bytes
   * @returns {Promise<{uri: string, mimeType: string, name: string} | null>}
   */
  async uploadFileToAPI(file) {
    const fileManager = this.getFileManager();
    if (!fileManager) {
      logger.debug('[GoogleClient] File manager not available - falling back to inline');
      return null;
    }

    // Check if file is supported by File API
    if (!FILE_API_CONFIG.supportedMimeTypes.includes(file.type)) {
      logger.debug(`[GoogleClient] File type ${file.type} not supported by File API`);
      return null;
    }

    // Check if file exceeds inline threshold
    if (file.bytes && file.bytes < FILE_API_CONFIG.inlineThresholdBytes) {
      logger.debug(
        `[GoogleClient] File size ${file.bytes} bytes is below threshold - using inline`,
      );
      return null;
    }

    try {
      logger.info(`[GoogleClient] Uploading file to Google AI File API: ${file.filepath}`);

      // Upload file
      const uploadResult = await fileManager.uploadFile(file.filepath, {
        mimeType: file.type,
        displayName: file.filename || path.basename(file.filepath),
      });

      logger.info(
        `[GoogleClient] File uploaded successfully: ${uploadResult.file.name} (URI: ${uploadResult.file.uri})`,
      );

      // Track uploaded file for cleanup
      if (!this.uploadedFiles) {
        this.uploadedFiles = [];
      }
      this.uploadedFiles.push(uploadResult.file.name);

      return {
        uri: uploadResult.file.uri,
        mimeType: uploadResult.file.mimeType,
        name: uploadResult.file.name,
      };
    } catch (error) {
      logger.error('[GoogleClient] Failed to upload file to File API', {
        error: error.message,
        filepath: file.filepath,
      });
      return null;
    }
  }

  /**
   * Delete uploaded files from Google AI File API
   * @param {string[]} fileNames - Array of file names to delete
   */
  async deleteUploadedFiles(fileNames) {
    const fileManager = this.getFileManager();
    if (!fileManager || !fileNames || fileNames.length === 0) {
      return;
    }

    for (const fileName of fileNames) {
      try {
        await fileManager.deleteFile(fileName);
        logger.debug(`[GoogleClient] Deleted uploaded file: ${fileName}`);
      } catch (error) {
        logger.warn(`[GoogleClient] Failed to delete uploaded file: ${fileName}`, error.message);
      }
    }
  }

  /**
   * Check if a file path is a Google Cloud Storage URI
   * @param {string} filepath - The file path to check
   * @returns {boolean} True if the path is a GCS URI (gs://...)
   */
  isGcsUri(filepath) {
    if (!filepath || typeof filepath !== 'string') {
      return false;
    }
    return GCS_CONFIG.uriPattern.test(filepath);
  }

  /**
   * Create a GCS file reference for Vertex AI
   * Only works with Vertex AI (project_id must be set)
   * @param {object} file - File object with filepath and type
   * @returns {{fileUri: string, mimeType: string} | null}
   */
  handleGcsFileReference(file) {
    // GCS references only work with Vertex AI
    if (!this.project_id) {
      logger.debug('[GoogleClient] GCS file references require Vertex AI (project_id)');
      return null;
    }

    // Check if filepath is a GCS URI
    if (!this.isGcsUri(file.filepath)) {
      logger.debug(`[GoogleClient] File path is not a GCS URI: ${file.filepath}`);
      return null;
    }

    // Validate mime type
    if (!GCS_CONFIG.supportedMimeTypes.includes(file.type)) {
      logger.warn(`[GoogleClient] GCS file type ${file.type} may not be supported by Vertex AI`);
      // Don't return null - let Vertex AI handle unsupported types
    }

    logger.info(`[GoogleClient] Using GCS file reference for Vertex AI: ${file.filepath}`);

    return {
      fileUri: file.filepath, // gs://bucket/path/file
      mimeType: file.type,
    };
  }

  /* Required Client methods */
  setOptions(options) {
    if (this.options && !this.options.replaceOptions) {
      // nested options aren't spread properly, so we need to do this manually
      this.options.modelOptions = {
        ...this.options.modelOptions,
        ...options.modelOptions,
      };
      delete options.modelOptions;
      // now we can merge options
      this.options = {
        ...this.options,
        ...options,
      };
    } else {
      this.options = options;
    }

    this.modelOptions = this.options.modelOptions || {};

    this.options.attachments?.then((attachments) => this.checkVisionRequest(attachments));

    /** @type {boolean} Whether using a "GenerativeAI" Model */
    this.isGenerativeModel = isGenerativeModel(this.modelOptions.model);

    this.maxContextTokens =
      this.options.maxContextTokens ??
      getModelMaxTokens(this.modelOptions.model, EModelEndpoint.google);

    // The max prompt tokens is determined by the max context tokens minus the max response tokens.
    // Earlier messages will be dropped until the prompt is within the limit.
    this.maxResponseTokens = this.modelOptions.maxOutputTokens || settings.maxOutputTokens.default;

    if (this.maxContextTokens > 32000) {
      this.maxContextTokens = this.maxContextTokens - this.maxResponseTokens;
    }

    this.maxPromptTokens =
      this.options.maxPromptTokens || this.maxContextTokens - this.maxResponseTokens;

    if (this.maxPromptTokens + this.maxResponseTokens > this.maxContextTokens) {
      throw new Error(
        `maxPromptTokens + maxOutputTokens (${this.maxPromptTokens} + ${this.maxResponseTokens} = ${
          this.maxPromptTokens + this.maxResponseTokens
        }) must be less than or equal to maxContextTokens (${this.maxContextTokens})`,
      );
    }

    // Unified thinking configuration for both Google GenAI and Vertex AI
    // Google GenAI uses thinkingConfig.thinkingBudget (nested)
    // Vertex AI uses top-level thinkingBudget
    const thinkingBudgetValue =
      (this.modelOptions.thinking ?? googleSettings.thinking.default)
        ? this.modelOptions.thinkingBudget
        : 0;

    // Set nested format for Google GenAI
    this.modelOptions.thinkingConfig = {
      thinkingBudget: thinkingBudgetValue,
    };

    // Also set top-level format for Vertex AI
    this.modelOptions.thinkingBudget = thinkingBudgetValue;

    // Clean up the boolean flag
    delete this.modelOptions.thinking;

    this.sender =
      this.options.sender ??
      getResponseSender({
        model: this.modelOptions.model,
        endpoint: EModelEndpoint.google,
        modelLabel: this.options.modelLabel,
      });

    this.userLabel = this.options.userLabel || 'User';
    this.modelLabel = this.options.modelLabel || 'Assistant';

    if (this.options.reverseProxyUrl) {
      this.completionsUrl = this.options.reverseProxyUrl;
    } else {
      this.completionsUrl = this.constructUrl();
    }

    let promptPrefix = (this.options.promptPrefix ?? '').trim();
    if (typeof this.options.artifactsPrompt === 'string' && this.options.artifactsPrompt) {
      promptPrefix = `${promptPrefix ?? ''}\n${this.options.artifactsPrompt}`.trim();
    }
    this.systemMessage = promptPrefix;
    this.initializeClient();
    return this;
  }

  /**
   *
   * Checks if the model is a vision model based on request attachments and sets the appropriate options:
   * @param {MongoFile[]} attachments
   */
  checkVisionRequest(attachments) {
    /* Validation vision request */
    this.defaultVisionModel =
      this.options.visionModel ??
      (!isLegacyModel(this.modelOptions.model)
        ? this.modelOptions.model
        : 'gemini-pro-vision');
    const availableModels = this.options.modelsConfig?.[EModelEndpoint.google];
    this.isVisionModel = validateVisionModel({ model: this.modelOptions.model, availableModels });

    if (
      attachments &&
      attachments.some((file) => file?.type && file?.type?.includes('image')) &&
      availableModels?.includes(this.defaultVisionModel) &&
      !this.isVisionModel
    ) {
      this.modelOptions.model = this.defaultVisionModel;
      this.isVisionModel = true;
    }

    if (this.isVisionModel && !attachments && this.modelOptions.model.includes('gemini-pro')) {
      this.modelOptions.model = 'gemini-pro';
      this.isVisionModel = false;
    }
  }

  formatMessages() {
    return ((message) => {
      const msg = {
        author: message?.author ?? (message.isCreatedByUser ? this.userLabel : this.modelLabel),
        content: message?.content ?? message.text,
      };

      if (!message.image_urls?.length) {
        return msg;
      }

      msg.content = (
        !Array.isArray(msg.content)
          ? [
              {
                type: ContentTypes.TEXT,
                [ContentTypes.TEXT]: msg.content,
              },
            ]
          : msg.content
      ).concat(message.image_urls);

      return msg;
    }).bind(this);
  }

  /**
   * Formats messages for generative AI with File API and GCS support
   * - Gemini API: Uses File API for large files (>10MB) or inline base64
   * - Vertex AI: Supports GCS URIs (gs://...) or inline base64
   * @param {TMessage[]} messages
   * @returns
   */
  async formatGenerativeMessages(messages) {
    const formattedMessages = [];
    const attachments = await this.options.attachments;
    const latestMessage = { ...messages[messages.length - 1] };

    // Process files for File API (Gemini API) or GCS references (Vertex AI)
    const uploadedFileData = [];
    if (attachments && attachments.length > 0) {
      for (const file of attachments) {
        // Skip if file is embedded (RAG/context file)
        if (file.embedded || file.metadata?.fileIdentifier) {
          continue;
        }

        // Strategy 1: Check for GCS URI (Vertex AI only)
        const gcsReference = this.handleGcsFileReference(file);
        if (gcsReference) {
          uploadedFileData.push({
            fileData: gcsReference,
            source: 'gcs',
          });
          logger.debug(
            `[GoogleClient] Using GCS reference for Vertex AI: ${file.filename || file.filepath}`,
          );
          continue; // Skip to next file
        }

        // Strategy 2: Try File API upload (Gemini API only, for large files)
        const uploadedFile = await this.uploadFileToAPI(file);
        if (uploadedFile) {
          uploadedFileData.push({
            fileData: {
              fileUri: uploadedFile.uri,
              mimeType: uploadedFile.mimeType,
            },
            source: 'file-api',
            uploaded: true,
          });
          logger.debug(`[GoogleClient] Using File API for: ${file.filename || file.filepath}`);
          continue; // Skip to next file
        }

        // Strategy 3: Fall back to inline base64 (handled by addImageURLs below)
        logger.debug(
          `[GoogleClient] Will use inline base64 for: ${file.filename || file.filepath}`,
        );
      }
    }

    // Add inline images for files not handled by File API or GCS
    const files = await this.addImageURLs(latestMessage, attachments, VisionModes.generative);
    this.options.attachments = files;
    messages[messages.length - 1] = latestMessage;

    for (const _message of messages) {
      const role = _message.isCreatedByUser ? this.userLabel : this.modelLabel;
      const parts = [];
      parts.push({ text: _message.text });

      // Add File API/GCS uploaded files (only for the latest message)
      if (_message === latestMessage && uploadedFileData.length > 0) {
        for (const fileData of uploadedFileData) {
          parts.push(fileData);
        }
      }

      // Add inline data for images
      if (_message.image_urls?.length) {
        for (const images of _message.image_urls) {
          if (images.inlineData) {
            parts.push({ inlineData: images.inlineData });
          }
        }
      }

      formattedMessages.push({ role, parts });
    }

    return formattedMessages;
  }

  /**
   *
   * Adds image URLs to the message object and returns the files
   *
   * @param {TMessage[]} messages
   * @param {MongoFile[]} files
   * @returns {Promise<MongoFile[]>}
   */
  async addImageURLs(message, attachments, mode = '') {
    const { files, image_urls } = await encodeAndFormat(
      this.options.req,
      attachments,
      {
        endpoint: EModelEndpoint.google,
      },
      mode,
    );
    message.image_urls = image_urls.length ? image_urls : undefined;
    return files;
  }

  /**
   * Builds the augmented prompt for attachments
   *
   * File Handling Strategies:
   * - Gemini API: Large files (>10MB) use File API, small files use inline base64
   * - Vertex AI: Supports GCS URIs (gs://bucket/path/file) or inline base64
   *
   * To use GCS with Vertex AI:
   * 1. Upload file to your GCS bucket
   * 2. Pass filepath as "gs://your-bucket/path/to/file.pdf"
   * 3. Ensure Vertex AI service account has storage.objects.get permission
   *
   * @param {TMessage[]} messages
   */
  async buildAugmentedPrompt(messages = []) {
    const attachments = await this.options.attachments;
    const latestMessage = { ...messages[messages.length - 1] };
    this.contextHandlers = createContextHandlers(this.options.req, latestMessage.text);

    if (this.contextHandlers) {
      for (const file of attachments) {
        if (file.embedded) {
          this.contextHandlers?.processFile(file);
          continue;
        }
        if (file.metadata?.fileIdentifier) {
          continue;
        }
      }

      this.augmentedPrompt = await this.contextHandlers.createContext();
      this.systemMessage = this.augmentedPrompt + this.systemMessage;
    }
  }

  async buildVisionMessages(messages = [], parentMessageId) {
    const attachments = await this.options.attachments;
    const latestMessage = { ...messages[messages.length - 1] };
    await this.buildAugmentedPrompt(messages);

    const { prompt } = await this.buildMessagesPrompt(messages, parentMessageId);

    const files = await this.addImageURLs(latestMessage, attachments);

    this.options.attachments = files;

    latestMessage.text = prompt;

    const payload = {
      instances: [
        {
          messages: [new HumanMessage(formatMessage({ message: latestMessage }))],
        },
      ],
    };
    return { prompt: payload };
  }

  /** @param {TMessage[]} [messages=[]]  */
  async buildGenerativeMessages(messages = []) {
    this.userLabel = 'user';
    this.modelLabel = 'model';
    const promises = [];
    promises.push(await this.formatGenerativeMessages(messages));
    promises.push(this.buildAugmentedPrompt(messages));
    const [formattedMessages] = await Promise.all(promises);
    return { prompt: formattedMessages };
  }

  /**
   * @param {TMessage[]} [messages=[]]
   * @param {string} [parentMessageId]
   */
  async buildMessages(_messages = [], parentMessageId) {
    if (!this.isGenerativeModel && !this.project_id) {
      throw new Error('[GoogleClient] PaLM 2 and Codey models are no longer supported.');
    }

    if (this.systemMessage) {
      const instructionsTokenCount = this.getTokenCount(this.systemMessage);

      this.maxContextTokens = this.maxContextTokens - instructionsTokenCount;
      if (this.maxContextTokens < 0) {
        const info = `${instructionsTokenCount} / ${this.maxContextTokens}`;
        const errorMessage = `{ "type": "${ErrorTypes.INPUT_LENGTH}", "info": "${info}" }`;
        logger.warn(`Instructions token count exceeds max context (${info}).`);
        throw new Error(errorMessage);
      }
    }

    for (let i = 0; i < _messages.length; i++) {
      const message = _messages[i];
      if (!message.tokenCount) {
        _messages[i].tokenCount = this.getTokenCountForMessage({
          role: message.isCreatedByUser ? 'user' : 'assistant',
          content: message.content ?? message.text,
        });
      }
    }

    const {
      payload: messages,
      tokenCountMap,
      promptTokens,
    } = await this.handleContextStrategy({
      orderedMessages: _messages,
      formattedMessages: _messages,
    });

    if (!this.project_id && !isLegacyModel(this.modelOptions.model)) {
      const result = await this.buildGenerativeMessages(messages);
      result.tokenCountMap = tokenCountMap;
      result.promptTokens = promptTokens;
      return result;
    }

    if (this.options.attachments && this.isGenerativeModel) {
      const result = this.buildVisionMessages(messages, parentMessageId);
      result.tokenCountMap = tokenCountMap;
      result.promptTokens = promptTokens;
      return result;
    }

    let payload = {
      instances: [
        {
          messages: messages
            .map(this.formatMessages())
            .map((msg) => ({ ...msg, role: msg.author === 'User' ? 'user' : 'assistant' }))
            .map((message) => formatMessage({ message, langChain: true })),
        },
      ],
    };

    if (this.systemMessage) {
      payload.instances[0].context = this.systemMessage;
    }

    logger.debug('[GoogleClient] buildMessages', payload);
    return { prompt: payload, tokenCountMap, promptTokens };
  }

  async buildMessagesPrompt(messages, parentMessageId) {
    const orderedMessages = this.constructor.getMessagesForConversation({
      messages,
      parentMessageId,
    });

    logger.debug('[GoogleClient]', {
      orderedMessages,
      parentMessageId,
    });

    const formattedMessages = orderedMessages.map(this.formatMessages());

    let lastAuthor = '';
    let groupedMessages = [];

    for (let message of formattedMessages) {
      // If last author is not same as current author, add to new group
      if (lastAuthor !== message.author) {
        groupedMessages.push({
          author: message.author,
          content: [message.content],
        });
        lastAuthor = message.author;
        // If same author, append content to the last group
      } else {
        groupedMessages[groupedMessages.length - 1].content.push(message.content);
      }
    }

    let identityPrefix = '';
    if (this.options.userLabel) {
      identityPrefix = `\nHuman's name: ${this.options.userLabel}`;
    }

    if (this.options.modelLabel) {
      identityPrefix = `${identityPrefix}\nYou are ${this.options.modelLabel}`;
    }

    let promptPrefix = (this.systemMessage ?? '').trim();

    if (identityPrefix) {
      promptPrefix = `${identityPrefix}${promptPrefix}`;
    }

    // Prompt AI to respond, empty if last message was from AI
    let isEdited = lastAuthor === this.modelLabel;
    const promptSuffix = isEdited ? '' : `${promptPrefix}\n\n${this.modelLabel}:\n`;
    let currentTokenCount = isEdited
      ? this.getTokenCount(promptPrefix)
      : this.getTokenCount(promptSuffix);

    let promptBody = '';
    const maxTokenCount = this.maxPromptTokens;

    const context = [];

    // Iterate backwards through the messages, adding them to the prompt until we reach the max token count.
    // Do this within a recursive async function so that it doesn't block the event loop for too long.
    // Also, remove the next message when the message that puts us over the token limit is created by the user.
    // Otherwise, remove only the exceeding message. This is due to Anthropic's strict payload rule to start with "Human:".
    const nextMessage = {
      remove: false,
      tokenCount: 0,
      messageString: '',
    };

    const buildPromptBody = async () => {
      if (currentTokenCount < maxTokenCount && groupedMessages.length > 0) {
        const message = groupedMessages.pop();
        const isCreatedByUser = message.author === this.userLabel;
        // Use promptPrefix if message is edited assistant'
        const messagePrefix =
          isCreatedByUser || !isEdited
            ? `\n\n${message.author}:`
            : `${promptPrefix}\n\n${message.author}:`;
        const messageString = `${messagePrefix}\n${message.content}\n`;
        let newPromptBody = `${messageString}${promptBody}`;

        context.unshift(message);

        const tokenCountForMessage = this.getTokenCount(messageString);
        const newTokenCount = currentTokenCount + tokenCountForMessage;

        if (!isCreatedByUser) {
          nextMessage.messageString = messageString;
          nextMessage.tokenCount = tokenCountForMessage;
        }

        if (newTokenCount > maxTokenCount) {
          if (!promptBody) {
            // This is the first message, so we can't add it. Just throw an error.
            throw new Error(
              `Prompt is too long. Max token count is ${maxTokenCount}, but prompt is ${newTokenCount} tokens long.`,
            );
          }

          // Otherwise, ths message would put us over the token limit, so don't add it.
          // if created by user, remove next message, otherwise remove only this message
          if (isCreatedByUser) {
            nextMessage.remove = true;
          }

          return false;
        }
        promptBody = newPromptBody;
        currentTokenCount = newTokenCount;

        // Switch off isEdited after using it for the first time
        if (isEdited) {
          isEdited = false;
        }

        // wait for next tick to avoid blocking the event loop
        await new Promise((resolve) => setImmediate(resolve));
        return buildPromptBody();
      }
      return true;
    };

    await buildPromptBody();

    if (nextMessage.remove) {
      promptBody = promptBody.replace(nextMessage.messageString, '');
      currentTokenCount -= nextMessage.tokenCount;
      context.shift();
    }

    let prompt = `${promptBody}${promptSuffix}`.trim();

    // Add 2 tokens for metadata after all messages have been counted.
    currentTokenCount += 2;

    // Use up to `this.maxContextTokens` tokens (prompt + response), but try to leave `this.maxTokens` tokens for the response.
    this.modelOptions.maxOutputTokens = Math.min(
      this.maxContextTokens - currentTokenCount,
      this.maxResponseTokens,
    );

    return { prompt, context };
  }

  createLLM(clientOptions) {
    const model = clientOptions.modelName ?? clientOptions.model;
    clientOptions.location = loc;
    clientOptions.endpoint = endpointPrefix;

    let requestOptions = null;
    if (this.reverseProxyUrl) {
      requestOptions = {
        baseUrl: this.reverseProxyUrl,
      };

      if (this.authHeader) {
        requestOptions.customHeaders = {
          Authorization: `Bearer ${this.apiKey}`,
        };
      }
    }

    if (this.project_id != null) {
      logger.debug('Creating VertexAI client');
      this.visionMode = undefined;
      clientOptions.streaming = true;
      const client = new ChatVertexAI(clientOptions);
      client.temperature = clientOptions.temperature;
      client.topP = clientOptions.topP;
      client.topK = clientOptions.topK;
      client.topLogprobs = clientOptions.topLogprobs;
      client.frequencyPenalty = clientOptions.frequencyPenalty;
      client.presencePenalty = clientOptions.presencePenalty;
      client.maxOutputTokens = clientOptions.maxOutputTokens;
      return client;
    } else if (!isLegacyModel(model)) {
      logger.debug('Creating GenAI client');
      return new GenAI(this.apiKey).getGenerativeModel({ model }, requestOptions);
    }

    logger.debug('Creating Chat Google Generative AI client');
    return new ChatGoogleGenerativeAI({ ...clientOptions, apiKey: this.apiKey });
  }

  initializeClient() {
    let clientOptions = { ...this.modelOptions };

    if (this.project_id) {
      clientOptions['authOptions'] = {
        credentials: {
          ...this.serviceKey,
        },
        projectId: this.project_id,
      };
    }

    if (this.isGenerativeModel && !this.project_id) {
      clientOptions.modelName = clientOptions.model;
      delete clientOptions.model;
    }

    this.client = this.createLLM(clientOptions);
    return this.client;
  }

  /**
   * Calculate exponential backoff delay with jitter
   * @param {number} attempt - Current retry attempt (0-indexed)
   * @returns {number} Delay in milliseconds
   */
  calculateRetryDelay(attempt) {
    const { baseDelay, multiplier, maxDelay, jitterFactor } = RETRY_CONFIG;

    // Calculate exponential delay
    let delay = baseDelay * Math.pow(multiplier, attempt);

    // Apply maximum delay cap
    delay = Math.min(delay, maxDelay);

    // Add jitter to prevent thundering herd
    const jitterRange = delay * jitterFactor;
    const jitter = (Math.random() * 2 - 1) * jitterRange;
    delay = Math.max(100, delay + jitter);

    return Math.floor(delay);
  }

  /**
   * Check if an error is retryable
   * @param {Error} error - The error to check
   * @returns {boolean} True if error should trigger retry
   */
  isRetryableError(error) {
    if (!error) {
      return false;
    }

    const errorMessage = error.message || '';
    const errorCode = error.code;
    const errorStatus = error.status;

    // Check for Vertex AI/Google API structured error responses
    // Example: error.message might contain JSON with nested error.code
    try {
      // Try to parse JSON error responses
      const jsonMatch = errorMessage.match(/\[?\{[\s\S]*"error"[\s\S]*\}?\]?/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const nestedError = parsed.error || parsed[0]?.error;
        if (nestedError) {
          // Check nested error code
          if (nestedError.code && RETRY_CONFIG.retryableStatusCodes.includes(nestedError.code)) {
            logger.debug(
              `[GoogleClient] Detected retryable error code ${nestedError.code} in nested error`,
            );
            return true;
          }
          // Check nested error status (e.g., "RESOURCE_EXHAUSTED")
          if (
            nestedError.status &&
            ['RESOURCE_EXHAUSTED', 'UNAVAILABLE', 'DEADLINE_EXCEEDED'].includes(nestedError.status)
          ) {
            logger.debug(
              `[GoogleClient] Detected retryable status '${nestedError.status}' in nested error`,
            );
            return true;
          }
        }
      }
    } catch (parseError) {
      // Not JSON or failed to parse - continue with other checks
    }

    // Check for retryable status codes in error message string
    for (const code of RETRY_CONFIG.retryableStatusCodes) {
      if (errorMessage.includes(String(code))) {
        logger.debug(`[GoogleClient] Detected retryable error code ${code} in message string`);
        return true;
      }
    }

    // Check error.code property
    if (errorCode && RETRY_CONFIG.retryableStatusCodes.includes(errorCode)) {
      logger.debug(`[GoogleClient] Detected retryable error code ${errorCode} in error.code`);
      return true;
    }

    // Check error.status property
    if (
      errorStatus &&
      ['RESOURCE_EXHAUSTED', 'UNAVAILABLE', 'DEADLINE_EXCEEDED'].includes(errorStatus)
    ) {
      logger.debug(`[GoogleClient] Detected retryable status '${errorStatus}' in error.status`);
      return true;
    }

    // Check for retryable network errors
    if (errorCode && RETRY_CONFIG.retryableErrors.includes(errorCode)) {
      logger.debug(`[GoogleClient] Detected retryable network error code: ${errorCode}`);
      return true;
    }

    // Check for common retryable error messages
    const retryableMessages = [
      'rate limit',
      'too many requests',
      'service unavailable',
      'timeout',
      'temporarily unavailable',
      'network error',
      'connection reset',
      'resource exhausted', // Added for Vertex AI 429 errors
      'deadline exceeded',
      'unavailable',
    ];

    const isRetryable = retryableMessages.some((msg) =>
      errorMessage.toLowerCase().includes(msg),
    );
    if (isRetryable) {
      logger.debug(`[GoogleClient] Detected retryable error message pattern in error text`);
    }

    return isRetryable;
  }

  async getCompletion(_payload, options = {}) {
    try {
      const { onProgress, abortController } = options;
      const safetySettings = getSafetySettings(this.modelOptions.model);
      const streamRate = this.options.streamRate ?? Constants.DEFAULT_STREAM_RATE;
      const modelName = this.modelOptions.modelName ?? this.modelOptions.model ?? '';

      let reply = '';
      /** @type {Error} */
      let error;
      let lastError;
      const maxAttempts = RETRY_CONFIG.maxRetries + 1;

      // Retry loop for transient failures
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
      error = null;
      reply = '';

      try {
        // Log retry attempt if not first
        if (attempt > 0) {
          const providerType = this.project_id ? 'Vertex AI' : 'Gemini API';
          logger.info(
            `[GoogleClient] Retry attempt ${attempt}/${RETRY_CONFIG.maxRetries} for ${providerType}`,
          );
        }

      if (!isLegacyModel(modelName) && !this.project_id) {
        /** @type {GenerativeModel} */
        const client = this.client;
        /** @type {GenerateContentRequest} */
        const requestOptions = {
          safetySettings,
          contents: _payload,
          generationConfig: googleGenConfigSchema.parse(this.modelOptions),
        };

        const promptPrefix = (this.systemMessage ?? '').trim();
        if (promptPrefix.length) {
          requestOptions.systemInstruction = {
            parts: [
              {
                text: promptPrefix,
              },
            ],
          };
        }

        const delay = modelName.includes('flash') ? 8 : 15;
        /** @type {GenAIUsageMetadata} */
        let usageMetadata;

        abortController.signal.addEventListener(
          'abort',
          () => {
            logger.warn('[GoogleClient] Request was aborted', abortController.signal.reason);
          },
          { once: true },
        );

        const result = await client.generateContentStream(requestOptions, {
          signal: abortController.signal,
        });
        for await (const chunk of result.stream) {
          usageMetadata = !usageMetadata
            ? chunk?.usageMetadata
            : Object.assign(usageMetadata, chunk?.usageMetadata);
          const chunkText = chunk.text();
          await this.generateTextStream(chunkText, onProgress, {
            delay,
          });
          reply += chunkText;
          await sleep(streamRate);
        }

        if (usageMetadata) {
          this.usage = {
            input_tokens: usageMetadata.promptTokenCount,
            output_tokens: usageMetadata.candidatesTokenCount,
          };
        }

        return reply;
      }

      const { instances } = _payload;
      const { messages: messages, context } = instances?.[0] ?? {};

      if (!this.isVisionModel && context && messages?.length > 0) {
        messages.unshift(new SystemMessage(context));
      }

      /** @type {import('@langchain/core/messages').AIMessageChunk['usage_metadata']} */
      let usageMetadata;
      /** @type {ChatVertexAI} */
      const client = this.client;
      const stream = await client.stream(messages, {
        signal: abortController.signal,
        streamUsage: true,
        safetySettings,
      });

      let delay = this.options.streamRate || 8;

      if (!this.options.streamRate) {
        if (this.isGenerativeModel) {
          delay = 15;
        }
        if (modelName.includes('flash')) {
          delay = 5;
        }
      }

      for await (const chunk of stream) {
        if (chunk?.usage_metadata) {
          const metadata = chunk.usage_metadata;
          for (const key in metadata) {
            if (Number.isNaN(metadata[key])) {
              delete metadata[key];
            }
          }

          usageMetadata = !usageMetadata ? metadata : concat(usageMetadata, metadata);
        }

        const chunkText = chunk?.content ?? '';
        await this.generateTextStream(chunkText, onProgress, {
          delay,
        });
        reply += chunkText;
      }

      if (usageMetadata) {
        this.usage = usageMetadata;
      }
      } catch (e) {
        error = e;
        lastError = e;
        const providerType = this.project_id ? 'Vertex AI' : 'Gemini API';
        const contextInfo = this.project_id
          ? `Project: ${this.project_id}, Location: ${loc}`
          : 'Using Gemini API';
        logger.error(
          `[GoogleClient] ${providerType} error generating completion. ${contextInfo}`,
          {
            error: e.message,
            model: this.modelOptions.model,
            provider: providerType,
            attempt: attempt + 1,
            maxAttempts,
          },
        );

        // Check if error is retryable and we have attempts left
        const isRetryable = this.isRetryableError(e);
        const hasMoreAttempts = attempt < RETRY_CONFIG.maxRetries;

        if (isRetryable && hasMoreAttempts) {
          const delay = this.calculateRetryDelay(attempt);
          logger.warn(
            `[GoogleClient] Retryable error detected. Waiting ${delay}ms before retry ${attempt + 2}/${maxAttempts}`,
          );
          await sleep(delay);
          continue; // Retry
        }

        // Not retryable or max retries reached - will throw error below
        break;
      }

      // Success - return reply
      if (!error && reply !== '') {
        return reply;
      }

      // Success with empty reply (valid case for some models)
      if (!error) {
        return reply;
      }

      // Error occurred but will retry - loop continues
    }

    // All retries exhausted or non-retryable error - format and throw error
    if (error != null && reply === '') {
      const providerType = this.project_id ? 'Vertex AI' : 'Gemini API';
      const errorDetails = [];

      // Parse error for common issues
      const errorMsg = error.message || '';
      if (errorMsg.includes('403') || errorMsg.includes('permission')) {
        errorDetails.push('Permission denied - check IAM roles');
      } else if (errorMsg.includes('401') || errorMsg.includes('unauthorized')) {
        errorDetails.push('Authentication failed - verify API key/service account');
      } else if (errorMsg.includes('quota') || errorMsg.includes('429')) {
        errorDetails.push('Quota exceeded - check API limits');
      } else if (errorMsg.includes('not found') || errorMsg.includes('404')) {
        errorDetails.push('Model not found - verify model is enabled');
      }

      const troubleshootingInfo = errorDetails.length > 0
        ? ` | ${errorDetails.join(' | ')}`
        : '';

      const errorMessage = `{ "type": "${ErrorTypes.GoogleError}", "info": "${providerType} failed: ${
        error.message ?? 'Unknown error occurred'
      }${troubleshootingInfo}" }`;
      throw new Error(errorMessage);
    }

    return reply;
    } finally {
      // Clean up uploaded files from File API
      if (this.uploadedFiles && this.uploadedFiles.length > 0) {
        logger.debug(`[GoogleClient] Cleaning up ${this.uploadedFiles.length} uploaded files`);
        await this.deleteUploadedFiles(this.uploadedFiles);
        this.uploadedFiles = [];
      }
    }
  }

  /**
   * Get stream usage as returned by this client's API response.
   * @returns {UsageMetadata} The stream usage object.
   */
  getStreamUsage() {
    return this.usage;
  }

  getMessageMapMethod() {
    /**
     * @param {TMessage} msg
     */
    return (msg) => {
      if (msg.text != null && msg.text && msg.text.startsWith(':::thinking')) {
        msg.text = msg.text.replace(/:::thinking.*?:::/gs, '').trim();
      } else if (msg.content != null) {
        msg.text = parseTextParts(msg.content, true);
        delete msg.content;
      }

      return msg;
    };
  }

  /**
   * Calculates the correct token count for the current user message based on the token count map and API usage.
   * Edge case: If the calculation results in a negative value, it returns the original estimate.
   * If revisiting a conversation with a chat history entirely composed of token estimates,
   * the cumulative token count going forward should become more accurate as the conversation progresses.
   * @param {Object} params - The parameters for the calculation.
   * @param {Record<string, number>} params.tokenCountMap - A map of message IDs to their token counts.
   * @param {string} params.currentMessageId - The ID of the current message to calculate.
   * @param {UsageMetadata} params.usage - The usage object returned by the API.
   * @returns {number} The correct token count for the current user message.
   */
  calculateCurrentTokenCount({ tokenCountMap, currentMessageId, usage }) {
    const originalEstimate = tokenCountMap[currentMessageId] || 0;

    if (!usage || typeof usage.input_tokens !== 'number') {
      return originalEstimate;
    }

    tokenCountMap[currentMessageId] = 0;
    const totalTokensFromMap = Object.values(tokenCountMap).reduce((sum, count) => {
      const numCount = Number(count);
      return sum + (isNaN(numCount) ? 0 : numCount);
    }, 0);
    const totalInputTokens = usage.input_tokens ?? 0;
    const currentMessageTokens = totalInputTokens - totalTokensFromMap;
    return currentMessageTokens > 0 ? currentMessageTokens : originalEstimate;
  }

  /**
   * @param {object} params
   * @param {number} params.promptTokens
   * @param {number} params.completionTokens
   * @param {UsageMetadata} [params.usage]
   * @param {string} [params.model]
   * @param {string} [params.context='message']
   * @returns {Promise<void>}
   */
  async recordTokenUsage({ promptTokens, completionTokens, model, context = 'message' }) {
    const modelName = model ?? this.modelOptions.model;
    // Transform model name to use Vertex AI pricing if applicable
    const pricingModel = getVertexAIModelName(modelName, !!this.project_id);

    await spendTokens(
      {
        context,
        user: this.user ?? this.options.req?.user?.id,
        conversationId: this.conversationId,
        model: pricingModel,
        endpointTokenConfig: this.options.endpointTokenConfig,
      },
      { promptTokens, completionTokens },
    );

    // Track quota usage for Vertex AI
    if (this.project_id) {
      await this.trackQuotaUsage({
        promptTokens,
        completionTokens,
      });
    }
  }

  /**
   * Track Vertex AI quota usage (RPM, TPM, RPD, TPD)
   * @param {Object} params - Usage parameters
   * @param {number} params.promptTokens - Input tokens
   * @param {number} params.completionTokens - Output tokens
   * @returns {Promise<void>}
   */
  async trackQuotaUsage({ promptTokens = 0, completionTokens = 0 }) {
    if (!this.project_id) {
      return; // Only track for Vertex AI
    }

    const totalTokens = promptTokens + completionTokens;
    const cacheKey = `${this.project_id}:${this.modelOptions.model}`;

    try {
      // Track requests per minute (RPM)
      const rpmCache = getLogStores(CacheKeys.VERTEX_QUOTA_RPM);
      const currentRPM = (await rpmCache.get(cacheKey)) ?? 0;
      await rpmCache.set(cacheKey, currentRPM + 1);

      // Track tokens per minute (TPM)
      const tpmCache = getLogStores(CacheKeys.VERTEX_QUOTA_TPM);
      const currentTPM = (await tpmCache.get(cacheKey)) ?? 0;
      await tpmCache.set(cacheKey, currentTPM + totalTokens);

      // Track requests per day (RPD)
      const rpdCache = getLogStores(CacheKeys.VERTEX_QUOTA_RPD);
      const rpdKey = `${cacheKey}:${new Date().toISOString().split('T')[0]}`;
      const currentRPD = (await rpdCache.get(rpdKey)) ?? 0;
      await rpdCache.set(rpdKey, currentRPD + 1);

      // Track tokens per day (TPD)
      const tpdCache = getLogStores(CacheKeys.VERTEX_QUOTA_TPD);
      const tpdKey = `${cacheKey}:${new Date().toISOString().split('T')[0]}`;
      const currentTPD = (await tpdCache.get(tpdKey)) ?? 0;
      await tpdCache.set(tpdKey, currentTPD + totalTokens);

      // Log quota usage
      logger.debug('[GoogleClient] Vertex AI quota tracking', {
        project: this.project_id,
        model: this.modelOptions.model,
        rpm: currentRPM + 1,
        tpm: currentTPM + totalTokens,
        rpd: currentRPD + 1,
        tpd: currentTPD + totalTokens,
      });
    } catch (error) {
      logger.warn('[GoogleClient] Failed to track Vertex AI quota usage', error.message);
    }
  }

  /**
   * Get current quota usage for Vertex AI
   * @returns {Promise<Object>} Current quota usage
   */
  async getQuotaUsage() {
    if (!this.project_id) {
      return null;
    }

    const cacheKey = `${this.project_id}:${this.modelOptions.model}`;

    try {
      const rpmCache = getLogStores(CacheKeys.VERTEX_QUOTA_RPM);
      const tpmCache = getLogStores(CacheKeys.VERTEX_QUOTA_TPM);
      const rpdCache = getLogStores(CacheKeys.VERTEX_QUOTA_RPD);
      const tpdCache = getLogStores(CacheKeys.VERTEX_QUOTA_TPD);

      const rpdKey = `${cacheKey}:${new Date().toISOString().split('T')[0]}`;
      const tpdKey = `${cacheKey}:${new Date().toISOString().split('T')[0]}`;

      const [rpm, tpm, rpd, tpd] = await Promise.all([
        rpmCache.get(cacheKey),
        tpmCache.get(cacheKey),
        rpdCache.get(rpdKey),
        tpdCache.get(tpdKey),
      ]);

      return {
        requestsPerMinute: rpm ?? 0,
        tokensPerMinute: tpm ?? 0,
        requestsPerDay: rpd ?? 0,
        tokensPerDay: tpd ?? 0,
        project: this.project_id,
        model: this.modelOptions.model,
      };
    } catch (error) {
      logger.warn('[GoogleClient] Failed to get Vertex AI quota usage', error.message);
      return null;
    }
  }

  /**
   * Check if approaching quota limits and log warnings
   * Default Vertex AI limits (can be overridden via options):
   * - RPM: 300 requests/minute for Gemini 1.5 Pro, 2000 for Flash
   * - TPM: 4M tokens/minute for Gemini 1.5 Pro, 4M for Flash
   * @param {Object} limits - Quota limits
   * @param {number} [limits.rpm=1000] - Requests per minute limit
   * @param {number} [limits.tpm=4000000] - Tokens per minute limit
   * @param {number} [limits.threshold=0.8] - Warning threshold (80% by default)
   * @returns {Promise<Object>} Quota status
   */
  async checkQuotaLimits({ rpm = 1000, tpm = 4000000, threshold = 0.8 } = {}) {
    const usage = await this.getQuotaUsage();
    if (!usage) {
      return null;
    }

    const warnings = [];
    const status = {
      rpm: {
        current: usage.requestsPerMinute,
        limit: rpm,
        percentage: (usage.requestsPerMinute / rpm) * 100,
        approaching: usage.requestsPerMinute > rpm * threshold,
      },
      tpm: {
        current: usage.tokensPerMinute,
        limit: tpm,
        percentage: (usage.tokensPerMinute / tpm) * 100,
        approaching: usage.tokensPerMinute > tpm * threshold,
      },
    };

    if (status.rpm.approaching) {
      const msg = `[GoogleClient] Vertex AI RPM quota at ${status.rpm.percentage.toFixed(
        1,
      )}% (${usage.requestsPerMinute}/${rpm})`;
      logger.warn(msg);
      warnings.push(msg);
    }

    if (status.tpm.approaching) {
      const msg = `[GoogleClient] Vertex AI TPM quota at ${status.tpm.percentage.toFixed(
        1,
      )}% (${usage.tokensPerMinute}/${tpm})`;
      logger.warn(msg);
      warnings.push(msg);
    }

    return { ...status, warnings };
  }

  /**
   * Estimate cost for Vertex AI request
   * @param {Object} params - Parameters for cost estimation
   * @param {number} params.promptTokens - Input tokens
   * @param {number} params.completionTokens - Output tokens
   * @param {string} [params.model] - Model name (defaults to current model)
   * @returns {Object} Cost estimation in USD
   */
  estimateCost({ promptTokens, completionTokens, model }) {
    const modelName = model ?? this.modelOptions.model;
    const pricingModel = getVertexAIModelName(modelName, !!this.project_id);

    // Get pricing multipliers (cost per 1M tokens)
    const promptMultiplier = getMultiplier({
      model: pricingModel,
      tokenType: 'prompt',
      endpoint: 'google',
    });

    const completionMultiplier = getMultiplier({
      model: pricingModel,
      tokenType: 'completion',
      endpoint: 'google',
    });

    // Calculate costs (multipliers are per 1M tokens)
    const promptCost = (promptTokens / 1000000) * promptMultiplier;
    const completionCost = (completionTokens / 1000000) * completionMultiplier;
    const totalCost = promptCost + completionCost;

    const result = {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      promptCost,
      completionCost,
      totalCost,
      currency: 'USD',
      model: pricingModel,
      provider: this.project_id ? 'Vertex AI' : 'Gemini API',
    };

    logger.debug('[GoogleClient] Cost estimation', result);

    return result;
  }

  /**
   * Stripped-down logic for generating a title. This uses the non-streaming APIs, since the user does not see titles streaming
   */
  async titleChatCompletion(_payload, options = {}) {
    let reply = '';
    const { abortController } = options;

    const model =
      this.options.titleModel ?? this.modelOptions.modelName ?? this.modelOptions.model ?? '';
    const safetySettings = getSafetySettings(model);
    if (!isLegacyModel(model) && !this.project_id) {
      logger.debug('Identified titling model as GenAI version');
      /** @type {GenerativeModel} */
      const client = this.client;
      const requestOptions = {
        contents: _payload,
        safetySettings,
        generationConfig: {
          temperature: 0.5,
        },
      };

      const result = await client.generateContent(requestOptions);
      reply = result.response?.text();
      return reply;
    } else {
      const { instances } = _payload;
      const { messages } = instances?.[0] ?? {};
      const titleResponse = await this.client.invoke(messages, {
        signal: abortController.signal,
        timeout: 7000,
        safetySettings,
      });

      if (titleResponse.usage_metadata) {
        await this.recordTokenUsage({
          model,
          promptTokens: titleResponse.usage_metadata.input_tokens,
          completionTokens: titleResponse.usage_metadata.output_tokens,
          context: 'title',
        });
      }

      reply = titleResponse.content;
      return reply;
    }
  }

  async titleConvo({ text, responseText = '' }) {
    let title = 'New Chat';
    const convo = `||>User:
"${truncateText(text)}"
||>Response:
"${JSON.stringify(truncateText(responseText))}"`;

    let { prompt: payload } = await this.buildMessages([
      {
        text: `Please generate ${titleInstruction}

    ${convo}
    
    ||>Title:`,
        isCreatedByUser: true,
        author: this.userLabel,
      },
    ]);

    try {
      this.initializeClient();
      title = await this.titleChatCompletion(payload, {
        abortController: new AbortController(),
        onProgress: () => {},
      });
    } catch (e) {
      logger.error('[GoogleClient] There was an issue generating the title', e);
    }
    logger.debug(`Title response: ${title}`);
    return title;
  }

  getSaveOptions() {
    return {
      endpointType: null,
      artifacts: this.options.artifacts,
      promptPrefix: this.options.promptPrefix,
      maxContextTokens: this.options.maxContextTokens,
      modelLabel: this.options.modelLabel,
      iconURL: this.options.iconURL,
      greeting: this.options.greeting,
      spec: this.options.spec,
      ...this.modelOptions,
    };
  }

  getBuildMessagesOptions() {
    // logger.debug('GoogleClient doesn\'t use getBuildMessagesOptions');
  }

  async sendCompletion(payload, opts = {}) {
    let reply = '';
    reply = await this.getCompletion(payload, opts);
    return reply.trim();
  }

  getEncoding() {
    return 'cl100k_base';
  }

  /**
   * Returns the token count of a given text. It also checks and resets the tokenizers if necessary.
   * Uses caching to avoid redundant tokenization for the same text.
   * @param {string} text - The text to get the token count for.
   * @returns {number} The token count of the given text.
   */
  getTokenCount(text) {
    // For now, keep synchronous to maintain backward compatibility
    // Token count caching can be added at a higher level if needed
    const encoding = this.getEncoding();
    const tokenCount = Tokenizer.getTokenCount(text, encoding);

    // Note: Actual Vertex AI token counting could be implemented here
    // using the countTokens API endpoint, but it would require async operation
    // and potentially add latency. The current cl100k_base encoding is a good
    // approximation for Google models.

    return tokenCount;
  }
}

module.exports = GoogleClient;
