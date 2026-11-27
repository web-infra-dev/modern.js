import React from 'react';
import type { RouteObject } from '@modern-js/runtime-utils/router';
import { serializeJson } from '@modern-js/runtime-utils/node';
import type { RuntimePlugin } from '../../core';
import type { RouterExtendsHooks } from '../../router/runtime/hooks';
import { ApplicationsReactContext } from './context';
import {
  getActiveApplicationsStore,
  runWithApplicationsStore,
  setActiveApplicationsStore,
} from './registry.node';
import { createServerDynamicRoutesBuilder } from './routes.node';
import {
  injectApplicationsIntoLoaders,
  mergeDynamicRoutes,
} from './routes.shared';
import { createApplicationsStore, type ApplicationsStore } from './store';
import {
  APPLICATIONS_DATA_SCRIPT_ID,
  type ApplicationsHooksModule,
} from './types';

export interface ApplicationsRuntimePluginConfig {
  hooks?: ApplicationsHooksModule;
  autoGenerateRoute?: boolean;
  maxDepth?: number;
  timeoutMs?: number;
}

function buildApplicationsScriptTag(
  store: ApplicationsStore,
  nonce?: string,
): string {
  const serialized = store.dehydrate();
  if (!serialized) return '';
  const nonceAttr = nonce ? ` nonce="${nonce}"` : '';
  return `<script id="${APPLICATIONS_DATA_SCRIPT_ID}" type="application/json"${nonceAttr}>${serializeJson(serialized)}</script>`;
}

/** Node SSR runtime plugin registered when `moduleFederation.applications` is enabled. */
export const mfApplicationsPlugin = (
  config: ApplicationsRuntimePluginConfig = {},
): RuntimePlugin<{ extendHooks: RouterExtendsHooks }> => ({
  name: '@modern-js/plugin-mf-applications',
  post: ['@modern-js/plugin-router'],
  setup: api => {
    const autoGenerateRoute = config.autoGenerateRoute ?? true;
    const buildDynamicRoutes = createServerDynamicRoutesBuilder();
    let store: ApplicationsStore | undefined;
    let ownsStore = false;
    let boundMountId = 'root';

    const ensureStore = (context: any): ApplicationsStore | undefined => {
      if (store) return store;
      const isFragment = context.application?.output === 'fragment';
      if (isFragment) {
        const existing = getActiveApplicationsStore();
        if (existing) {
          store = existing;
          return store;
        }
      }
      if (!config.hooks && !isFragment) {
        return undefined;
      }
      const rawRequest = context.ssrContext?.request?.raw as
        Request | undefined;
      const urlString =
        rawRequest?.url ||
        context.application?.initialUrl ||
        'http://localhost/';
      const parsedUrl = new URL(urlString, 'http://localhost');

      store = createApplicationsStore({
        hooks: config.hooks,
        autoGenerateRoute,
        isBrowser: false,
        rootBasename:
          context.application?.basename || context.ssrContext?.baseUrl || '/',
        maxDepth: config.maxDepth,
        timeoutMs: config.timeoutMs,
        request: rawRequest,
        getLocation: () => ({
          pathname: parsedUrl.pathname,
          search: parsedUrl.search,
        }),
      });
      ownsStore = true;
      setActiveApplicationsStore(store);
      return store;
    };

    api.onBeforeRender(async context => {
      const activeStore = ensureStore(context);
      if (!activeStore) return;
      boundMountId = context.application?.mountId || 'root';
      context.applications = activeStore.service;
      if (context.ssrContext?.loaderContext instanceof Map) {
        context.ssrContext.loaderContext.set(
          'applications',
          activeStore.service,
        );
      }

      if (ownsStore) {
        await runWithApplicationsStore(activeStore, () =>
          activeStore.discoverApplications({
            signal: context.ssrContext?.request?.raw?.signal,
          }),
        );
        // Inject hydration script for string SSR via htmlModifiers.
        if (context.ssrContext?.htmlModifiers) {
          const nonce = context.ssrContext.nonce;
          context.ssrContext.htmlModifiers.push(html => {
            if (html.includes(`id="${APPLICATIONS_DATA_SCRIPT_ID}"`)) {
              return html;
            }
            const tag = buildApplicationsScriptTag(activeStore, nonce);
            if (!tag) return html;
            return html.includes('</head>')
              ? html.replace('</head>', `${tag}</head>`)
              : `${tag}${html}`;
          });
        }
      }
    });

    api.extendStreamSSR?.(() => {
      let nonce: string | undefined;
      return {
        init(params) {
          nonce = params.nonce;
        },
        getBootstrapScripts() {
          if (!ownsStore || !store) return '';
          return buildApplicationsScriptTag(store, nonce);
        },
      };
    });

    api.modifyRoutes((routes: RouteObject[]) => {
      if (!store) return routes;
      const dynamicRoutes = autoGenerateRoute
        ? buildDynamicRoutes(
            store.getRoutesForMount(boundMountId),
            boundMountId,
          )
        : [];
      const merged = mergeDynamicRoutes(routes, dynamicRoutes);
      return injectApplicationsIntoLoaders(merged, store.service);
    });

    api.wrapRoot(App => {
      return function ApplicationsRootWrapper(props: Record<string, unknown>) {
        const content = App ? (
          <App {...props} />
        ) : (
          (props.children as React.ReactNode)
        );
        if (!store) return content as React.ReactElement;
        return (
          <ApplicationsReactContext.Provider value={store.service}>
            {content}
          </ApplicationsReactContext.Provider>
        );
      };
    });

    api.onDispose(() => {
      if (ownsStore && store) {
        store.dispose();
      }
      store = undefined;
    });
  },
});

/**
 * Lightweight child Bridge SSR runtime plugin attached automatically when a host
 * renders a child Modern application with a discovered `mountId`.
 */
export function createChildApplicationsPlugin(
  mountId: string,
): RuntimePlugin<{ extendHooks: RouterExtendsHooks }> {
  return {
    name: '@modern-js/plugin-mf-applications-child',
    post: ['@modern-js/plugin-router'],
    setup: api => {
      const store = getActiveApplicationsStore();
      if (!store) return;
      const buildDynamicRoutes = createServerDynamicRoutesBuilder();

      api.onBeforeRender(context => {
        context.applications = store.service;
        if (context.ssrContext?.loaderContext instanceof Map) {
          context.ssrContext.loaderContext.set('applications', store.service);
        }
      });

      api.modifyRoutes((routes: RouteObject[]) => {
        const dynamicRoutes = buildDynamicRoutes(
          store.getRoutesForMount(mountId),
          mountId,
        );
        const merged = mergeDynamicRoutes(routes, dynamicRoutes);
        return injectApplicationsIntoLoaders(merged, store.service);
      });

      api.wrapRoot(App => {
        return function ChildApplicationsWrapper(
          props: Record<string, unknown>,
        ) {
          const content = App ? (
            <App {...props} />
          ) : (
            (props.children as React.ReactNode)
          );
          return (
            <ApplicationsReactContext.Provider value={store.service}>
              {content}
            </ApplicationsReactContext.Provider>
          );
        };
      });
    },
  };
}
