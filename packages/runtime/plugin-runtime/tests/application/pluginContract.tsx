import React, { useContext } from 'react';
import { InternalRuntimeContext, RuntimeContext } from '../../src/core/context';
import type { TInternalRuntimeContext } from '../../src/core/context/runtime';
import type { RuntimePlugin } from '../../src/core/plugin';

export function contractGate() {
  let release!: () => void;
  const promise = new Promise<void>(resolve => {
    release = resolve;
  });
  return { promise, release };
}

export function createPluginContract(
  options: {
    setupGate?: Promise<void>;
    hookGate?: Promise<void>;
    error?: Error;
    cleanupError?: Error;
    interrupt?: unknown;
    expectedQuery?: Record<string, string>;
  } = {},
) {
  const records: Array<{
    context: TInternalRuntimeContext;
    events: string[];
    provider?: TInternalRuntimeContext;
    publicData?: unknown;
    api: any;
  }> = [];
  const source: RuntimePlugin = {
    name: 'contract-source',
    async setup(api) {
      const context = api.getRuntimeContext();
      const record = {
        context,
        events: ['setup:source'],
        api,
      } as (typeof records)[number];
      records.push(record);
      expect(context.requestContext.request).toBe(context.ssrContext?.request);
      if (options.expectedQuery)
        expect(context.requestContext.request.query).toEqual(
          options.expectedQuery,
        );
      expect(context.application?.initialUrl).toBeTruthy();
      expect(context.routeManifest).toBeDefined();
      api.onDispose(() => record.events.push('dispose:source'));
      await options.setupGate;
      api.updateRuntimeContext({
        contract: {
          phase: 'setup',
          request: context.requestContext.request.url,
        },
      });
      record.events.push('setup:ready');
      api.config(() => {
        record.events.push('config');
        return {};
      });
      api.onBeforeRender(async (value, interrupt) => {
        expect(value).toBe(context);
        expect(api.getRuntimeContext()).toBe(value);
        record.events.push('before:source');
        await options.hookGate;
        if (options.error) throw options.error;
        if ('interrupt' in options) return interrupt(options.interrupt);
        return {
          ...value,
          contract: { ...(value.contract as object), phase: 'replacement' },
        };
      });
    },
  };
  const consumer: RuntimePlugin = {
    name: 'contract-consumer',
    pre: ['contract-source'],
    setup(api) {
      const context = api.getRuntimeContext();
      const record = records.find(item => item.context === context)!;
      expect((context.contract as any)?.phase).toBe('setup');
      record.events.push('setup:consumer');
      api.onDispose(() => {
        record.events.push('dispose:consumer');
        if (options.cleanupError) throw options.cleanupError;
      });
      api.onBeforeRender(value => {
        expect(value).toBe(context);
        expect(api.getRuntimeContext()).toBe(value);
        expect((value.contract as any).phase).toBe('replacement');
        if (options.expectedQuery)
          expect(value.requestContext.request.query).toEqual(
            options.expectedQuery,
          );
        record.events.push('before:consumer');
        api.updateRuntimeContext({ contract: { phase: 'ready' } });
      });
      api.wrapRoot(App => {
        expect((context.contract as any).phase).toBe('ready');
        record.events.push('wrap:consumer');
        return props => (
          <section data-contract-wrapper>
            <App {...props} />
          </section>
        );
      });
    },
  };
  function Page() {
    const context = useContext(InternalRuntimeContext);
    const publicContext = useContext(RuntimeContext);
    const record = records.find(item => item.context === context)!;
    expect(record).toBeDefined();
    record.provider = context;
    record.publicData = publicContext.contract;
    expect(publicContext.contract).toBe(context.contract);
    if (options.expectedQuery)
      expect(publicContext.requestContext.request.query).toEqual(
        options.expectedQuery,
      );
    const data = publicContext.contract as { phase: string; request: string };
    return <p>{`contract:${data.phase}:${data.request}`}</p>;
  }
  return { plugins: [consumer, source], Page, records };
}

export const preparationEvents = [
  'setup:source',
  'setup:ready',
  'setup:consumer',
  'config',
  'before:source',
  'before:consumer',
  'wrap:consumer',
];
export const disposalEvents = ['dispose:consumer', 'dispose:source'];
