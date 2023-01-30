import type { ChunkExtractor } from '@loadable/server';

export function getLoadableScripts(extractor: ChunkExtractor) {
  const check = (scripts: string) =>
    (scripts || '').includes('__LOADABLE_REQUIRED_CHUNKS___ext');

  const scripts = extractor.getScriptTags();

  if (!check(scripts)) {
    return '';
  }

  return (
    scripts
      .split('</script>')
      // 前两个 script为 loadable 必须的 script
      .slice(0, 2)
      .map(i => `${i}</script>`)
      .join('')
  );
}

const getLatency = (hrtime: [number, number]) => {
  const [s, ns] = process.hrtime(hrtime);
  return s * 1e3 + ns / 1e6;
};

export const time = () => {
  const hrtime = process.hrtime();

  return () => {
    return getLatency(hrtime);
  };
};
