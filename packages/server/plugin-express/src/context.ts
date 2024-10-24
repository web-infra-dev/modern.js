import { createStorage } from '@modern-js/bff-core';
import type { Request, Response } from 'express';

export type Context = { req: Request; res: Response };

const { run, useContext } = createStorage<Context>();

export { run, useContext };
