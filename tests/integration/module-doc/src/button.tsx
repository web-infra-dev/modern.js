import { Button } from '@arco-design/web-react';
import '@arco-design/web-react/es/Button/style';

export type ButtonProps = {
  /**
   * Whether to disable the button
   */
  disabled?: boolean;
  /**
   * Type of Button
   * @default 'default'
   */
  size?: 'mini' | 'small' | 'default' | 'large';
};
export const ButtonTest = (props?: ButtonProps) => {
  return <Button {...props} />;
};
