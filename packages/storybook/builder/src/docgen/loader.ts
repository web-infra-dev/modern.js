async function docLoader(this: any, source: string, map: string, data: any) {
  const callback = this.async();

  const { Tinypool } = await import('tinypool');

  const tinyPool = new Tinypool({
    filename: require.resolve('./process'),
  });

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
