import { createStorage } from '@modern-js/bff-core';
import type { Request, Response } from 'express';
import type { FastifyRequest } from 'fastify';

export type NestContext = {
  request: Request & FastifyRequest;
  response: Response;
};

const { run, useContext } = createStorage<NestContext>();

export { run, useContext };
