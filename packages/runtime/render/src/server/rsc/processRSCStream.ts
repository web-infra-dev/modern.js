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
        const scriptTag = `<script>(self.__FLIGHT_DATA||=[]).push(${chunk})</script>`;
        controller.enqueue(encoder.encode(scriptTag));
      } catch (err) {
        const base64 = JSON.stringify(btoa(String.fromCodePoint(...value)));
        const scriptTag = `<script>(self.__FLIGHT_DATA||=[]).push(Uint8Array.from(atob(${base64}), m => m.codePointAt(0)))</script>`;
        controller.enqueue(encoder.encode(scriptTag));
      }
    }

    const remaining = decoder.decode();
    if (remaining.length) {
      const scriptTag = `<script>(self.__FLIGHT_DATA||=[]).push(${JSON.stringify(remaining)})</script>`;
      controller.enqueue(encoder.encode(scriptTag));
    }

    controller.close();
  } catch (error) {
    controller.error(error);
  }
}
