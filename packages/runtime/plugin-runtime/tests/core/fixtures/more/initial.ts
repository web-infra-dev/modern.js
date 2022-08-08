import { initialRuntime } from '../../../../src/core';

const plugins = [] as any[];

export const { render, wrap } = initialRuntime(plugins);
