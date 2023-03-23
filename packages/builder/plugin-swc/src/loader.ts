import { createLoader } from '@modern-js/builder-plugin-swc-base';
import { LoaderDefinitionFunction } from 'webpack';
import { Compiler } from './binding';

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
export default createLoader(Compiler) as LoaderDefinitionFunction;
