import { browserslist } from '@modern-js/utils';
import { features, feature as featureUnpack } from 'caniuse-lite';

/**
 * This method only support detect es5 and es6,
 * because caniuse-lite only support `es6` as the feature id
 */
export function getEcmaVersion(targets: string[]) {
  return checkIsSupportBrowser(`es6`, targets) ? 6 : 5;
}

function checkIsSupportBrowser(feature: string, targets: string[]) {
  const data = featureUnpack(features[feature]);

  return browserslist(targets, { ignoreUnknownVersions: true })
    .map(browser => browser.split(' '))
    .every(browser => data.stats[browser[0]]?.[browser[1]]?.startsWith('y'));
}
