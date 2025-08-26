import { PassThrough, Transform } from 'stream';
import type { DeferredData } from '@modern-js/runtime-utils/browser';
import {
  createReadableStreamFromReadable,
  storage,
} from '@modern-js/runtime-utils/node';
import checkIsBot from 'isbot';
import { ServerStyleSheet } from 'styled-components';
import { ESCAPED_SHELL_STREAM_END_MARK } from '../../../common';
import { RenderLevel } from '../../constants';
import { getMonitors } from '../../context/monitors';
import { enqueueFromEntries } from './deferredScript';
import {
  type CreateReadableStreamFromElement,
  ShellChunkStatus,
  getReadableStreamFromString,
} from './shared';
import { getTemplates } from './template';

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
    const onReady = isbot || forceStream2String ? 'onAllReady' : 'onShellReady';

    const sheet = new ServerStyleSheet();

    const chunkVec: string[] = [];

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
          }).then(({ shellAfter, shellBefore }) => {
            const body = new Transform({
              transform(chunk, _encoding, callback) {
                try {
                  if (shellChunkStatus !== ShellChunkStatus.FINISH) {
                    chunkVec.push(chunk.toString());
                    /**
                     * The shell content of App may be splitted by multiple chunks to transform,
                     * when any node value's size is larger than the React limitation, refer to:
                     * https://github.com/facebook/react/blob/v18.2.0/packages/react-server/src/ReactServerStreamConfigNode.js#L53.
                     * So we use the `SHELL_STREAM_END_MARK` to mark the shell content' tail.
                     */
                    let concatedChunk = chunkVec.join('');
                    if (concatedChunk.includes(ESCAPED_SHELL_STREAM_END_MARK)) {
                      concatedChunk = concatedChunk.replace(
                        ESCAPED_SHELL_STREAM_END_MARK,
                        '',
                      );

                      shellChunkStatus = ShellChunkStatus.FINISH;
                      this.push(`${shellBefore}${concatedChunk}${shellAfter}`);
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
            const stream = createReadableStreamFromReadable(body);
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
              const v7Active = storageContext?.activeDeferreds;
              const hasActiveDeferreds = (
                v: unknown,
              ): v is { activeDeferreds?: unknown } =>
                typeof v === 'object' && v !== null && 'activeDeferreds' in v;
              const routerContext = options.runtimeContext?.routerContext;
              const v6Active = hasActiveDeferreds(routerContext)
                ? routerContext.activeDeferreds
                : undefined;

              const entries: Array<[string, unknown]> =
                v7Active instanceof Map
                  ? Array.from(v7Active.entries())
                  : v6Active
                    ? v6Active instanceof Map
                      ? Array.from(v6Active.entries())
                      : Object.entries(v6Active)
                    : [];

              if (entries.length > 0) {
                enqueueFromEntries(entries, config.nonce, (s: string) =>
                  body.write(s),
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
      });
    });
  };
