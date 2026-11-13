/** Only explicitly public browser metadata crosses the SSR boundary. */
export interface SSRClientRemote {
  name: string;
  entry: string;
  type?: string;
  entryGlobalName?: string;
}

export function clientRemote(value: SSRClientRemote): SSRClientRemote {
  if (
    typeof value?.name !== 'string' ||
    !value.name ||
    typeof value.entry !== 'string' ||
    !value.entry
  )
    throw new TypeError('A public client remote name and entry are required');
  const url = new URL(value.entry, 'https://relative.invalid');
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    value.entry.startsWith('//') ||
    (!/^https?:\/\//.test(value.entry) && !value.entry.startsWith('/'))
  )
    throw new TypeError(
      'Client remote entry must be a public HTTP(S) or root-relative URL without credentials',
    );
  return {
    name: value.name,
    entry: value.entry,
    ...(value.type ? { type: value.type } : {}),
    ...(value.entryGlobalName
      ? { entryGlobalName: value.entryGlobalName }
      : {}),
  };
}

export function releaseScript(
  name: string,
  revision: number,
  remotes: SSRClientRemote[],
) {
  const json = JSON.stringify({ name, revision, remotes }).replace(
    /[<>&\u2028\u2029]/g,
    character => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`,
  );
  return `<script type="application/json" data-modern-mf-release>${json}</script>`;
}
