import { createStorage } from '@modern-js/adapter-helpers';
import { Request, Response } from 'express';

export type Context = { req: Request; res: Response };

const { run, useContext } = createStorage<Context>();

export { run, useContext };
