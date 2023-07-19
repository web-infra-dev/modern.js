import mapPathString from '../mapPath';

export default function transformImport(nodePath, state) {
  if (state.moduleResolverVisited.has(nodePath)) {
    return;
  }
  state.moduleResolverVisited.add(nodePath);

  mapPathString(nodePath.get('source'), state);
}
