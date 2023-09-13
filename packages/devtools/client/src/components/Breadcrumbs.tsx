import React from 'react';
import styled from '@emotion/styled';
import { Button, Flex } from '@radix-ui/themes';
import { ChevronRightIcon } from '@radix-ui/react-icons';
import type { ButtonProps } from '@radix-ui/themes/dist/cjs/components/button';

export type BreadcrumbButtonProps = ButtonProps &
  React.RefAttributes<HTMLButtonElement>;

export const BreadcrumbButton: React.FC<BreadcrumbButtonProps> = props => {
  return <Button color="gray" size="1" variant="ghost" {...props} />;
};

export interface BreadcrumbsProps {
  children?: React.ReactElement[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ children = [] }) => {
  const elements: React.ReactElement[] = [];
  for (const child of children) {
    elements.push(child);
    if (child !== children.at(-1)) {
      elements.push(<Connector key={`${child.key}__connector`} />);
    }
  }
  return (
    <Flex align="center" gap="1">
      {elements}
    </Flex>
  );
};

(Breadcrumbs as any).Button = BreadcrumbButton;

export default Breadcrumbs as typeof Breadcrumbs & {
  Button: typeof BreadcrumbButton;
};

const Connector = styled(ChevronRightIcon)({
  width: 'var(--font-size-2)',
  height: 'var(--font-size-2)',
  color: 'var(--gray-6)',
});
