import { getInstance } from '@module-federation/enhanced/runtime';

export type ApplicationKind = 'bridge' | 'service';

// Fixture experiment: warm browser HTTP resources only. Do not evaluate a
// container, execute loaders, or cache a Service render response/snapshot.
export async function prefetchApplicationResources(kind: ApplicationKind) {
  const remote = getInstance()!.options.remotes.find(
    remote => remote.alias === 'provider' || remote.name === 'provider',
  );
  if (!remote || !('entry' in remote))
    throw Error('Provider manifest not configured');
  const response = await fetch(remote.entry, { cache: 'no-store' });
  if (!response.ok)
    throw Error(`Application manifest returned HTTP ${response.status}`);
  const manifest = await response.json();
  const expose = manifest.exposes.find(
    (item: { name: string }) =>
      item.name ===
      (kind === 'service' ? 'ServiceWeatherApplication' : 'WeatherApplication'),
  );
  if (!expose) throw Error('Application expose not found');
  const base = new URL(manifest.metaData.publicPath, response.url);
  const assets = [expose, ...manifest.shared].flatMap(item =>
    (['js', 'css'] as const).flatMap(type =>
      [...item.assets[type].sync, ...item.assets[type].async].map(
        (asset: string) => ({
          url: new URL(asset, base).href,
          as: type === 'js' ? 'script' : 'style',
        }),
      ),
    ),
  );
  assets.push({
    url: new URL(
      manifest.metaData.remoteEntry.path + manifest.metaData.remoteEntry.name,
      base,
    ).href,
    as: 'script',
  });
  const unique = [...new Map(assets.map(asset => [asset.url, asset])).values()];
  await Promise.all(
    unique.map(
      asset =>
        new Promise<void>((resolve, reject) => {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.as = asset.as;
          link.href = asset.url;
          const timer = window.setTimeout(
            () => finish(Error(`Resource prefetch timed out: ${asset.url}`)),
            15000,
          );
          function finish(error?: Error) {
            clearTimeout(timer);
            link.onload = link.onerror = null;
            link.remove();
            if (error) reject(error);
            else resolve();
          }
          link.onload = () => finish();
          link.onerror = () =>
            finish(Error(`Resource prefetch failed: ${asset.url}`));
          document.head.append(link);
        }),
    ),
  );
  return unique.length;
}
