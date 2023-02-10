export const worker = () => `
// work entry code
import { createHandler, handleUrl } from "@modern-js/prod-server/worker";
import loadableStats from "../loadable-stats.json";
import routeManifest from "../routes-manifest.json";
import { manifest } from "./manifest";
async function handleRequest(request) {
  const context = {
    request: {
      ...request,
      url: request.url,
    },
    url: handleUrl(request.url),
    body: null,
    loadableStats,
    routeManifest,
  };
  const handler = createHandler(manifest);
  await handler(context);
  return new Response(context.body, {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
    },
  });
}

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});
`;
