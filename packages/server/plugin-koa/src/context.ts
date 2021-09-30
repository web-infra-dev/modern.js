import { createStorage } from '@modern-js/adapter-helpers';

import type { Context } from 'koa';

export type { Context };

const { run, useContext } = createStorage<Context>();

export { run, useContext };
