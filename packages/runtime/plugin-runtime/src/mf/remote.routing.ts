import { useContext } from 'react';
import {
  UNSAFE_NavigationContext,
  UNSAFE_RouteContext,
} from '@modern-js/runtime-utils/router';
import { addBasename, normalizeBasename } from './location';
/** Infer the local route boundary rather than the deepest match or splat. */
export function useMountBasename(explicit: string | undefined, infer: boolean) {
  const navigation = useContext(UNSAFE_NavigationContext);
  const { matches } = useContext(UNSAFE_RouteContext);
  if (explicit !== undefined) return normalizeBasename(explicit);
  if (!infer) return undefined;
  if (!navigation || !matches.length)
    throw new Error(
      'useRemoteBasename requires a Modern route context. Pass basename to createReactRemote outside a Modern route.',
    );
  const local = matches[matches.length - 1].pathnameBase;
  return normalizeBasename(addBasename(local, navigation.basename));
}

export function useRemoteBasename(explicit?: string) {
  return useMountBasename(explicit, true)!;
}
