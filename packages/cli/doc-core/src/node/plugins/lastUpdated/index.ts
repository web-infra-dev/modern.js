import execa from '@modern-js/utils/execa';

function transform(timestamp: number, lang: string) {
  return new Date(timestamp).toLocaleString(lang || 'zh');
}

async function getGitLastUpdatedTimeStamp(filePath: string) {
  let lastUpdated;
  try {
    const { stdout } = await execa('git', [
      'log',
      '-1',
      '--format=%at',
      filePath,
    ]);
    lastUpdated = Number(stdout) * 1000;
  } catch (e) {
    /* noop */
  }
  return lastUpdated;
}

export function pluginLastUpdated() {
  return {
    name: 'last-updated',
    async extendPageData(pageData: any) {
      const { _filepath, lang } = pageData;
      const lastUpdated = await getGitLastUpdatedTimeStamp(_filepath);
      if (lastUpdated) {
        pageData.lastUpdatedTime = transform(lastUpdated, lang);
      }
    },
  };
}
