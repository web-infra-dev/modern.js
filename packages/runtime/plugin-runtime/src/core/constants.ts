export enum RenderLevel {
  CLIENT_RENDER = 0,
  SERVER_RENDER = 2,
}

export const SSR_DATA_JSON_ID = '__MODERN_SSR_DATA__';

export const ROUTER_DATA_JSON_ID = '__MODERN_ROUTER_DATA__';

// React useId identifier prefix - re-export from @modern-js/utils for consistency
// This ensures SSR and client hydration use the same ID prefix
export { SSR_HYDRATION_ID_PREFIX } from '@modern-js/utils/universal/constants';
