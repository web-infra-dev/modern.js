import { PassThrough, Transform } from 'node:stream';
import {
  createReadableStreamFromReadable,
  storage,
} from '@modern-js/runtime-utils/node';
import checkIsBot from 'isbot';
import type { ReactElement } from 'react';
import { ESCAPED_SHELL_STREAM_END_MARK } from '../../../common';
import { RenderLevel } from '../../constants';
import { getGlobalInternalRuntimeContext } from '../../context';
import { getMonitors } from '../../context/monitors';
import { enqueueFromEntries } from './deferredScript';
import {
  type CreateReadableStreamFromElement,
  ShellChunkStatus,
  getReadableStreamFromString,
} from './shared';
import { getTemplates } from './template';

const defaultExtender = {
  modifyRootElement: (rootElement: ReactElement) => rootElement,
  getStyleTags: () => '',
  processStream: (stream: NodeJS.ReadWriteStream) => stream,
};

export const createReadableStreamFromElement: CreateReadableStreamFromElement =
  async (request, rootElement, options) => {
    const { renderToPipeableStream } = await import('react-dom/server');
    const { runtimeContext, htmlTemplate, config, ssrConfig, entryName } =
      options;
    let shellChunkStatus = ShellChunkStatus.START;

    let renderLevel = RenderLevel.SERVER_RENDER;

    const forceStream2String = Boolean(process.env.MODERN_JS_STREAM_TO_STRING);
    // When a crawler visit the page, we should waiting for entrie content of page

    const isbot = checkIsBot(request.headers.get('user-agent'));
    const isSsgRender = request.headers.get('x-modern-ssg-render') === 'true';
    const onReady =
      isbot || isSsgRender || forceStream2String
        ? 'onAllReady'
        : 'onShellReady';

    const internalRuntimeContext = getGlobalInternalRuntimeContext();
    const hooks = internalRuntimeContext.hooks;

    const extenders = hooks.extendStreamSSR.call() || [];

    if (extenders.length === 0) {
      extenders.push(defaultExtender);
    }

    extenders.forEach(extender => {
      if (extender.init) {
        extender.init({
          rootElement,
          forceStream2String,
        });
      }
    });

    let processedRootElement = rootElement;
    extenders.forEach(extender => {
      if (extender.modifyRootElement) {
        processedRootElement = extender.modifyRootElement(processedRootElement);
      }
    });

    const chunkVec: Buffer[] = [];

    return new Promise(resolve => {
      const { pipe: reactStreamingPipe } = renderToPipeableStream(
        processedRootElement,
        {
          nonce: config.nonce,
          [onReady]() {
            let styledComponentsStyleTags = '';
            extenders.forEach(extender => {
              if (extender.getStyleTags) {
                styledComponentsStyleTags += extender.getStyleTags();
              }
            });

            options[onReady]?.();

            getTemplates(htmlTemplate, {
              request,
              ssrConfig,
              renderLevel,
              runtimeContext,
              config,
              entryName,
              styledComponentsStyleTags,
            }).then(({ shellAfter, shellBefore }) => {
              const pendingScripts: string[] = [];
              const body = new Transform({
                transform(chunk, _encoding, callback) {
                  try {
                    if (shellChunkStatus !== ShellChunkStatus.FINISH) {
                      chunkVec.push(
                        Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk),
                      ); /**
                       * The shell content of App may be splitted by multiple chunks to transform,
                       * when any node value's size is larger than the React limitation, refer to:
                       * https://github.com/facebook/react/blob/v18.2.0/packages/react-server/src/ReactServerStreamConfigNode.js#L53.
                       * So we use the `SHELL_STREAM_END_MARK` to mark the shell content' tail.
                       */
                      const chunkStr = chunk.toString('utf-8');
                      if (chunkStr.includes(ESCAPED_SHELL_STREAM_END_MARK)) {
                        let concatedChunk = Buffer.concat(
                          chunkVec as any,
                        ).toString('utf-8');
                        concatedChunk = concatedChunk.replace(
                          ESCAPED_SHELL_STREAM_END_MARK,
                          '',
                        );

                        shellChunkStatus = ShellChunkStatus.FINISH;
                        this.push(
                          `${shellBefore}${concatedChunk}${shellAfter}`,
                        );
                        // Flush any pending <script> collected before shell finished
                        if (pendingScripts.length > 0) {
                          for (const s of pendingScripts) {
                            this.push(s);
                          }
                        }
                      }
                    } else {
                      this.push(chunk);
                    }
                    callback();
                  } catch (e) {
                    if (e instanceof Error) {
                      callback(e);
                    } else {
                      callback(
                        new Error('Received unkown error when streaming'),
                      );
                    }
                  }
                },
              });

              const passThrough = new PassThrough();

              // Transform the Node.js readable stream to a Web ReadableStream
              // For modern.js depend on hono.js, and we use Web standard
              const stream = createReadableStreamFromReadable(body);
              resolve(stream);

              let processedStream: NodeJS.ReadWriteStream = passThrough;
              extenders.forEach(extender => {
                if (extender.processStream) {
                  processedStream = extender.processStream(processedStream);
                }
              });
              reactStreamingPipe(passThrough);

              processedStream.pipe(body);

              // Inject router data scripts, enqueue until shell finished
              try {
                const storageContext = storage.useContext?.();
                const activeDeferreds = storageContext?.activeDeferreds;

                /**
                 * activeDeferreds is injected into storageContext by @modern-js/runtime.
                 * @see packages/toolkit/runtime-utils/src/browser/nestedRoutes.tsx
                 */
                const entries: Array<[string, unknown]> =
                  activeDeferreds instanceof Map
                    ? Array.from(activeDeferreds.entries())
                    : [];

                if (entries.length > 0) {
                  const enqueueScript = (s: string) => {
                    if (shellChunkStatus === ShellChunkStatus.FINISH) {
                      body.write(s);
                    } else {
                      pendingScripts.push(s);
                    }
                  };

                  enqueueFromEntries(entries, config.nonce, (s: string) =>
                    enqueueScript(s),
                  );
                }
              } catch (err) {
                const monitors = getMonitors();
                monitors.error('cannot inject router data script', err);
              }
            });
          },

          onShellError(error: unknown) {
            renderLevel = RenderLevel.CLIENT_RENDER;
            getTemplates(htmlTemplate, {
              request,
              ssrConfig,
              renderLevel,
              runtimeContext,
              entryName,
              config,
            }).then(({ shellAfter, shellBefore }) => {
              const fallbackHtml = `${shellBefore}${shellAfter}`;

              const readableStream = getReadableStreamFromString(fallbackHtml);
              resolve(readableStream);
              options?.onShellError?.(error);
            });
          },
          onError(error: unknown) {
            renderLevel = RenderLevel.CLIENT_RENDER;

            options?.onError?.(error);
          },
        },
      );
    });
  };
