import {
  type ImageComponentContext,
  createImageComponentContext,
} from '../../shared/options';

export function resolveImageComponentContext(context: ImageComponentContext) {
  const {
    fill = false,
    loading = 'lazy',
    densities = [1, 2],
    placeholder = false,
  } = context;

  const ret = {
    ...createImageComponentContext(),
    densities,
    fill,
    placeholder,
    loading,
  };
  return ret;
}

export interface ResolvedImageComponentContext
  extends ReturnType<typeof resolveImageComponentContext> {}
