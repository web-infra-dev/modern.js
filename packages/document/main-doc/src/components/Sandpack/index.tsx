import ModernSandpack, { ModernSandpackProps } from '@modern-js/sandpack-react';
import React, { PropsWithChildren } from 'react';
import { useDark } from 'rspress/runtime';

import './index.css';

const Sandpack = (props: PropsWithChildren<ModernSandpackProps>) => {
  const dark = useDark();
  const { children, ...otherProps } = props;
  const files: Record<string, string> = {};
  React.Children.forEach(children, (child: any) => {
    if (child) {
      const { meta, children } = child.props.children.props;
      const matches = meta.match(/title="(.*)"/);
      if (matches.length > 1) {
        files[matches[1]] = children;
      }
    }
  });
  return (
    <ModernSandpack
      files={files}
      theme={dark ? 'dark' : 'light'}
      {...otherProps}
    />
  );
};
export default Sandpack;
