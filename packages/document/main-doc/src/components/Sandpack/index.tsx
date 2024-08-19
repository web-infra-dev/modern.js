import ModernSandpack, {
  type ModernSandpackProps,
} from '@modern-js/sandpack-react';
import React, { type PropsWithChildren } from 'react';
import { useDark, NoSSR } from 'rspress/runtime';

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
    <NoSSR>
      <ModernSandpack
        files={files}
        theme={dark ? 'dark' : 'light'}
        {...otherProps}
      />
    </NoSSR>
  );
};
export default Sandpack;
