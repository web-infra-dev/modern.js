import { IncomingMessage, ServerResponse } from 'http';
import type { Component } from 'react';
import {
  createAsyncManager,
  createAsyncPipeline,
  PluginFromAsyncManager,
  createParallelWorkflow,
} from '@modern-js/plugin';
import { enable } from '@modern-js/plugin/node';
import type {
  ModernServerContext,
  Measure,
  Logger,
} from '@modern-js/types/server';
import type { NormalizedConfig } from '@modern-js/core';

enable();

// collect all middleware register in server plugins
const gather = createParallelWorkflow<{
  addWebMiddleware: (_input: any) => void;
  addAPIMiddleware: (_input: any) => void;
}>();

type ServerInitInput = {
  loggerOptions: any;
  measureOptions: any;
};

type InitExtension = {
  logger: Logger;
  measure: Measure;
};

const create = createAsyncPipeline<ServerInitInput, InitExtension>();

export type Adapter = (
  req: IncomingMessage,
  res: ServerResponse,
) => void | Promise<void>;

export type WebServerStartInput = {
  pwd: string;
  config: Record<string, any>;
};

const prepareWebServer = createAsyncPipeline<WebServerStartInput, Adapter>();

export type APIServerStartInput = {
  pwd: string;
  mode: 'function' | 'framework';
  prefix?: string;
  config?: Record<string, any>;
};
const prepareApiServer = createAsyncPipeline<APIServerStartInput, Adapter>();

const preDevServerInit = createParallelWorkflow<NormalizedConfig, any>();

// eslint-disable-next-line @typescript-eslint/ban-types
const setupCompiler = createParallelWorkflow<{}, any[]>();

const postDevServerInit = createParallelWorkflow<NormalizedConfig, any>();

// TODO FIXME
// eslint-disable-next-line @typescript-eslint/ban-types
export type Route = {};
const beforeRouteSet = createAsyncPipeline<Route[], Route[]>();

const afterRouteSet = createAsyncPipeline();

const preServerInit = createParallelWorkflow<NormalizedConfig, any>();

const postServerInit = createParallelWorkflow<NormalizedConfig, any>();

const listen = createParallelWorkflow<
  {
    ip: string;
    port: number;
  },
  any[]
>();

const beforeServerReset = createParallelWorkflow();

const afterServerReset = createParallelWorkflow();

const extendContext = createAsyncPipeline<
  ModernServerContext,
  ModernServerContext
>();

const handleError = createParallelWorkflow<{ error: Error }>();

export type RequestResult = { isfinish: boolean };
const beforeMatch = createAsyncPipeline<ModernServerContext, RequestResult>();

const afterMatch = createAsyncPipeline<
  { context: ModernServerContext; routeApi: any },
  RequestResult
>();

// TODO FIXME
// eslint-disable-next-line @typescript-eslint/ban-types
export type SSRServerContext = {};
const prefetch = createParallelWorkflow<{
  context: SSRServerContext;
}>();

// TODO FIXME
// eslint-disable-next-line @typescript-eslint/ban-types
export type RenderContext = {};
const renderToString = createAsyncPipeline<
  { App: Component; context: RenderContext },
  string
>();

const beforeRender = createAsyncPipeline<
  { context: ModernServerContext; templateAPI: any },
  RequestResult
>();

const afterRender = createAsyncPipeline<
  { context: ModernServerContext; templateAPI: any },
  any
>();

const beforeSend = createAsyncPipeline<ModernServerContext, RequestResult>();

const afterSend = createParallelWorkflow<{
  context: ModernServerContext;
}>();

export const createServerManager = () =>
  createAsyncManager({
    // server hook
    gather,
    create,
    prepareWebServer,
    prepareApiServer,
    preDevServerInit,
    setupCompiler,
    postDevServerInit,
    beforeRouteSet,
    afterRouteSet,
    preServerInit,
    postServerInit,
    listen,
    beforeServerReset,
    afterServerReset,
    // request hook
    extendContext,
    handleError,
    beforeMatch,
    afterMatch,
    prefetch,
    renderToString,
    beforeRender,
    afterRender,
    beforeSend,
    afterSend,
  });

export const serverManager = createServerManager();

export type ServerPlugin = PluginFromAsyncManager<typeof serverManager>;

export const { createPlugin } = serverManager;

export const collectPlugin = (): Plugin[] => [];
