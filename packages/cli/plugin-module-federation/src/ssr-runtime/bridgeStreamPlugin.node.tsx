import React from 'react';
import type { Readable } from 'node:stream';
import type { RuntimePlugin, RuntimePluginExtends } from '@modern-js/plugin';
import { BridgeSSRContext } from '@module-federation/bridge-react/ssr';
import { createBridgeSSRController } from '@module-federation/bridge-react/ssr-node';

/** Modern supplies the request and document lifecycle. Core owns stream composition. */
export const bridgeStreamPlugin = (): RuntimePlugin<
  Required<RuntimePluginExtends>
> => ({
  name: '@modern-js/module-federation-bridge-stream',
  setup(api) {
    api.extendStreamSSR(() => {
      let controller: ReturnType<typeof createBridgeSSRController>;
      return {
        init(params) {
          const { request, nonce, shellEndMarker, identifierPrefix } = params;
          if (!request || !shellEndMarker || !identifierPrefix) {
            throw new Error(
              'Modern Bridge SSR requires a request, shell marker and identifier prefix.',
            );
          }
          controller = createBridgeSSRController({
            request,
            nonce,
            shellEndMarker,
            identifierPrefix,
            onError(error, instanceId) {
              params.runtimeContext?.ssrContext?.onError?.(
                error,
                `Bridge SSR (${instanceId})`,
              );
            },
          });
        },
        modifyRootElement(element) {
          return (
            <BridgeSSRContext.Provider value={controller.context}>
              {element}
            </BridgeSSRContext.Provider>
          );
        },
        getBootstrapScripts() {
          return controller.getBootstrap();
        },
        processStream(input) {
          return controller.processStream(
            input as unknown as Readable,
          ) as unknown as NodeJS.ReadWriteStream;
        },
        abort(reason?: unknown) {
          controller?.abort(reason);
        },
      };
    });
  },
});
