import React from 'react';

const RsbuildLInk = ({ configName }: { configName: string }) => {
  const href = `https://rsbuild.dev/config/${configName
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
