import getPort from 'get-port';

// Share the Lab's assigned port map. JO_PORT_* remains supported for supervised
// local runs, while ordinary CI uses the same ephemeral allocation as the Lab.
export async function updatePorts() {
  const assigned = JSON.parse(process.env.MF_LAB_PORTS || '{}');
  const result = {};
  const used = new Set();
  for (const [name, suffix] of [
    ['host', 'HOST'],
    ['assets', 'ASSETS'],
    ['hostB', 'HOST_B'],
  ]) {
    let port = Number(assigned[name] || process.env[`JO_PORT_${suffix}`]);
    if (!port) {
      do port = await getPort();
      while (used.has(port));
    }
    if (!Number.isInteger(port) || port <= 0 || port > 65535 || used.has(port))
      throw new Error(`Invalid or duplicate SSR update port ${name}: ${port}`);
    used.add(port);
    result[name] = port;
  }
  return result;
}
