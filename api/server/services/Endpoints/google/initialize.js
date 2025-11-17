const path = require('path');
const { logger } = require('@librechat/data-schemas');
const { EModelEndpoint, AuthKeys } = require('librechat-data-provider');
const { getGoogleConfig, isEnabled, loadServiceKey } = require('@librechat/api');
const { getUserKey, checkUserKeyExpiry } = require('~/server/services/UserService');
const { GoogleClient } = require('~/app');

const initializeClient = async ({ req, res, endpointOption, overrideModel, optionsOnly }) => {
  const { GOOGLE_KEY, GOOGLE_REVERSE_PROXY, GOOGLE_AUTH_HEADER, PROXY } = process.env;
  const isUserProvided = GOOGLE_KEY === 'user_provided';
  const { key: expiresAt } = req.body;

  let userKey = null;
  if (expiresAt && isUserProvided) {
    checkUserKeyExpiry(expiresAt, EModelEndpoint.google);
    userKey = await getUserKey({ userId: req.user.id, name: EModelEndpoint.google });
  }

  let serviceKey = {};

  /** Check if GOOGLE_KEY is provided at all (including 'user_provided') */
  const isGoogleKeyProvided =
    (GOOGLE_KEY && GOOGLE_KEY.trim() !== '') || (isUserProvided && userKey != null);

  if (!isGoogleKeyProvided) {
    /** Only attempt to load service key if GOOGLE_KEY is not provided */
    try {
      const serviceKeyPath =
        process.env.GOOGLE_SERVICE_KEY_FILE ||
        path.join(__dirname, '../../../..', 'data', 'auth.json');
      serviceKey = await loadServiceKey(serviceKeyPath);
      if (!serviceKey) {
        logger.warn(
          `[Google/Vertex AI] Service key file found but returned null at: ${serviceKeyPath}`,
        );
        logger.warn(
          '[Google/Vertex AI] Neither GOOGLE_KEY nor valid service key is configured. Google endpoint will not be available.',
        );
        serviceKey = {};
      } else {
        logger.info(
          `[Google/Vertex AI] Successfully loaded service key for project: ${serviceKey.project_id}`,
        );
      }
    } catch (error) {
      const serviceKeyPath =
        process.env.GOOGLE_SERVICE_KEY_FILE ||
        path.join(__dirname, '../../../..', 'data', 'auth.json');
      logger.warn(
        `[Google/Vertex AI] Failed to load service key from: ${serviceKeyPath}`,
        error.message,
      );
      logger.warn(
        '[Google/Vertex AI] Vertex AI will not be available. To enable: set GOOGLE_KEY env var or provide a valid service account key file.',
      );
      serviceKey = {};
    }
  }

  const credentials = isUserProvided
    ? userKey
    : {
        [AuthKeys.GOOGLE_SERVICE_KEY]: serviceKey,
        [AuthKeys.GOOGLE_API_KEY]: GOOGLE_KEY,
      };

  let clientOptions = {};

  const appConfig = req.config;
  /** @type {undefined | TBaseEndpoint} */
  const allConfig = appConfig.endpoints?.all;
  /** @type {undefined | TBaseEndpoint} */
  const googleConfig = appConfig.endpoints?.[EModelEndpoint.google];

  if (googleConfig) {
    clientOptions.streamRate = googleConfig.streamRate;
    clientOptions.titleModel = googleConfig.titleModel;
  }

  if (allConfig) {
    clientOptions.streamRate = allConfig.streamRate;
  }

  clientOptions = {
    req,
    res,
    reverseProxyUrl: GOOGLE_REVERSE_PROXY ?? null,
    authHeader: isEnabled(GOOGLE_AUTH_HEADER) ?? null,
    proxy: PROXY ?? null,
    ...clientOptions,
    ...endpointOption,
  };

  if (optionsOnly) {
    clientOptions = Object.assign(
      {
        modelOptions: endpointOption?.model_parameters ?? {},
      },
      clientOptions,
    );
    if (overrideModel) {
      clientOptions.modelOptions.model = overrideModel;
    }
    return getGoogleConfig(credentials, clientOptions);
  }

  const client = new GoogleClient(credentials, clientOptions);

  return {
    client,
    credentials,
  };
};

module.exports = initializeClient;
