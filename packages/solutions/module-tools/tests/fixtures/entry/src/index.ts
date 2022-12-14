import { addPrefix } from './common';

export const debug = (str: string) => addPrefix('DEBUG:', str);
