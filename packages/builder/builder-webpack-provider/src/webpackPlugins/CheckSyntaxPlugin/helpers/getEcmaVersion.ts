import { browserslist } from '@modern-js/utils';
import { features, feature as featureUnpack } from 'caniuse-lite';

export function getEcmaVersion(targets: string[]) {
  let version = 5;
  if (targets.every(target => checkIsSupportBrowser(`es6`, target))) {
    version = 6;
  }
  return version;
}

function checkIsSupportBrowser(feature: string, browsers: string) {
  const data = featureUnpack(features[feature]);

  return browserslist(browsers, { ignoreUnknownVersions: true })
    .map(browser => browser.split(' '))
    .every(
      browser =>
        data.stats[browser[0]]?.[browser[1]]?.includes('y') ||
        data.stats[browser[0]]?.[browser[1]]?.includes('a'),
    );
}
