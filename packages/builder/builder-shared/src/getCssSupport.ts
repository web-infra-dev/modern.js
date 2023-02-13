import browserslist from '@modern-js/utils/browserslist';

const CSS_FEATURES_BROWSER = {
  customProperties: {
    and_chr: '49',
    and_ff: '31',
    android: '50',
    chrome: '49',
    edge: '15',
    firefox: '31',
    ios_saf: '9.3',
    op_mob: '36',
    opera: '36',
    safari: '9.1',
    samsung: '5.0',
  },
  initial: {
    and_chr: '37',
    and_ff: '27',
    android: '37',
    chrome: '37',
    edge: '79',
    firefox: '27',
    ios_saf: '9.3',
    op_mob: '24',
    opera: '24',
    safari: '9.1',
    samsung: '3.0',
  },
  pageBreak: {
    and_chr: '51',
    and_ff: '92',
    android: '51',
    chrome: '51',
    edge: '12',
    firefox: '92',
    ios_saf: '10',
    op_mob: '37',
    opera: '11.1',
    safari: '10',
    samsung: '5.0',
  },
  fontVariant: {
    and_chr: '18',
    and_ff: '34',
    android: '4.4',
    chrome: '1',
    edge: '12',
    firefox: '34',
    ios_saf: '9.3',
    op_mob: '12',
    opera: '10',
    safari: '9.1',
    samsung: '1.0',
  },
  mediaMinmax: {
    and_chr: '104',
    and_ff: '109',
    android: '104',
    chrome: '104',
    edge: '104',
    firefox: '63',
    opera: '91',
  },
};

type CssFeatures = keyof typeof CSS_FEATURES_BROWSER;

const getCssFeatureBrowsers = (feature: CssFeatures) => {
  const featureBrowsers = CSS_FEATURES_BROWSER[feature];
  return browserslist(
    Object.entries(featureBrowsers).map(([key, value]) => `${key} >= ${value}`),
  );
};

const isFeatureSupported = (
  projectBrowsers: string[],
  featureBrowsers: string[],
) => projectBrowsers.every(item => featureBrowsers.includes(item));

export function getCssSupport(projectBrowserslist: string[]) {
  const projectBrowsers = browserslist(projectBrowserslist);

  return (Object.keys(CSS_FEATURES_BROWSER) as CssFeatures[]).reduce(
    (acc, key) => {
      acc[key] = isFeatureSupported(
        projectBrowsers,
        getCssFeatureBrowsers(key),
      );
      return acc;
    },
    {} as Record<CssFeatures, boolean>,
  );
}
