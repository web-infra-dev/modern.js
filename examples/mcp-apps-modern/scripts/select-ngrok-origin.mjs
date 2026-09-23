/** Select only an HTTPS endpoint forwarding to this local application's port. */
export function selectNgrokOrigin(payload, port) {
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('PORT must be a valid TCP port');
  const matches = (payload.tunnels ?? []).filter(tunnel => {
    try {
      const publicUrl = new URL(tunnel.public_url);
      const upstream = new URL(tunnel.config.addr);
      return (
        publicUrl.protocol === 'https:' &&
        !publicUrl.username &&
        !publicUrl.password &&
        ['localhost', '127.0.0.1', '[::1]'].includes(upstream.hostname) &&
        Number(upstream.port || (upstream.protocol === 'https:' ? 443 : 80)) ===
          port
      );
    } catch {
      return false;
    }
  });
  if (matches.length !== 1)
    throw new Error(
      `Expected one ngrok HTTPS tunnel to localhost:${port}; found ${matches.length}`,
    );
  return new URL(matches[0].public_url).origin;
}
