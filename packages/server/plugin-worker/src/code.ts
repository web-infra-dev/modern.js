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
    loadableStats,
    routeManifest,
  };
  const handler = createHandler(manifest);
  const {body, status, headers = new Headers()} = await handler(context);
  headers.set('content-type', 'text/html;charset=UTF-8');
  return new Response(body, {
    status,
    headers,
  });
}

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});
`;
