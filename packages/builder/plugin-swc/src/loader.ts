import { createLoader } from '@modern-js/builder-plugin-swc-base';
import type { LoaderDefinitionFunction } from 'webpack';
import { Compiler } from './binding';

export default createLoader(Compiler) as LoaderDefinitionFunction;
