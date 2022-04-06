import { isBrowser } from '@modern-js/utils';
import { createRequest as browser } from './browser';
import { createRequest as node } from './node';
import { RequestCreator, IOptions } from './types';

const createRequest: RequestCreator = (...args) =>
  isBrowser() ? browser(...args) : node(...args);

export declare const configure: (options: IOptions) => void;

export default createRequest;
