export enum SSRTimings {
  PRERENDER = 'ssr-prerender',
  RENDER_HTML = 'ssr-render-html',
  RENDER_SHELL = 'ssr-render-shell',
  USE_LOADER = 'use-loader',
}

export enum SSRErrors {
  PRERENDER = 'App Prerender',
  USE_LOADER = 'App run useLoader',
  RENDER_HTML = 'App Render To HTML',
  RENDER_STREAM = 'An error occurs during streaming SSR',
  RENDER_SHELL = 'An error occurs during streaming render shell',
}

export type Tracer = {
  onError: OnError;
  onTiming: OnTiming;
};

export type OnError = (key: SSRErrors, e: unknown) => void;

export function createOnError(onError: (e: unknown) => void): OnError {
  return (key, e) => {
    const error = e instanceof Error ? e : new Error('Unexpected Server Error');

    (error as any).name = key;

    onError(e);
  };
}
export type OnTiming = (key: SSRTimings, cost: number) => void;

export function createOnTiming(
  onTiming: (name: string, dur: number) => void,
): OnTiming {
  return (key, cost) => {
    onTiming(key, cost);
  };
}
