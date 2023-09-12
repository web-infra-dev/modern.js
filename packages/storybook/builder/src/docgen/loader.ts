// @ts-expect-error
import type { Tinypool } from 'tinypool';

let tinyPoolPromise: Promise<Tinypool> | null = null;

async function docLoader(this: any, source: string, map: string, data: any) {
  const callback = this.async();

  if (!tinyPoolPromise) {
    tinyPoolPromise = import('tinypool').then(({ Tinypool }) => {
      return new Tinypool({
        filename: require.resolve('./process'),
      });
    });
  }

  const tinyPool = await tinyPoolPromise;

  const result: [string, string] | null = await tinyPool.run({
    source,
    map,
    filename: this.resourcePath,
    data,
  });

  if (result) {
    const [docgen, outputMap] = result;
    callback(null, `${source}\n${docgen}`, outputMap, data);
  } else {
    callback(null, source, map, data);
  }
}

export default docLoader;
