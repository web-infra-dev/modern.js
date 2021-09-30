import { createStorage } from '@modern-js/adapter-helpers';
import type { Context } from 'egg';

const { run, useContext } = createStorage<Context>();

export { run, useContext };

export type { Context };
