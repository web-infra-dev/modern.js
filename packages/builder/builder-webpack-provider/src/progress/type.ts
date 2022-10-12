import type { ForegroundColor as Color } from '@modern-js/utils/compiled/chalk';

export type Props = {
  total: number;
  current: number;
  color: typeof Color;
  bgColor: typeof Color;
  char: string;
  width: number;
  buildIcon: string;
  finishIcon: string;
  finishInfo: string;
  message: string;
  done: boolean;
  messageWidth: number;
  spaceWidth: number;
  messageColor: typeof Color;
  id: string;
  maxIdLen: number;
};

export type BusOption = {
  state: Props[];
};
