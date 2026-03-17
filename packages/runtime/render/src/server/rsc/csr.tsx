import type { ReactElement } from 'react';
import { injectCSS, injectRSCPayload } from '../../rsc-html-stream/server';
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

  // Create a pipeline: HTML -> CSS injection -> RSC payload injection
  const stream = htmlStream
    .pipeThrough(injectCSS(cssFiles, { injectClosingTags: false }))
    .pipeThrough(
      injectRSCPayload(rscPayloadStream, { injectClosingTags: false }),
    );

  return new Response(stream, {
    status: 200,
    headers: new Headers({
      'content-type': 'text/html; charset=UTF-8',
    }),
  });
}
