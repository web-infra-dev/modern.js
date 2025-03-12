import type { Context } from 'hono';
import { createStorage } from './utils/storage';

const { run, useContext } = createStorage<Context>();

export { run, useContext };
