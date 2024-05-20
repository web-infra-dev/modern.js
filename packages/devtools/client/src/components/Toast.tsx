import * as ToastPrimitive from '@radix-ui/react-toast';
import { ToastProps as ToastRootProps } from '@radix-ui/react-toast';
import { FC, Fragment, useRef, useState } from 'react';
import { HiMiniXMark } from 'react-icons/hi2';
import { Box } from '@radix-ui/themes';
import styles from './Toast.module.scss';

export interface ToastProps extends ToastRootProps {
  title?: string;
  content: string;
}

export const Toast: FC<ToastProps> = props => {
  const { title, content, children, ...rest } = props;
  return (
    <ToastPrimitive.Root {...rest} className={styles.container}>
      {title && <ToastPrimitive.Title>{title}</ToastPrimitive.Title>}
      <ToastPrimitive.Description>{content}</ToastPrimitive.Description>
      {children && (
        <ToastPrimitive.Action altText="" asChild>
          {children}
        </ToastPrimitive.Action>
      )}
      <Box flexGrow="1" />
      <ToastPrimitive.Close className={styles.close} aria-label="Close">
        <HiMiniXMark />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
};

export interface UseToastOptions extends ToastProps {
  duration?: number;
}

export const useToast = (options: UseToastOptions) => {
  const { duration = 5000, ...rest } = options;
  const [open, setOpen] = useState(false);
  const element = (
    <Fragment>
      <Toast {...rest} open={open} onOpenChange={setOpen} />
      <ToastPrimitive.Viewport className={styles.viewport} />
    </Fragment>
  );

  const timer = useRef<number | null>(null);
  const handleOpen = () => {
    setOpen(true);
    timer.current && clearTimeout(timer.current);
    timer.current = null;
    if (duration) {
      timer.current = window.setTimeout(() => setOpen(false), duration);
    }
  };

  return { element, open: handleOpen };
};
