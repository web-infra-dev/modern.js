import {
  type ImageComponentContext,
  createImageComponentContext,
} from '../../shared/options';

export function resolveImageComponentContext(context: ImageComponentContext) {
  const {
    fill = false,
    densities = [1, 2],
    placeholder = false,
    loading = 'lazy',
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
