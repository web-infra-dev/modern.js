import { createStorage } from '@modern-js/bff-core';

import type { Context } from 'koa';

export type { Context };

const { run, useContext } = createStorage<Context>();

export { run, useContext };
