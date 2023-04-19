// Since the js bundle won't import css code after module tools build, we need to generate a entry file to import the css code.
import './bundle.css';
// @ts-expect-error
export * from './bundle';
// @ts-expect-error
export { default } from './bundle';
