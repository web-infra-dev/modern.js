export const worker = () => `
// work entry code
import { createHandler } from "@modern-js/prod-server/worker";
import loadableStats from "../loadable-stats.json";
import routeManifest from "../routes-manifest.json";
import { manifest } from "./manifest";

async function handleRequest(request) {
  const options = {
    request,
    loadableStats,
    routeManifest,
  }
  const handler = createHandler(manifest);

  const { body, status, headers } = await handler(options);

  return new Response(body, {
    status,
    headers,
  });
}

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});
`;
