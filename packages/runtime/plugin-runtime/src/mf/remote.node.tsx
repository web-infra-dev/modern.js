import React, { useContext } from 'react';
import {
  ReactRemote as CoreReactRemote,
  type CreateReactRemoteOptions,
  type ReactRemoteProps,
  type CreateReactRemote,
  type ReactRemoteComponent,
} from '@module-federation/bridge-react/base';
import { UNSAFE_NavigationContext } from '@modern-js/runtime-utils/router';
import { normalizeBasename } from './location';
import { useMountBasename } from './remote.routing';
export { useRemoteBasename } from './remote.routing';
function RoutedRemote({
  inferBasename = false,
  ...options
}: ReactRemoteProps & { inferBasename?: boolean }) {
  const basename = useMountBasename(
    options.basename,
    inferBasename && !options.memoryRoute,
  );
  return <CoreReactRemote key={basename} {...options} basename={basename} />;
}
function ModernReactRemote({
  inferBasename = false,
  ...options
}: ReactRemoteProps & { inferBasename?: boolean }) {
  const context = useContext(UNSAFE_NavigationContext);
  if (context) {
    return <RoutedRemote {...options} inferBasename={inferBasename} />;
  }
  if (inferBasename && !options.memoryRoute && options.basename === undefined) {
    useMountBasename(undefined, true);
  }
  const basename =
    options.basename === undefined
      ? undefined
      : normalizeBasename(options.basename);
  return <CoreReactRemote key={basename} {...options} basename={basename} />;
}
export const ReactRemote = ModernReactRemote as ReactRemoteComponent;
export const createReactRemote = ((options: CreateReactRemoteOptions) =>
  (props: Record<string, unknown>) => (
    <ModernReactRemote {...options} props={props} />
  )) as CreateReactRemote;
export const createModernReactRemote = ((options: CreateReactRemoteOptions) =>
  (props: Record<string, unknown>) => (
    <ModernReactRemote {...options} props={props} inferBasename />
  )) as CreateReactRemote;
