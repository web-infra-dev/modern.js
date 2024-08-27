import {
  type NavigateOptions,
  matchPath,
  useLocation,
  useNavigate,
} from '@modern-js/runtime/router';
import { Select } from '@radix-ui/themes';
import type React from 'react';

export interface SelectLinkProps {
  items: { to: string; options?: NavigateOptions; title: string }[];
}

export const SelectLink: React.FC<SelectLinkProps> = ({ items }) => {
  const navigate = useNavigate();
  const loc = useLocation();
  const active = items.find(item => matchPath(item.to, loc.pathname));

  return (
    <Select.Root size="1" value={active?.to} onValueChange={navigate}>
      <Select.Trigger />
      <Select.Content position="popper">
        {items.map(({ title, to }) => (
          <Select.Item key={to} value={to}>
            {title}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
};
