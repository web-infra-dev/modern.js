const isStaging = ['STG', 'STAGING'].includes(
  (process.env.DEPLOY_ENV || '').toUpperCase(),
);
// const isLocalDebug = process.env.BUTTER_LOCAL_DEBUG === 'true';

const PROD_SERVICE_ID = 'ttzu9f';
const STG_SERVICE_ID = 'ttiyts';

const SERVICE_ID = isStaging ? STG_SERVICE_ID : PROD_SERVICE_ID;
// let BUTTER_HOST = isStaging
//   ? 'https://butter-staging.bytedance.net'
//   : 'https://butter.bytedance.net';

// if (isLocalDebug) {
//   BUTTER_HOST = 'http://localhost:3000';
// }
const BUTTER_HOST = `https://butter.bytedance.com`;

const BUTTER_REGISTER_ENDPOINT = `${BUTTER_HOST}/open-api/v1/register`;
const BUTTER_UNREGISTER_ENDPOINT = `${BUTTER_HOST}/open-api/v1/unregister`;

const LARKCLOUD_PATH = `https://cloudapi.bytedance.net/faas/services/${SERVICE_ID}`;

const BUTTER_TYPE_ROUTE_MAP = {
  GROUP: 'groups',
  COMP_GROUP: 'component-groups',
  COMP: 'components',
  PLUGIN: 'plugins',
  PRESET: 'presets',
  BLOCK: 'components',
};

export {
  BUTTER_HOST,
  BUTTER_REGISTER_ENDPOINT,
  BUTTER_UNREGISTER_ENDPOINT,
  LARKCLOUD_PATH,
  BUTTER_TYPE_ROUTE_MAP,
};
