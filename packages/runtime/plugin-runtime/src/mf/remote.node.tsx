import React, { useContext } from 'react';
import {
  ReactRemote as CoreReactRemote,
  type CreateReactRemoteOptions,
  type ReactRemoteProps,
  type CreateReactRemote,
  type ReactRemoteComponent,
} from '@module-federation/bridge-react/base';
import { UNSAFE_NavigationContext } from '@modern-js/runtime-utils/router';
import { useMountBasename } from './remote.routing';
export { useRemoteBasename } from './remote.routing';
function RoutedRemote({
  inferBasename = false,
  ...options
}: ReactRemoteProps & { inferBasename?: boolean }) {
  const basename = useMountBasename(options.basename, inferBasename);
  return <CoreReactRemote key={basename} {...options} basename={basename} />;
}
function ModernReactRemote(options: ReactRemoteProps) {
  const context = useContext(UNSAFE_NavigationContext);
  return context ? (
    <RoutedRemote {...options} />
  ) : (
    <CoreReactRemote {...options} />
  );
}
export const ReactRemote = ModernReactRemote as ReactRemoteComponent;
export const createReactRemote = ((options: CreateReactRemoteOptions) =>
  (props: Record<string, unknown>) => (
    <ModernReactRemote {...options} props={props} />
  )) as CreateReactRemote;
export const createModernReactRemote = ((options: CreateReactRemoteOptions) =>
  (props: Record<string, unknown>) => (
    <RoutedRemote {...options} props={props} inferBasename />
  )) as CreateReactRemote;
