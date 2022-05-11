import axiosModule from 'axios';
import axiosRetry from 'axios-retry';
import loggerModule from './logger';

const MAX_CONTENT_GB = 500;

const axios = axiosModule.create({
  timeout: 30000,
  maxContentLength: MAX_CONTENT_GB * 1024 * 1024 * 1024,
});
const logger = loggerModule.scope('REQUEST_');

axiosRetry(axios, { retries: 3 });

axios.interceptors.response.use(
  response => response,
  err => {
    const errors = err.response?.data?.errors;
    logger.error(
      err.message,
      err.config.method,
      err.config.url,
      'res.data.errors:',
      errors,
    );
    logger.error(err);
    return Promise.reject(err);
  },
);

export default axios;
