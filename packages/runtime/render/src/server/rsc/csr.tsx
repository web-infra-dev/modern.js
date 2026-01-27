import type { ReactElement } from 'react';
import { injectCSS } from '../../rsc-html-stream/server';
import { processRSCStream } from './processRSCStream';
import { renderRsc } from './rsc';

// @ts-ignore - __rspack_rsc_manifest__ is injected at build time
declare const __rspack_rsc_manifest__:
  | {
      entryCssFiles?: Record<string, string[]>;
    }
  | undefined;

export async function renderCSRWithRSC(options: {
  html: string;
  rscRoot: ReactElement;
}): Promise<Response> {
  // Collect CSS files from entryCssFiles
  const entryCssFiles = __rspack_rsc_manifest__?.entryCssFiles;
  const cssFiles = entryCssFiles ? Object.values(entryCssFiles).flat() : [];

  // Render RSC stream
  const rscPayloadStream = renderRsc({ element: options.rscRoot });

  // Create HTML stream
  const htmlStream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(options.html));
      controller.close();
    },
  });

  // Inject CSS into HTML stream
  const cssInjectedStream = htmlStream.pipeThrough(
    injectCSS(cssFiles, { injectClosingTags: false }),
  );

  // Merge CSS-injected HTML and RSC payload
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        // Read and forward CSS-injected HTML
        const reader = cssInjectedStream.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }

        // Process RSC stream
        await processRSCStream(rscPayloadStream, controller, encoder);
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: new Headers({
      'content-type': 'text/html; charset=UTF-8',
    }),
  });
}
