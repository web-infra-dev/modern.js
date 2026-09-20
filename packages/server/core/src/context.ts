import type { Context } from 'hono';
import { createStorage } from './utils/storage';

// Keyed globally so every loaded copy of @modern-js/server-core shares the
// same request context (see utils/storage.ts).
const { run, useHonoContext } = createStorage<Context>(
  '@modern-js/server-core/hono-context',
);

export { run, useHonoContext };
