import { createStorage } from '@modern-js/bff-core';
import type { Context } from 'egg';

const { run, useContext } = createStorage<Context>();

export { run, useContext };

export type { Context };
