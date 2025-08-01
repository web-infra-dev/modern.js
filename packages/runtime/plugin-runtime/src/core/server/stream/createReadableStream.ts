import { Transform } from 'stream';
import { createReadableStreamFromReadable } from '@modern-js/runtime-utils/node';
import checkIsBot from 'isbot';
import { ESCAPED_SHELL_STREAM_END_MARK } from '../../../common';
import { RenderLevel } from '../../constants';
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

    const chunkVec: string[] = [];

    return new Promise(resolve => {
      const { pipe: reactStreamingPipe } = renderToPipeableStream(rootElement, {
        nonce: config.nonce,
        [onReady]() {
          const styledComponentsStyleTags = '';
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

            reactStreamingPipe(body);
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
