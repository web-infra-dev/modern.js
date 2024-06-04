import { Transform, Readable } from 'stream';
import type { RenderToPipeableStreamOptions } from 'react-dom/server';
import { ServerStyleSheet } from 'styled-components';
import { RenderLevel, RuntimeContext, SSRPluginConfig } from '../types';
import { ESCAPED_SHELL_STREAM_END_MARK } from '../../../common';
import { getTemplates } from './template';

enum ShellChunkStatus {
  START = 0,
  FINIESH = 1,
}

function renderToPipe(
  rootElement: React.ReactElement,
  context: RuntimeContext,
  pluginConfig: SSRPluginConfig,
  options?: RenderToPipeableStreamOptions,
) {
  let shellChunkStatus = ShellChunkStatus.START;

  const forceStream2String = Boolean(process.env.MODERN_JS_STREAM_TO_STRING);
  // When a crawler visit the page, we should waiting for entrie content of page
  const onReady =
    context.ssrContext?.isSpider || forceStream2String
      ? 'onAllReady'
      : 'onShellReady';
  const sheet = new ServerStyleSheet();
  const { ssrContext } = context;
  const chunkVec: string[] = [];
  const forUserPipe = new Promise<string | Readable>(resolve => {
    let renderToPipeableStream;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      ({ renderToPipeableStream } = require('react-dom/server'));
    } catch (e) {}
    const root = forceStream2String
      ? sheet.collectStyles(rootElement)
      : rootElement;

    let renderLevel = RenderLevel.SERVER_RENDER;

    const { pipe } = renderToPipeableStream(root, {
      ...options,
      nonce: ssrContext?.nonce,
      [onReady]() {
        const styledComponentsStyleTags = forceStream2String
          ? sheet.getStyleTags()
          : '';
        getTemplates(
          context,
          renderLevel,
          pluginConfig,
          styledComponentsStyleTags,
        ).then(({ shellAfter, shellBefore }) => {
          options?.[onReady]?.();
          const injectableTransform = new Transform({
            transform(chunk, _encoding, callback) {
              try {
                if (shellChunkStatus !== ShellChunkStatus.FINIESH) {
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

                    shellChunkStatus = ShellChunkStatus.FINIESH;
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

          pipe(injectableTransform);
          resolve(injectableTransform);
        });
      },
      onShellError(error: unknown) {
        renderLevel = RenderLevel.CLIENT_RENDER;
        // eslint-disable-next-line promise/no-promise-in-callback
        getTemplates(context, renderLevel, pluginConfig).then(
          ({ shellAfter, shellBefore }) => {
            const fallbackHtml = `${shellBefore}${shellAfter}`;
            resolve(fallbackHtml);
            options?.onShellError?.(error);
          },
        );
      },
      onError(error: unknown) {
        renderLevel = RenderLevel.CLIENT_RENDER;

        options?.onError?.(error);
      },
    });
  });

  return forUserPipe;
}

export default renderToPipe;
