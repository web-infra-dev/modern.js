import { useLang } from '@rspress/core/runtime';
import React from 'react';

const RsbuildLink = ({ configName }: { configName: string }) => {
  const lang = useLang();
  const href = `https://v2.rsbuild.dev/${lang === 'zh' ? 'zh/' : ''}config/${configName
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

export default RsbuildLink;
