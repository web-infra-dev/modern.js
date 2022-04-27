import { StoryFn as StoryFunction, useParameter } from '@storybook/addons';
import { WrapProviders } from './components/modern';
import { IConfig } from './type';

export const withPluginRuntime = (
  storyFn: StoryFunction<JSX.Element>,
  // context: StoryContext
) => {
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
