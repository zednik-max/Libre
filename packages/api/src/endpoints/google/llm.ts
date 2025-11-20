import { Providers } from '@librechat/agents';
import { googleSettings, AuthKeys, removeNullishValues } from 'librechat-data-provider';
import type { GoogleClientOptions, VertexAIClientOptions } from '@librechat/agents';
import type { GoogleAIToolType } from '@langchain/google-common';
import type * as t from '~/types';
import { isEnabled } from '~/utils';
import { logger } from '@librechat/data-schemas';

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
function getValidatedLocation(): string {
  const envLoc = process.env.GOOGLE_LOC;
  if (envLoc && SUPPORTED_LOCATIONS.includes(envLoc)) {
    return envLoc;
  }
  if (envLoc) {
    logger.warn(
      `[VertexAI] Invalid GOOGLE_LOC '${envLoc}'. Supported locations: ${SUPPORTED_LOCATIONS.join(', ')}. Defaulting to 'us-central1'.`,
    );
  }
  return 'us-central1';
}

/**
 * Model configuration for Google/Vertex AI models
 * Defines capabilities including thinking support
 */
const MODEL_CONFIG: Record<string, { type: string; capabilities: string[] }> = {
  // Modern Gemini models with thinking support
  'gemini-2.0-flash-exp': { type: 'genai', capabilities: ['vision', 'thinking'] },
  'gemini-1.5-pro-latest': { type: 'genai', capabilities: ['vision', 'thinking'] },
  'gemini-1.5-pro': { type: 'genai', capabilities: ['vision', 'thinking'] },

  // Modern Gemini models WITHOUT thinking support
  'gemini-2.0-flash': { type: 'genai', capabilities: ['vision'] },
  'gemini-2.0-flash-lite': { type: 'genai', capabilities: ['vision'] },
  'gemini-1.5-flash-latest': { type: 'genai', capabilities: ['vision'] },
  'gemini-1.5-flash': { type: 'genai', capabilities: ['vision'] },
  'gemini-1.5-flash-8b': { type: 'genai', capabilities: ['vision'] },
  'learnlm-1.5-pro-experimental': { type: 'genai', capabilities: ['vision'] },
  'gemma-2-9b-it': { type: 'genai', capabilities: [] },
  'gemma-2-27b-it': { type: 'genai', capabilities: [] },

  // Legacy models
  'gemini-1.0-pro': { type: 'legacy', capabilities: [] },
  'gemini-1.0-pro-latest': { type: 'legacy', capabilities: [] },
  'gemini-1-0-pro': { type: 'legacy', capabilities: [] },
  'gemini-pro': { type: 'legacy', capabilities: [] },
  'gemini-pro-vision': { type: 'legacy', capabilities: ['vision'] },
};

/**
 * Check if a model supports thinking/reasoning capability
 * @param modelName - The model name to check
 * @returns True if model supports thinking
 */
function supportsThinking(modelName: string | undefined): boolean {
  if (!modelName) {
    return false;
  }

  // Check exact match in config
  if (MODEL_CONFIG[modelName]) {
    return MODEL_CONFIG[modelName].capabilities.includes('thinking');
  }

  // Fallback: Only specific Gemini models support thinking
  const thinkingPatterns = [
    'gemini-2.0-flash-exp',
    'gemini-1.5-pro-latest',
    'gemini-1.5-pro-',
    'gemini-1.5-pro-002',
  ];

  for (const pattern of thinkingPatterns) {
    if (modelName.includes(pattern)) {
      return true;
    }
  }

  return false;
}

/** Known Google/Vertex AI parameters that map directly to the client config */
export const knownGoogleParams = new Set([
  'model',
  'modelName',
  'temperature',
  'maxOutputTokens',
  'maxReasoningTokens',
  'topP',
  'topK',
  'seed',
  'presencePenalty',
  'frequencyPenalty',
  'stopSequences',
  'stop',
  'logprobs',
  'topLogprobs',
  'safetySettings',
  'responseModalities',
  'convertSystemMessageToHumanContent',
  'speechConfig',
  'streamUsage',
  'apiKey',
  'baseUrl',
  'location',
  'authOptions',
]);

/**
 * Applies default parameters to the target object only if the field is undefined
 * @param target - The target object to apply defaults to
 * @param defaults - Record of default parameter values
 */
function applyDefaultParams(target: Record<string, unknown>, defaults: Record<string, unknown>) {
  for (const [key, value] of Object.entries(defaults)) {
    if (target[key] === undefined) {
      target[key] = value;
    }
  }
}

function getThresholdMapping(model: string) {
  const gemini1Pattern = /gemini-(1\.0|1\.5|pro$|1\.0-pro|1\.5-pro|1\.5-flash-001)/;
  const restrictedPattern = /(gemini-(1\.5-flash-8b|2\.0|exp)|learnlm)/;

  if (gemini1Pattern.test(model)) {
    return (value: string) => {
      if (value === 'OFF') {
        return 'BLOCK_NONE';
      }
      return value;
    };
  }

  if (restrictedPattern.test(model)) {
    return (value: string) => {
      if (value === 'OFF' || value === 'HARM_BLOCK_THRESHOLD_UNSPECIFIED') {
        return 'BLOCK_NONE';
      }
      return value;
    };
  }

  return (value: string) => value;
}

export function getSafetySettings(
  model?: string,
): Array<{ category: string; threshold: string }> | undefined {
  if (isEnabled(process.env.GOOGLE_EXCLUDE_SAFETY_SETTINGS)) {
    return undefined;
  }
  const mapThreshold = getThresholdMapping(model ?? '');

  return [
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: mapThreshold(
        process.env.GOOGLE_SAFETY_SEXUALLY_EXPLICIT || 'HARM_BLOCK_THRESHOLD_UNSPECIFIED',
      ),
    },
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: mapThreshold(
        process.env.GOOGLE_SAFETY_HATE_SPEECH || 'HARM_BLOCK_THRESHOLD_UNSPECIFIED',
      ),
    },
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: mapThreshold(
        process.env.GOOGLE_SAFETY_HARASSMENT || 'HARM_BLOCK_THRESHOLD_UNSPECIFIED',
      ),
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: mapThreshold(
        process.env.GOOGLE_SAFETY_DANGEROUS_CONTENT || 'HARM_BLOCK_THRESHOLD_UNSPECIFIED',
      ),
    },
    {
      category: 'HARM_CATEGORY_CIVIC_INTEGRITY',
      threshold: mapThreshold(process.env.GOOGLE_SAFETY_CIVIC_INTEGRITY || 'BLOCK_NONE'),
    },
  ];
}

/**
 * Replicates core logic from GoogleClient's constructor and setOptions, plus client determination.
 * Returns an object with the provider label and the final options that would be passed to createLLM.
 *
 * @param credentials - Either a JSON string or an object containing Google keys
 * @param options - The same shape as the "GoogleClient" constructor options
 */

export function getGoogleConfig(
  credentials: string | t.GoogleCredentials | undefined,
  options: t.GoogleConfigOptions = {},
) {
  let creds: t.GoogleCredentials = {};
  if (typeof credentials === 'string') {
    try {
      creds = JSON.parse(credentials);
    } catch (err: unknown) {
      throw new Error(
        `Error parsing string credentials: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  } else if (credentials && typeof credentials === 'object') {
    creds = credentials;
  }

  const serviceKeyRaw = creds[AuthKeys.GOOGLE_SERVICE_KEY] ?? {};
  const serviceKey =
    typeof serviceKeyRaw === 'string' ? JSON.parse(serviceKeyRaw) : (serviceKeyRaw ?? {});

  const apiKey = creds[AuthKeys.GOOGLE_API_KEY] ?? null;
  const project_id = !apiKey ? (serviceKey?.project_id ?? null) : null;

  const reverseProxyUrl = options.reverseProxyUrl;
  const authHeader = options.authHeader;

  const {
    web_search,
    thinking = googleSettings.thinking.default,
    thinkingBudget = googleSettings.thinkingBudget.default,
    ...modelOptions
  } = options.modelOptions || {};

  let enableWebSearch = web_search;

  const llmConfig: GoogleClientOptions | VertexAIClientOptions = removeNullishValues({
    ...(modelOptions || {}),
    model: modelOptions?.model ?? '',
    maxRetries: 2,
    topP: modelOptions?.topP ?? undefined,
    topK: modelOptions?.topK ?? undefined,
    temperature: modelOptions?.temperature ?? undefined,
    maxOutputTokens: modelOptions?.maxOutputTokens ?? undefined,
  });

  /** Used only for Safety Settings */
  llmConfig.safetySettings = getSafetySettings(llmConfig.model);

  let provider;

  if (project_id) {
    provider = Providers.VERTEXAI;
  } else {
    provider = Providers.GOOGLE;
  }

  // If we have a GCP project => Vertex AI
  if (provider === Providers.VERTEXAI) {
    (llmConfig as VertexAIClientOptions).authOptions = {
      credentials: { ...serviceKey },
      projectId: project_id,
    };
    (llmConfig as VertexAIClientOptions).location = getValidatedLocation();
  } else if (apiKey && provider === Providers.GOOGLE) {
    llmConfig.apiKey = apiKey;
  } else {
    throw new Error(
      `Invalid credentials provided. Please provide either a valid API key or service account credentials for Google Cloud.`,
    );
  }

  // Check if model supports thinking before enabling it
  const modelSupportsThinking = supportsThinking(llmConfig.model);
  const shouldEnableThinking =
    modelSupportsThinking &&
    thinking &&
    thinkingBudget != null &&
    (thinkingBudget > 0 || thinkingBudget === -1);

  logger.info(
    `[GoogleConfig] Model: ${llmConfig.model}, Supports Thinking: ${modelSupportsThinking}, Should Enable: ${shouldEnableThinking}`,
  );

  if (shouldEnableThinking && provider === Providers.GOOGLE) {
    (llmConfig as GoogleClientOptions).thinkingConfig = {
      thinkingBudget: thinking ? thinkingBudget : googleSettings.thinkingBudget.default,
      includeThoughts: Boolean(thinking),
    };
    logger.info('[GoogleConfig] Thinking parameters SET for Google GenAI');
  } else if (shouldEnableThinking && provider === Providers.VERTEXAI) {
    (llmConfig as VertexAIClientOptions).thinkingBudget = thinking
      ? thinkingBudget
      : googleSettings.thinkingBudget.default;
    (llmConfig as VertexAIClientOptions).includeThoughts = Boolean(thinking);
    logger.info('[GoogleConfig] Thinking parameters SET for Vertex AI');
  } else if (!modelSupportsThinking && (thinking || thinkingBudget)) {
    logger.info(
      `[GoogleConfig] Thinking parameters NOT set - model ${llmConfig.model} does not support thinking`,
    );
  }

  /*
  let legacyOptions = {};
  // Filter out any "examples" that are empty
  legacyOptions.examples = (legacyOptions.examples ?? [])
    .filter(Boolean)
    .filter((obj) => obj?.input?.content !== '' && obj?.output?.content !== '');

  // If user has "examples" from legacyOptions, push them onto llmConfig
  if (legacyOptions.examples?.length) {
    llmConfig.examples = legacyOptions.examples.map((ex) => {
      const { input, output } = ex;
      if (!input?.content || !output?.content) {return undefined;}
      return {
        input: new HumanMessage(input.content),
        output: new AIMessage(output.content),
      };
    }).filter(Boolean);
  }
  */

  if (reverseProxyUrl) {
    (llmConfig as GoogleClientOptions).baseUrl = reverseProxyUrl;
  }

  if (authHeader) {
    (llmConfig as GoogleClientOptions).customHeaders = {
      Authorization: `Bearer ${apiKey}`,
    };
  }

  /** Handle defaultParams first - only process Google-native params if undefined */
  if (options.defaultParams && typeof options.defaultParams === 'object') {
    for (const [key, value] of Object.entries(options.defaultParams)) {
      /** Handle web_search separately - don't add to config */
      if (key === 'web_search') {
        if (enableWebSearch === undefined && typeof value === 'boolean') {
          enableWebSearch = value;
        }
        continue;
      }

      if (knownGoogleParams.has(key)) {
        /** Route known Google params to llmConfig only if undefined */
        applyDefaultParams(llmConfig as Record<string, unknown>, { [key]: value });
      }
      /** Leave other params for transform to handle - they might be OpenAI params */
    }
  }

  /** Handle addParams - can override defaultParams */
  if (options.addParams && typeof options.addParams === 'object') {
    for (const [key, value] of Object.entries(options.addParams)) {
      /** Handle web_search separately - don't add to config */
      if (key === 'web_search') {
        if (typeof value === 'boolean') {
          enableWebSearch = value;
        }
        continue;
      }

      if (knownGoogleParams.has(key)) {
        /** Route known Google params to llmConfig */
        (llmConfig as Record<string, unknown>)[key] = value;
      }
      /** Leave other params for transform to handle - they might be OpenAI params */
    }
  }

  /** Handle dropParams - only drop from Google config */
  if (options.dropParams && Array.isArray(options.dropParams)) {
    options.dropParams.forEach((param) => {
      if (param === 'web_search') {
        enableWebSearch = false;
        return;
      }

      if (param in llmConfig) {
        delete (llmConfig as Record<string, unknown>)[param];
      }
    });
  }

  const tools: GoogleAIToolType[] = [];

  if (enableWebSearch) {
    tools.push({ googleSearch: {} });
  }

  // Return the final shape
  return {
    /** @type {GoogleAIToolType[]} */
    tools,
    /** @type {Providers.GOOGLE | Providers.VERTEXAI} */
    provider,
    /** @type {GoogleClientOptions | VertexAIClientOptions} */
    llmConfig,
  };
}
