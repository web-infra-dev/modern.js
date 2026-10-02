import {
  type AnyRouter,
  type LinkComponentProps,
  type RegisteredRouter,
  Link as TanStackLink,
} from '@tanstack/react-router';
import { type ReactElement, forwardRef } from 'react';

export type PrefetchBehavior = 'intent' | 'render' | 'none';

function resolvePreloadFromPrefetch(
  prefetch: PrefetchBehavior | undefined,
  preload: LinkComponentProps<'a'>['preload'],
): LinkComponentProps<'a'>['preload'] {
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

const LinkComponentImpl = forwardRef<HTMLAnchorElement, any>((props, ref) => {
  const { prefetch, preload, ...rest } = props;
  return (
    <TanStackLink
      {...rest}
      to={rest.to}
      ref={ref}
      preload={resolvePreloadFromPrefetch(prefetch, preload)}
    />
  );
});

export const Link = LinkComponentImpl as LinkComponent;

export const NavLink = LinkComponentImpl as LinkComponent;
