import type { NestedRouteForCli, PageRoute } from '@modern-js/types';
import type { ScopeRoute } from '../../router/cli/code/scopeOrigins';

type Route = NestedRouteForCli | PageRoute;

export function normalizeScopePath(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    /[?#\\]|\/\//.test(value)
  ) {
    throw new Error(
      'route must be an absolute route definition path without query or hash.',
    );
  }
  if (/[:*\[\]]/.test(value)) {
    throw new Error(
      'route cannot contain dynamic parameters or wildcards. Select a fixed ancestor instead.',
    );
  }
  return value.replace(/\/+$/, '') || '/';
}

/** Keep the selected subtree and its ancestors, without mutating the entry. */
export function selectRouteScope(routes: Route[], value: string): Route[] {
  const selectedPath = normalizeScopePath(value);
  const candidates: {
    node: Route;
    ancestors: Route[];
    key: object | string;
  }[] = [];
  const join = (base: string, part: string) =>
    (part.startsWith('/') ? part : `${base}/${part}`)
      .replace(/\/+/g, '/')
      .replace(/\/$/, '') || '/';
  const visit = (nodes: Route[], base: string, ancestors: Route[]) => {
    for (const node of nodes) {
      const nodePath = node.path || '';
      const normalized = join(base, nodePath);
      const origin = (node as ScopeRoute)._scopeAncestors?.find(
        origin =>
          origin.path &&
          join(base, origin.path) === selectedPath &&
          (normalized === selectedPath ||
            normalized.startsWith(`${selectedPath}/`)),
      );
      if (origin)
        candidates.push({
          node,
          ancestors,
          key: `${ancestors.map(parent => parent.id).join('/')}\0${origin.id}`,
        });
      else if (nodePath && normalized === selectedPath)
        candidates.push({ node, ancestors, key: node });
      if ('children' in node && node.children)
        visit(node.children, normalized, [...ancestors, node]);
    }
  };
  visit(routes, '', []);
  const roots = candidates.filter(
    candidate =>
      !candidates.some(other => candidate.ancestors.includes(other.node)),
  );
  const boundaries = new Set(roots.map(root => root.key));
  if (boundaries.size !== 1) {
    const detail = roots.map(({ node }) => node.id || node.path).join(', ');
    throw new Error(
      roots.length
        ? `route "${selectedPath}" is ambiguous (${detail}).`
        : `route "${selectedPath}" does not exist in this registry.`,
    );
  }
  const targets = new Set(roots.map(root => root.node));
  const allowed = new Set(
    roots.flatMap(root => [...root.ancestors, root.node]),
  );
  const copy = (nodes: Route[], inside = false): Route[] =>
    nodes.flatMap(node => {
      if (!inside && !allowed.has(node)) return [];
      const selected = inside || targets.has(node);
      const result = { ...node };
      if (result.type === 'nested' && result.children)
        result.children = copy(
          result.children,
          selected,
        ) as NestedRouteForCli[];
      return [result];
    });
  return copy(routes);
}
