import { PassThrough, Readable, Transform } from 'stream';
import { storage } from '@modern-js/runtime-utils/node';
import { ServerStyleSheet } from 'styled-components';
import { ESCAPED_SHELL_STREAM_END_MARK } from '../../../common';
import { RenderLevel } from '../../constants';
import { getMonitors } from '../../context/monitors';
import { enqueueFromEntries } from './deferredScript';
import {
  type CreateReadableStreamFromElement,
  ShellChunkStatus,
  getReadableStreamFromString,
  resolveStreamingMode,
} from './shared';
import { getTemplates } from './template';

export const createReadableStreamFromElement: CreateReadableStreamFromElement =
  async (request, rootElement, options) => {
    const { renderToPipeableStream } = await import('react-dom/server');
    const {
      runtimeContext,
      htmlTemplate,
      config,
      ssrConfig,
      entryName,
      helmetContext,
    } = options;
    let shellChunkStatus = ShellChunkStatus.START;

    let renderLevel = RenderLevel.SERVER_RENDER;

    const forceStream2String = Boolean(process.env.MODERN_JS_STREAM_TO_STRING);
    const { onReady } = resolveStreamingMode(request, forceStream2String);

    const sheet = new ServerStyleSheet();

    const chunkVec: Buffer[] = [];

    const root = sheet.collectStyles(rootElement);

    return new Promise(resolve => {
      const { pipe: reactStreamingPipe } = renderToPipeableStream(root, {
        nonce: config.nonce,
        [onReady]() {
          const styledComponentsStyleTags = forceStream2String
            ? sheet.getStyleTags()
            : '';

          options[onReady]?.();

          getTemplates(htmlTemplate, {
            request,
            ssrConfig,
            renderLevel,
            runtimeContext,
            config,
            entryName,
            styledComponentsStyleTags,
            helmetContext,
          }).then(({ shellAfter, shellBefore }) => {
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
                     */
                    const chunkStr = chunk.toString('utf-8');
                    if (chunkStr.includes(ESCAPED_SHELL_STREAM_END_MARK)) {
                      let concatedChunk =
                        Buffer.concat(chunkVec).toString('utf-8');
                      concatedChunk = concatedChunk.replace(
                        ESCAPED_SHELL_STREAM_END_MARK,
                        '',
                      );

                      shellChunkStatus = ShellChunkStatus.FINISH;
                      this.push(`${shellBefore}${concatedChunk}${shellAfter}`);
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
                    callback(new Error('Received unkown error when streaming'));
                  }
                }
              },
            });

            // Transform the Node.js readable stream to a Web ReadableStream
            // For modern.js depend on hono.js, and we use Web standard
            const stream = Readable.toWeb(body) as ReadableStream<Uint8Array>;
            resolve(stream);

            // Transform the react pipe to a readable stream
            // Actually it's for type check, we even can execute `sheet.interleaveWithNodeStream({ pipe })`
            // Source code https://github.com/styled-components/styled-components/blob/main/packages/styled-components/src/models/ServerStyleSheet.tsx#L80
            const passThrough = new PassThrough();
            const styledStream = sheet.interleaveWithNodeStream(passThrough);
            reactStreamingPipe(passThrough);

            // pipe the styled stream to the body stream
            // now only use styled stream, if there is multiple stream, we can abstract it to a function
            styledStream.pipe(body);

            try {
              const storageContext = storage.useContext?.();
              const routerContext = options.runtimeContext?.routerContext;

              /**
               * When using react-router v6, activeDeferreds is injected into routerContext by react-router.
               * When using react-router v7, activeDeferreds is injected into storageContext by @modern-js/runtime.
               * @see packages/toolkit/runtime-utils/src/browser/nestedRoutes.tsx
               */
              const entries: Array<[string, unknown]> =
                storageContext?.activeDeferreds instanceof Map &&
                storageContext.activeDeferreds?.size > 0
                  ? Array.from(storageContext.activeDeferreds.entries())
                  : routerContext?.activeDeferreds
                    ? Object.entries(routerContext.activeDeferreds)
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
            helmetContext,
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
      });
    });
  };
