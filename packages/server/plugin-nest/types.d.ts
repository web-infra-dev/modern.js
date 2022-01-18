declare module '@modern-js/runtime/server' {
  import type { Request, Response, RequestHandler } from 'express';
  import type { FastifyRequest } from 'fastify';

  export type NestContext = {
    request: Request & FastifyRequest;
    response: Response;
  };
  export function useContext(): NestContext;
  interface Interface {
    new (...input: any): any;
  }
  type NestOptions = {
    addMiddleware: (...input: (Interface | RequestHandler)[]) => void;
  };
  type NestAttacher = (options: NestOptions) => void;
  export function hook(attacher: NestAttacher): NestAttacher;
  export * from '@modern-js/bff-runtime';
}
