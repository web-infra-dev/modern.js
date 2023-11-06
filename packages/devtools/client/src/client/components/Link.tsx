import {
  Link as RouterLink,
  LinkProps as RouterLinkProps,
} from '@modern-js/runtime/router';
import { Link as BaseLink } from '@radix-ui/themes';
import type { LinkProps as BaseLinkProps } from '@radix-ui/themes/dist/esm/components/link';

// @ts-expect-error
export interface LinkProps extends BaseLinkProps, RouterLinkProps {}

export const Link: React.FC<LinkProps> = ({ to, children, ...props }) => (
  <BaseLink {...props} asChild>
    <RouterLink to={to}>{children}</RouterLink>
  </BaseLink>
);
