import ModernSandpack, {
  type ModernSandpackProps,
} from '@modern-js/sandpack-react';
import { NoSSR, useDark } from '@rspress/core/runtime';
import React, { type PropsWithChildren } from 'react';

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
