import { proxy } from 'valtio';
import { ReadonlyDeep } from 'type-fest';
import _ from 'lodash';
import { ModifyHeaderRule, ServiceStatus } from '@/utils/service-agent';

const SERVICE_SCRIPT = '/sw-proxy.js';

export const registerService = async (
  rules: ReadonlyDeep<ModifyHeaderRule[]> = [],
) => {
  const encodedRules = encodeURIComponent(JSON.stringify(rules));
  const url = `${SERVICE_SCRIPT}?rules=${encodedRules}`;
  const reg = await navigator.serviceWorker.register(url);
  await navigator.serviceWorker.ready;
  $state.service = await fetchServiceStatus();
  return reg;
};

export const unregisterService = async () => {
  const registrations = await navigator.serviceWorker.getRegistrations();
  let success = true;
  for (const reg of registrations) {
    success = success && (await reg.unregister());
  }
  $state.service = Promise.resolve({});
  return success;
};

const FETCH_STATUS_RETRY = 3;
const FETCH_STATUS_TIMEOUT = 300;

export const fetchServiceStatus = async (): Promise<Partial<ServiceStatus>> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const _i of _.times(FETCH_STATUS_RETRY)) {
    try {
      const signal = AbortSignal.timeout(FETCH_STATUS_TIMEOUT);
      const resp = await fetch('/__devtools/service/status', { signal });
      const body = await resp.json();
      return body;
    } catch {}
  }
  return {};
};

type PromiseOrNot<T> = Promise<T> | T;

export interface State {
  service: PromiseOrNot<Partial<ServiceStatus>>;
}

export const $state = proxy<State>({
  service: fetchServiceStatus(),
});
