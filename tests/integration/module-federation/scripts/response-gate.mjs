// Test-only transport control. Forward the shell normally, then retain the
// producer's exact response bytes until the test releases them.
export function createResponseGate() {
  let held = false;
  let ended = false;
  let source;
  let destination;
  const chunks = [];
  const release = () => {
    held = false;
    for (const chunk of chunks) {
      if (!destination?.destroyed) destination?.write(chunk);
    }
    chunks.length = 0;
    if (ended && !destination?.destroyed) destination?.end();
  };
  return {
    hold() {
      held = true;
    },
    release,
    get buffered() {
      return Buffer.concat(chunks).toString('utf8');
    },
    get ended() {
      return ended;
    },
    pipe(upstream, downstream) {
      source = upstream;
      destination = downstream;
      upstream.on('data', chunk => {
        if (held) chunks.push(Buffer.from(chunk));
        else if (!downstream.destroyed) downstream.write(chunk);
      });
      upstream.once('end', () => {
        ended = true;
        if (!held) downstream.end();
      });
      upstream.once('error', error => downstream.destroy(error));
      downstream.once('close', () => {
        chunks.length = 0;
        upstream.destroy();
      });
    },
    dispose() {
      release();
      source?.destroy();
      destination?.destroy();
    },
  };
}
