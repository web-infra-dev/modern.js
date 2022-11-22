export const dagSort = <P extends Record<string, any>>(
  plugins: P[],
  key = 'name',
  preKey = 'pre',
  postKey = 'post',
): P[] => {
  type PluginQueryCondition = P | string;
  let allLines: [string, string][] = [];
  function getPluginByAny(q: PluginQueryCondition) {
    const target = plugins.find(item =>
      typeof q === 'string' ? item[key] === q : item[key] === q[key],
    );
    // current plugin design can't guarantee the plugins in pre/post existed
    if (!target) {
      throw new Error(`plugin ${q} not existed`);
    }
    return target;
  }
  plugins.forEach(item => {
    item[preKey].forEach((p: PluginQueryCondition) => {
      // compatibility: do not add the plugin-name that plugins not have
      if (plugins.find(ap => ap.name === p)) {
        allLines.push([getPluginByAny(p)[key], getPluginByAny(item)[key]]);
      }
    });
    item[postKey].forEach((pt: PluginQueryCondition) => {
      // compatibility: do not add the plugin-name that plugins not have
      if (plugins.find(ap => ap.name === pt)) {
        allLines.push([getPluginByAny(item)[key], getPluginByAny(pt)[key]]);
      }
    });
  });

  // search the zero input plugin
  let zeroEndPoints = plugins.filter(
    item => !allLines.find(l => l[1] === item[key]),
  );

  const sortedPoint: P[] = [];
  while (zeroEndPoints.length) {
    const zep = zeroEndPoints.shift();
    sortedPoint.push(getPluginByAny(zep!));
    allLines = allLines.filter(l => l[0] !== getPluginByAny(zep!)[key]);

    const restPoints = plugins.filter(
      item => !sortedPoint.find(sp => sp[key] === item[key]),
    );
    zeroEndPoints = restPoints.filter(
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      item => !allLines.find(l => l[1] === item[key]),
    );
  }
  // if has ring, throw error
  if (allLines.length) {
    const restInRingPoints: Record<string, boolean> = {};
    allLines.forEach(l => {
      restInRingPoints[l[0]] = true;
      restInRingPoints[l[1]] = true;
    });

    throw new Error(
      `plugins dependences has loop: ${Object.keys(restInRingPoints).join(
        ',',
      )}`,
    );
  }
  return sortedPoint;
};
