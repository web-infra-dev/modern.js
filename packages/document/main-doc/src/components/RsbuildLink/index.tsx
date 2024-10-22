import React from 'react';
import { useLang } from 'rspress/runtime';

const RsbuildLInk = ({ configName }: { configName: string }) => {
  const lang = useLang();
  const href = `https://rsbuild.dev/${lang === 'zh' ? 'zh/' : ''}config/${configName
    .split('.')
    .join('/')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()}`;

  return (
    <a href={href} target="__blank">
      Rsbuild - {configName}
    </a>
  );
};

export default RsbuildLInk;
