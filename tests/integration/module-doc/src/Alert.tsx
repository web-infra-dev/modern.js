import { Alert } from '@arco-design/web-react';
import '@arco-design/web-react/es/Alert/style';

export type AlertProps = {
  /**
   * Whether Alert can be closed
   * @default true
   */
  closable?: boolean;
  /**
   * Type os Alert
   * @default 'info'
   */
  type?: 'info' | 'success' | 'warning' | 'error';
};
export const AlertTest = (props?: AlertProps) => {
  return <Alert {...props} />;
};
