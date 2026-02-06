function normalizeBasepath(basepath: string): string {
  if (!basepath) {
    return '/';
  }

  let normalized = basepath.startsWith('/') ? basepath : `/${basepath}`;
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  return normalized || '/';
}

export function createModernBasepathRewrite(
  basepath: string,
  caseSensitive = false,
) {
  const normalizedBasepath = normalizeBasepath(basepath);
  if (normalizedBasepath === '/') {
    return undefined;
  }

  const normalizedBasepathWithSlash = `${normalizedBasepath}/`;
  const checkBasepath = caseSensitive
    ? normalizedBasepath
    : normalizedBasepath.toLowerCase();
  const checkBasepathWithSlash = caseSensitive
    ? normalizedBasepathWithSlash
    : normalizedBasepathWithSlash.toLowerCase();

  return {
    input: ({ url }: { url: URL }) => {
      const pathname = caseSensitive ? url.pathname : url.pathname.toLowerCase();

      if (pathname === checkBasepath) {
        url.pathname = '/';
      } else if (pathname.startsWith(checkBasepathWithSlash)) {
        url.pathname = url.pathname.slice(normalizedBasepath.length) || '/';
      }

      return url;
    },
    output: ({ url }: { url: URL }) => {
      const pathname = url.pathname || '/';

      // Unlike TanStack Router's built-in `basepath` rewrite, avoid adding an
      // extra trailing slash for the base-path root.
      if (pathname === '/') {
        url.pathname = normalizedBasepath;
      } else {
        url.pathname = `${normalizedBasepath}${pathname.startsWith('/') ? '' : '/'}${pathname}`;
      }

      return url;
    },
  };
}

