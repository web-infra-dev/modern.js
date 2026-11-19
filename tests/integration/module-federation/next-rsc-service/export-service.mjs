const fragmentId = 'next-weather-fragment';

// This adapter is pinned to Next's App Router document format. It preserves
// the Flight bytes from the very same render as the HTML, including binary rows.
export function exportServiceFragment(document) {
  const fragment = document.match(new RegExp(`<main id="${fragmentId}"[^>]*>[\\s\\S]*?<\\/main>`))?.[0];
  if (!fragment) throw Error('Next.js document is missing the exported Service fragment');
  const chunks = [];
  for (const entry of document.matchAll(/<script[^>]*>self\.__next_f\.push\((\[[\s\S]*?\])\)<\/script>/g)) {
    const [kind, chunk] = JSON.parse(entry[1]);
    if (kind === 1) chunks.push(Buffer.from(chunk));
    else if (kind === 3) chunks.push(Buffer.from(chunk, 'base64'));
  }
  if (!chunks.length) throw Error('Next.js document is missing Flight data');
  const scripts = Array.from(document.matchAll(
    /<script src="([^"]*\/_next\/static\/chunks\/(?:[0-9a-f]+)-[^"/]+\.js)"[^>]*>/g,
  ), match => new URL(match[1], 'http://localhost').pathname);
  const stylesheets = Array.from(
    document.matchAll(/<link rel="stylesheet" href="([^"]*\/_next\/static\/css\/[^"]+)"/g),
    match => match[1],
  );
  return {
    fragment,
    stylesheets,
    flight: JSON.stringify({ bytes: Buffer.concat(chunks).toString('base64'), scripts }),
  };
}
