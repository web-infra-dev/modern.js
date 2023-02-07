export const worker = () => `
// work entry code
import { createHandler, handleUrl } from "@modern-js/prod-server/worker";
import { manifest } from "./manifest";
async function handleRequest(request) {
  const context = {
    request,
    url: handleUrl(request.url),
    body: null,
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
