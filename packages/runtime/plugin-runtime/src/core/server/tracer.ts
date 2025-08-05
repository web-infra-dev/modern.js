import type { OnError, OnTiming } from '@modern-js/app-tools';

export enum SSRTimings {
  PRERENDER = 'ssr-prerender',
  RENDER_HTML = 'ssr-render-html',
  RENDER_SHELL = 'ssr-render-shell',
}

export enum SSRErrors {
  PRERENDER = 'App Prerender',
  RENDER_HTML = 'App Render To HTML',
  RENDER_STREAM = 'An error occurs during streaming SSR',
  RENDER_SHELL = 'An error occurs during streaming render shell',
  LOADER_ERROR = 'App error occurs during data loader',
}

export type Tracer = {
  onError: OnError;
  onTiming: OnTiming;
};
