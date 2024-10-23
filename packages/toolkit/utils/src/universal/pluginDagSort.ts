export const pluginDagSort = <P extends Record<string, any>>(
  plugins: P[],
  key = 'name',
  preKey = 'pre',
  postKey = 'post',
  weightKey = 'weight',
): P[] => {
  type PluginQueryCondition = P | string;
  const pluginMap = new Map(plugins.map(p => [p[key], p]));
  let allLines: [string, string, number][] = [];

  function getPluginByAny(q: PluginQueryCondition) {
    const target = pluginMap.get(typeof q === 'string' ? q : q[key]);
    if (!target) {
      throw new Error(`Plugin ${q} not existed`);
    }
    return target;
  }

  plugins.forEach(plugin => {
    const pluginName = plugin[key];

    plugin[preKey]?.forEach((preDep: PluginQueryCondition) => {
      // compatibility: do not add the plugin-name that plugins not have
      if (pluginMap.has(preDep)) {
        allLines.push([
          getPluginByAny(preDep)[key],
          pluginName,
          plugin[weightKey] || 5,
        ]);
      }
    });

    plugin[postKey]?.forEach((postDep: PluginQueryCondition) => {
      // compatibility: do not add the plugin-name that plugins not have
      if (pluginMap.has(postDep)) {
        allLines.push([
          pluginName,
          getPluginByAny(postDep)[key],
          plugin[weightKey] || 5,
        ]);
      }
    });
  });

  // search the zero input plugin
  let zeroEndPoints = plugins.filter(
    item => !allLines.find(l => l[1] === item[key]),
  );

  const sortedPoint: P[] = [];
  while (zeroEndPoints.length) {
    zeroEndPoints.sort((a, b) => {
      const aOutDegree = allLines
        .filter(l => l[0] === a[key])
        .reduce((sum, l) => sum + l[2], 0);
      const bOutDegree = allLines
        .filter(l => l[0] === b[key])
        .reduce((sum, l) => sum + l[2], 0);
      return bOutDegree - aOutDegree;
    });

    const zep = zeroEndPoints.shift();
    sortedPoint.push(getPluginByAny(zep!));
    allLines = allLines.filter(l => l[0] !== getPluginByAny(zep!)[key]);

    const restPoints = plugins.filter(
      item => !sortedPoint.find(sp => sp[key] === item[key]),
    );
    zeroEndPoints = restPoints.filter(
      item => !allLines.find(l => l[1] === item[key]),
    );
  }
  // if has ring, throw error
  if (allLines.length) {
    const cyclePlugins = new Set();
    allLines.forEach(([from, to]) => {
      cyclePlugins.add(from);
      cyclePlugins.add(to);
    });

    throw new Error(
      `Plugins dependencies have a loop involving: ${Array.from(cyclePlugins).join(', ')}`,
    );
  }
  return sortedPoint;
};
