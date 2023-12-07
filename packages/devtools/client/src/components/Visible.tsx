import React, { useRef } from 'react';

export interface VisibleProps {
  children: React.ReactNode;
  when?: boolean;
  load?: boolean;
  keepAlive?: boolean;
}

const Visible: React.FC<VisibleProps> = props => {
  const keepAlive = props.keepAlive ?? true;

  const { when } = props;
  const opened = useRef(false);
  if (when ?? props.load) {
    opened.current = true;
  }
  const load = props.load ?? (keepAlive ? opened.current : when);
  const visible = keepAlive ? when : true;

  return load ? (
    <div style={{ display: visible ? 'unset' : 'none' }}>{props.children}</div>
  ) : null;
};

export default Visible;
