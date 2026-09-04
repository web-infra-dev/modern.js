import { PassThrough, Readable, Transform } from 'stream';
import { StringDecoder } from 'string_decoder';
import { storage } from '@modern-js/runtime-utils/node';
import { SSR_HYDRATION_ID_PREFIX } from '@modern-js/utils/universal/constants';
import type { ReactElement } from 'react';
import { ESCAPED_SHELL_STREAM_END_MARK } from '../../../common';
import { RenderLevel } from '../../constants';
import { getGlobalInternalRuntimeContext } from '../../context';
import { getMonitors } from '../../context/monitors';
import { enqueueFromEntries } from './deferredScript';
import { DeferredScriptOutputCoordinator } from './deferredScriptOutputCoordinator';
import {
  type CreateReadableStreamFromElement,
  ShellChunkStatus,
  getReadableStreamFromString,
  resolveStreamingMode,
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

    const { onReady } = resolveStreamingMode(request, forceStream2String);

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
          identifierPrefix: SSR_HYDRATION_ID_PREFIX,
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
              const decoder = new StringDecoder('utf8');
              const pendingScripts: string[] = [];
              const outputState: {
                coordinator?: DeferredScriptOutputCoordinator;
              } = {};
              let deferredResolversComplete = Promise.resolve();

              const writeReact = (content: string) => {
                if (!outputState.coordinator) {
                  throw new Error('Deferred script coordinator is not ready');
                }
                outputState.coordinator.writeReact(content);
              };

              const body = new Transform({
                transform(chunk, _encoding, callback) {
                  try {
                    if (shellChunkStatus !== ShellChunkStatus.FINISH) {
                      chunkVec.push(
                        Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk),
                      );
                      /**
                       * The shell content of App may be splitted by multiple chunks to transform,
                       * when any node value's size is larger than the React limitation, refer to:
                       * https://github.com/facebook/react/blob/v18.2.0/packages/react-server/src/ReactServerStreamConfigNode.js#L53.
                       * So we use the `SHELL_STREAM_END_MARK` to mark the shell content' tail.
                       *
                       * The marker can also land in the middle of a chunk that already carries
                       * suspense-boundary content emitted right after the shell (React's chunk
                       * boundaries are byte-driven, not render-phase-driven). Concat first so
                       * we also catch markers that straddle two chunks, then split the buffered
                       * content at the marker: everything before goes between shellBefore and
                       * shellAfter; everything after goes out as-is so it lands past the
                       * closing `</html>` instead of being swallowed inside it.
                       */
                      const concatedChunk = Buffer.concat(
                        chunkVec as any,
                      ).toString('utf-8');
                      const markerIndex = concatedChunk.indexOf(
                        ESCAPED_SHELL_STREAM_END_MARK,
                      );
                      if (markerIndex !== -1) {
                        const beforeMark = concatedChunk.slice(0, markerIndex);
                        const afterMark = concatedChunk.slice(
                          markerIndex + ESCAPED_SHELL_STREAM_END_MARK.length,
                        );

                        shellChunkStatus = ShellChunkStatus.FINISH;
                        writeReact(`${shellBefore}${beforeMark}${shellAfter}`);
                        if (afterMark) {
                          writeReact(afterMark);
                        }
                        // FINISH retains its shell lifecycle meaning. The coordinator
                        // becomes eligible only after this marker chunk's afterMark
                        // bytes have been observed, preserving their original order.
                        if (outputState.coordinator) {
                          outputState.coordinator.markShellFinished();
                          for (const script of pendingScripts) {
                            outputState.coordinator.enqueueResolver(script);
                          }
                          pendingScripts.length = 0;
                        }
                      }
                    } else {
                      const decodedChunk = decoder.write(
                        Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk),
                      );
                      writeReact(decodedChunk);
                    }
                    callback();
                  } catch (e) {
                    if (e instanceof Error) {
                      callback(e);
                    } else {
                      callback(
                        new Error('Received unknown error when streaming'),
                      );
                    }
                  }
                },
                flush(callback) {
                  try {
                    writeReact(decoder.end());
                  } catch (error) {
                    callback(
                      error instanceof Error
                        ? error
                        : new Error('Received unknown error when streaming'),
                    );
                    return;
                  }

                  deferredResolversComplete.then(
                    () => {
                      try {
                        outputState.coordinator?.finish();
                        callback();
                      } catch (error) {
                        callback(
                          error instanceof Error
                            ? error
                            : new Error(
                                'Received unknown error when streaming',
                              ),
                        );
                      }
                    },
                    error => {
                      callback(
                        error instanceof Error
                          ? error
                          : new Error('Received unknown error when streaming'),
                      );
                    },
                  );
                },
              });

              const coordinator = new DeferredScriptOutputCoordinator(
                content => {
                  body.push(content);
                },
              );
              outputState.coordinator = coordinator;
              body.once('close', () => {
                coordinator.abort();
              });

              const passThrough = new PassThrough();

              // Transform the Node.js readable stream to a Web ReadableStream
              // For modern.js depend on hono.js, and we use Web standard
              const stream = Readable.toWeb(body) as ReadableStream<Uint8Array>;
              resolve(stream);

              let processedStream: NodeJS.ReadWriteStream = passThrough;
              extenders.forEach(extender => {
                if (extender.processStream) {
                  processedStream = extender.processStream(processedStream);
                }
              });

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
                    if (!outputState.coordinator) {
                      throw new Error(
                        'Deferred script coordinator is not ready',
                      );
                    }
                    if (shellChunkStatus === ShellChunkStatus.FINISH) {
                      outputState.coordinator.enqueueResolver(s);
                    } else {
                      pendingScripts.push(s);
                    }
                  };

                  deferredResolversComplete = enqueueFromEntries(
                    entries,
                    config.nonce,
                    enqueueScript,
                  );
                }
              } catch (err) {
                const monitors = getMonitors();
                monitors.error('cannot inject router data script', err);
              }

              reactStreamingPipe(passThrough);

              processedStream.pipe(body);
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
