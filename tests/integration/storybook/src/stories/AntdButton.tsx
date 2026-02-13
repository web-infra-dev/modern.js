import get from '@api/lambda/index';
import { Button, type ButtonProps } from 'antd';
import type React from 'react';
import { useEffect, useState } from 'react';
interface AntdButtonProps extends ButtonProps {
  myButtonExtra: string;
}
import { configure } from '@modern-js/plugin-bff/client';

// configure({
//   setDomain: () => 'http://localhost:8080',
// });
/**
 * An extended Ant Design button with an extra string.
 */
export const AntdButton: React.FC<AntdButtonProps> = ({
  children,
  myButtonExtra,
  ...props
}) => {
  const [data, setData] = useState<{ message: string } | null>(null);

  return (
    <div>
      <Button {...props} onClick={() => get().then(setData)}>
        {children}
        {myButtonExtra}
      </Button>
      res: {data?.message || 'Loading...'}
    </div>
  );
};
