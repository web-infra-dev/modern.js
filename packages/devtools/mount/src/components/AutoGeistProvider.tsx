import { GeistProvider, GeistProviderProps } from '@geist-ui/core';
import React, { PropsWithChildren } from 'react';
import { useMedia } from 'react-use';

const AutoGeistProvider: React.FC<
  PropsWithChildren<GeistProviderProps>
> = props => {
  const isDarkTheme = useMedia('(prefers-color-scheme: dark)');
  const isLightTheme = useMedia('(prefers-color-scheme: light)');
  const _props = { ...props };
  if (!_props.themeType) {
    if (isLightTheme) {
      _props.themeType = 'light';
    } else if (isDarkTheme) {
      _props.themeType = 'dark';
    }
  }
  return <GeistProvider {..._props} />;
};

export default AutoGeistProvider;
