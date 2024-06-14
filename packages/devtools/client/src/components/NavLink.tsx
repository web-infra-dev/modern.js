import {
  NavLink as RouterNavLink,
  NavLinkProps as RouterNavLinkProps,
} from '@modern-js/runtime/router';
import { Link as BaseLink } from '@radix-ui/themes';
import type { LinkProps as BaseLinkProps } from '@radix-ui/themes';
import React from 'react';

export type NavLinkProps = RouterNavLinkProps &
  BaseLinkProps &
  React.RefAttributes<HTMLAnchorElement>;

export const NavLink: React.FC<NavLinkProps> = React.forwardRef(
  ({ to, children, ...props }, ref) => (
    <BaseLink {...props} asChild>
      <RouterNavLink ref={ref} to={to}>
        {children}
      </RouterNavLink>
    </BaseLink>
  ),
);
