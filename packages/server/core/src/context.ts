import type { Context } from 'hono';
import { createStorage } from './utils/storage';

const { run, useHonoContext } = createStorage<Context>();

export { run, useHonoContext };
