// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-multi-assign */

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  // eslint-disable-next-line node/no-exports-assign
  const config = (exports = {});

  // use for cookie sign key, should change to your own and keep security
  config.keys = `${appInfo.name}_1629203606760_3869`;

  // add your middleware config here
  config.middleware = [];

  config.security = { csrf: { enable: false } };

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };

  config.multipart = {
    mode: 'file',
  };

  return {
    ...config,
    ...userConfig,
  };
};
