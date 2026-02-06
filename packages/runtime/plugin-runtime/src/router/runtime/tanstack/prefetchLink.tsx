import {
  Link as TanStackLink,
  type AnyRouter,
  type LinkComponentProps,
  type RegisteredRouter,
} from '@tanstack/react-router';
import type { ReactElement } from 'react';

export type PrefetchBehavior = 'intent' | 'render' | 'none';

function resolvePreloadFromPrefetch(
  prefetch: PrefetchBehavior | undefined,
  preload: unknown,
) {
  if (typeof preload !== 'undefined') {
    return preload;
  }

  if (prefetch === 'none') {
    return false;
  }

  if (prefetch === 'intent' || prefetch === 'render') {
    return prefetch;
  }

  return preload;
}

export type LinkProps<
  TRouter extends AnyRouter = RegisteredRouter,
  TFrom extends string = string,
  TTo extends string | undefined = '.',
  TMaskFrom extends string = TFrom,
  TMaskTo extends string = '.',
> = LinkComponentProps<'a', TRouter, TFrom, TTo, TMaskFrom, TMaskTo> & {
  prefetch?: PrefetchBehavior;
};

export type NavLinkProps<
  TRouter extends AnyRouter = RegisteredRouter,
  TFrom extends string = string,
  TTo extends string | undefined = '.',
  TMaskFrom extends string = TFrom,
  TMaskTo extends string = '.',
> = LinkProps<TRouter, TFrom, TTo, TMaskFrom, TMaskTo>;

type LinkComponent = <
  TRouter extends AnyRouter = RegisteredRouter,
  const TFrom extends string = string,
  const TTo extends string | undefined = undefined,
  const TMaskFrom extends string = TFrom,
  const TMaskTo extends string = '',
>(
  props: LinkProps<TRouter, TFrom, TTo, TMaskFrom, TMaskTo>,
) => ReactElement;

const LinkComponentImpl = (props: any) => {
  const { prefetch, preload, ...rest } = props;
  return (
    <TanStackLink
      {...rest}
      preload={resolvePreloadFromPrefetch(prefetch, preload)}
    />
  );
};

export const Link = LinkComponentImpl as LinkComponent;

export const NavLink = LinkComponentImpl as LinkComponent;
