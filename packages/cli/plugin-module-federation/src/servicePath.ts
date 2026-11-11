export const SERVICE_INGRESS_PREFIX = '/_modern/mf/service/';
export const serviceIngressPath = (id: string) =>
  `${SERVICE_INGRESS_PREFIX}${encodeURIComponent(id)}`;

export const SERVICE_RUNTIME_PLUGINS_FILE =
  'server/mf-service-runtime/runtime.cjs';
