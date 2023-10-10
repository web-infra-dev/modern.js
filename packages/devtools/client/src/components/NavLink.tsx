import {
  NavLink as RouterNavLink,
  NavLinkProps as RouterNavLinkProps,
} from '@modern-js/runtime/router';
import { Link as BaseLink } from '@radix-ui/themes';
import type { LinkProps as BaseLinkProps } from '@radix-ui/themes/dist/esm/components/link';
import React from 'react';

// @ts-expect-error
export interface NavLinkProps extends RouterNavLinkProps, BaseLinkProps {}

export const NavLink: React.FC<NavLinkProps> = React.forwardRef(
  ({ to, children, ...props }, ref) => (
    <BaseLink {...(props as any)} asChild>
      <RouterNavLink ref={ref} to={to}>
        {children}
      </RouterNavLink>
    </BaseLink>
  ),
);
