import ModernSandpack, {
  type ModernSandpackProps,
} from '@modern-js/sandpack-react';
import React, { type PropsWithChildren } from 'react';
import { NoSSR, useDark } from 'rspress/runtime';

import './index.css';

const Sandpack = (props: PropsWithChildren<ModernSandpackProps>) => {
  const dark = useDark();
  const { children, files, ...otherProps } = props;
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
