// Escape closing script tags and HTML comments in JS content.
// https://www.w3.org/TR/html52/semantics-scripting.html#restrictions-for-contents-of-script-elements
// Avoid replacing </script with <\/script as it would break the following valid JS: 0</script/ (i.e. regexp literal).
// Instead, escape the s character.
function escapeScript(script: string): string {
  return script.replace(/<!--/g, '<\\!--').replace(/<\/(script)/gi, '</\\$1');
}

export async function processRSCStream(
  rscStream: ReadableStream,
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
) {
  try {
    const reader = rscStream.getReader();
    const decoder = new TextDecoder('utf-8', { fatal: true });

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      try {
        const chunk = JSON.stringify(decoder.decode(value, { stream: true }));
        const scriptContent = `(self.__FLIGHT_DATA||=[]).push(${chunk})`;
        const scriptTag = `<script>${escapeScript(scriptContent)}</script>`;
        controller.enqueue(encoder.encode(scriptTag));
      } catch (err) {
        const base64 = JSON.stringify(btoa(String.fromCodePoint(...value)));
        const scriptContent = `(self.__FLIGHT_DATA||=[]).push(Uint8Array.from(atob(${base64}), m => m.codePointAt(0)))`;
        const scriptTag = `<script>${escapeScript(scriptContent)}</script>`;
        controller.enqueue(encoder.encode(scriptTag));
      }
    }

    const remaining = decoder.decode();
    if (remaining.length) {
      const scriptContent = `(self.__FLIGHT_DATA||=[]).push(${JSON.stringify(remaining)})`;
      const scriptTag = `<script>${escapeScript(scriptContent)}</script>`;
      controller.enqueue(encoder.encode(scriptTag));
    }

    controller.close();
  } catch (error) {
    controller.error(error);
  }
}
