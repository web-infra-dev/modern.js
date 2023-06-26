/**
 * ssr helpers
 */
import type { IncomingHttpHeaders } from 'http';
import { createStorage } from './storage';

const { run, useContext: useHeaders } = createStorage<IncomingHttpHeaders>();

export { run, useHeaders };

export { serializeJson } from './serialize';
export * from './nestedRoutes';
