import { useParameter } from '@storybook/preview-api';
import { DecoratorFunction } from '@storybook/types';
import { WrapProviders } from './components/modern';
import type { IConfig } from './type';

export const withPluginRuntime: DecoratorFunction = storyFn => {
  const modernConfigRuntime = useParameter<IConfig['modernConfigRuntime']>(
    'modernConfigRuntime',
  );
  const modernConfigDesignToken = useParameter<
    IConfig['modernConfigDesignToken']
  >('modernConfigDesignToken');

  return WrapProviders(storyFn, {
    modernConfigRuntime: modernConfigRuntime || {},
    modernConfigDesignToken,
  });
};
