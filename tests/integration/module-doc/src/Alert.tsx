import { Alert } from '@arco-design/web-react';
import type { AlertProps } from './interface';
import '@arco-design/web-react/es/Alert/style';

export const AlertTest = (props: AlertProps) => {
  return <Alert {...props} />;
};
