import { createStorage } from '@modern-js/adapter-helpers';
import type { Request, Response } from 'express';
import type { FastifyRequest } from 'fastify';

export type NestContext = {
  request: Request & FastifyRequest;
  response: Response;
};

const { run, useContext } = createStorage<NestContext>();

export { run, useContext };
