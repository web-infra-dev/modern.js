import { createInstance } from '@module-federation/enhanced/runtime';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';
import * as JsxRuntime from 'react/jsx-runtime';
import * as JsxDevRuntime from 'react/jsx-dev-runtime';
import { createMcpView, type McpCapabilities } from './react';

export interface MfViewConfig {
  name: string;
  entry: string;
  expose: string;
}

/** Executed in the application build, so the shell and exposes share its React. */
export function createMfView(config: MfViewConfig) {
  const libs = {
    react: React,
    'react-dom': ReactDOM,
    'react-dom/client': ReactDOMClient,
    'react/jsx-runtime': JsxRuntime,
    'react/jsx-dev-runtime': JsxDevRuntime,
  };
  const runtime = createInstance({
    name: 'modern-mcp-shell',
    remotes: [{ name: config.name, entry: config.entry }],
    shared: Object.fromEntries(
      Object.entries(libs).map(([name, lib]) => [
        name,
        {
          version: React.version,
          lib: () => lib,
          shareConfig: { singleton: true, requiredVersion: React.version },
        },
      ]),
    ),
    shareStrategy: 'loaded-first',
  });
  const Remote = React.lazy(async () => {
    const mod = await runtime.loadRemote<{
      default: React.ComponentType<Record<string, unknown>>;
      mcpCapabilities?: McpCapabilities;
    }>(
      config.expose === './'
        ? config.name
        : `${config.name}/${config.expose.slice(2)}`,
    );
    if (!mod?.default)
      throw new Error(`Missing default export for ${config.expose}`);
    // Read capabilities before the wrapped component initiates the handshake.
    return {
      default: createMcpView(
        mod.default,
        { name: config.name, version: '1.0.0' },
        mod.mcpCapabilities,
      ),
    };
  });
  return function MfView() {
    return (
      <MfErrorBoundary>
        <React.Suspense fallback={<p role="status">Loading component…</p>}>
          <Remote />
        </React.Suspense>
      </MfErrorBoundary>
    );
  };
}
class MfErrorBoundary extends React.Component<
  React.PropsWithChildren,
  { error?: Error }
> {
  state: { error?: Error } = {};
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) return <p role="alert">{this.state.error.message}</p>;
    return this.props.children;
  }
}
