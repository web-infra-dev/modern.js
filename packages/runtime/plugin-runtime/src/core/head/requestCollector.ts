import type { HelmetProps } from 'react-helmet';

/**
 * react-helmet keeps the mounted instances in a module level list. Streaming
 * SSR renders several requests in turns, and an instance mounted after the
 * shell is never rewound, so the list can carry the tags of one request into
 * the head of another. The server registers a getter that returns the list of
 * the current request, and `Helmet` records its props there instead of
 * mounting react-helmet.
 */
type GetRequestHelmetProps = () => HelmetProps[] | undefined;

const COLLECTOR_KEY = Symbol.for('modern-js.runtime.request-helmet-collector');

type GlobalWithCollector = typeof globalThis & {
  [COLLECTOR_KEY]?: GetRequestHelmetProps;
};

export const setRequestHelmetCollector = (getter: GetRequestHelmetProps) => {
  (globalThis as GlobalWithCollector)[COLLECTOR_KEY] = getter;
};

export const getRequestHelmetProps = (): HelmetProps[] | undefined =>
  (globalThis as GlobalWithCollector)[COLLECTOR_KEY]?.();
