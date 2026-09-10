import { PassThrough, Readable, Transform, finished } from 'stream';
import { storage } from '@modern-js/runtime-utils/node';
import { SSR_HYDRATION_ID_PREFIX } from '@modern-js/utils/universal/constants';
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
    request.signal.throwIfAborted();
    const { renderToPipeableStream } = await import('react-dom/server');
    request.signal.throwIfAborted();
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

    return new Promise((resolve, reject) => {
      const cancellation = new AbortController();
      const streams = new Set<NodeJS.ReadWriteStream>();
      let stopped = false;
      let abortReact: (reason?: unknown) => void = () => {};
      let renderingDone!: () => void;
      const rendering = new Promise<void>(done => {
        renderingDone = done;
      });
      options.work?.track(rendering);
      const stop = (reason: unknown) => {
        if (stopped) return;
        stopped = true;
        cancellation.abort(reason);
        request.signal.removeEventListener('abort', onAbort);
        abortReact(reason);
        for (const stream of streams) {
          if ('destroy' in stream && typeof stream.destroy === 'function')
            stream.destroy();
        }
        reject(reason);
      };
      const onAbort = () => stop(request.signal.reason);
      const watch = (stream: NodeJS.ReadWriteStream) => {
        if (streams.has(stream)) return;
        streams.add(stream);
        const completion = new Promise<void>(done => {
          const cleanup = finished(stream, error => {
            cleanup();
            if (error) stop(error);
            done();
          });
        });
        options.work?.track(completion);
      };
      const { pipe: reactStreamingPipe, abort } = renderToPipeableStream(
        processedRootElement,
        {
          nonce: config.nonce,
          identifierPrefix: SSR_HYDRATION_ID_PREFIX,
          onAllReady() {
            renderingDone();
            if (!stopped) {
              try {
                options.onAllReady?.();
              } catch (error) {
                stop(error);
              }
            }
          },
          [onReady]() {
            if (onReady === 'onAllReady') renderingDone();
            if (stopped) return;
            const templateWork = Promise.resolve().then(async () => {
              let styledComponentsStyleTags = '';
              extenders.forEach(extender => {
                if (extender.getStyleTags) {
                  styledComponentsStyleTags += extender.getStyleTags();
                }
              });

              options[onReady]?.();

              return getTemplates(htmlTemplate, {
                request,
                ssrConfig,
                renderLevel,
                runtimeContext,
                config,
                entryName,
                styledComponentsStyleTags,
              }).then(({ shellAfter, shellBefore }) => {
                if (stopped) return;
                const pendingScripts: string[] = [];
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
                          const beforeMark = concatedChunk.slice(
                            0,
                            markerIndex,
                          );
                          const afterMark = concatedChunk.slice(
                            markerIndex + ESCAPED_SHELL_STREAM_END_MARK.length,
                          );

                          shellChunkStatus = ShellChunkStatus.FINISH;
                          this.push(`${shellBefore}${beforeMark}${shellAfter}`);
                          if (afterMark) {
                            this.push(afterMark);
                          }
                          // Flush any pending <script> collected before shell finished
                          if (pendingScripts.length > 0) {
                            for (const s of pendingScripts) {
                              this.push(s);
                            }
                            pendingScripts.length = 0;
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
                          new Error('Received unknown error when streaming'),
                        );
                      }
                    }
                  },
                });

                watch(body);
                body.once('close', () => {
                  request.signal.removeEventListener('abort', onAbort);
                  if (!body.readableEnded)
                    stop(new Error('SSR response stream was cancelled'));
                });
                const passThrough = new PassThrough();
                watch(passThrough);

                // Transform the Node.js readable stream to a Web ReadableStream
                // For modern.js depend on hono.js, and we use Web standard
                const stream = Readable.toWeb(
                  body,
                ) as ReadableStream<Uint8Array>;
                resolve(stream);

                let processedStream: NodeJS.ReadWriteStream = passThrough;
                extenders.forEach(extender => {
                  if (extender.processStream) {
                    processedStream = extender.processStream(processedStream);
                    watch(processedStream);
                  }
                });
                let deferredWork = Promise.resolve();
                processedStream.pipe(body, { end: false });
                processedStream.once('end', () => {
                  void deferredWork.then(() => {
                    if (!stopped) body.end();
                  }, stop);
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
                      if (stopped || body.destroyed) return;
                      if (shellChunkStatus === ShellChunkStatus.FINISH) {
                        body.write(s);
                      } else {
                        pendingScripts.push(s);
                      }
                    };

                    deferredWork = enqueueFromEntries(
                      entries,
                      config.nonce,
                      enqueueScript,
                      cancellation.signal,
                    );
                    options.work?.track(deferredWork);
                    void deferredWork.catch(stop);
                  }
                } catch (err) {
                  const monitors = getMonitors();
                  monitors.error('cannot inject router data script', err);
                }
                reactStreamingPipe(passThrough);
              });
            });
            options.work?.track(templateWork);
            void templateWork.catch(stop);
          },

          onShellError(error: unknown) {
            renderingDone();
            if (stopped) return;
            renderLevel = RenderLevel.CLIENT_RENDER;
            const templateWork = getTemplates(htmlTemplate, {
              request,
              ssrConfig,
              renderLevel,
              runtimeContext,
              entryName,
              config,
            }).then(({ shellAfter, shellBefore }) => {
              if (stopped) return;
              const fallbackHtml = `${shellBefore}${shellAfter}`;

              const readableStream = getReadableStreamFromString(fallbackHtml);
              resolve(readableStream);
              options?.onShellError?.(error);
              request.signal.removeEventListener('abort', onAbort);
            });
            options.work?.track(templateWork);
            void templateWork.catch(stop);
          },
          onError(error: unknown) {
            renderLevel = RenderLevel.CLIENT_RENDER;

            try {
              options?.onError?.(error);
            } catch (error) {
              stop(error);
            }
          },
        },
      );
      abortReact = abort;
      request.signal.addEventListener('abort', onAbort, { once: true });
      if (request.signal.aborted) onAbort();
    });
  };
