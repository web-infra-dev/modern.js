import { isBrowser } from '@modern-js/runtime';
import {
  type TInternalRuntimeContext,
  getGlobalBasename,
} from '@modern-js/runtime/context';

export const getPathname = (context: TInternalRuntimeContext): string => {
  if (isBrowser()) {
    return window.location.pathname;
  }
  return context.ssrContext?.request?.pathname || '/';
};

export const getEntryPath = (): string => {
  const basename = getGlobalBasename();
  if (basename) {
    return basename === '/' ? '' : basename;
  }
  return '';
};
/**
 * Helper function to get language from current pathname
 * @param pathname - The current pathname
 * @param languages - Array of supported languages
 * @param fallbackLanguage - Fallback language when no language is detected
 * @returns The detected language or fallback language
 */
export const getLanguageFromPath = (
  pathname: string,
  languages: string[],
  fallbackLanguage: string,
): string => {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];

  if (languages.includes(firstSegment)) {
    return firstSegment;
  }

  return fallbackLanguage;
};

/**
 * Helper function to build localized URL
 * @param pathname - The current pathname
 * @param language - The target language
 * @param languages - Array of supported languages
 * @returns The localized URL path
 */
export const buildLocalizedUrl = (
  pathname: string,
  language: string,
  languages: string[],
): string => {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length > 0 && languages.includes(segments[0])) {
    // Replace existing language prefix
    segments[0] = language;
  } else {
    // Add language prefix
    segments.unshift(language);
  }

  return `/${segments.join('/')}`;
};

export const detectLanguageFromPath = (
  pathname: string,
  languages: string[],
  localePathRedirect: boolean,
): {
  detected: boolean;
  language?: string;
} => {
  if (!localePathRedirect) {
    return { detected: false };
  }

  const relativePath = pathname.replace(getEntryPath(), '');
  const segments = relativePath.split('/').filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && languages.includes(firstSegment)) {
    return { detected: true, language: firstSegment };
  }

  return { detected: false };
};

/**
 * Check if the given pathname should ignore automatic locale redirect
 */
export const shouldIgnoreRedirect = (
  pathname: string,
  languages: string[],
  ignoreRedirectRoutes?: string[] | ((pathname: string) => boolean),
): boolean => {
  if (!ignoreRedirectRoutes) {
    return false;
  }

  // Remove language prefix if present (e.g., /en/api -> /api)
  const segments = pathname.split('/').filter(Boolean);
  let pathWithoutLang = pathname;
  if (segments.length > 0 && languages.includes(segments[0])) {
    // Remove language prefix
    pathWithoutLang = `/${segments.slice(1).join('/')}`;
  }

  // Normalize path (ensure it starts with /)
  const normalizedPath = pathWithoutLang.startsWith('/')
    ? pathWithoutLang
    : `/${pathWithoutLang}`;

  if (typeof ignoreRedirectRoutes === 'function') {
    return ignoreRedirectRoutes(normalizedPath);
  }

  // Check if pathname matches any of the ignore patterns
  return ignoreRedirectRoutes.some(pattern => {
    // Support both exact match and prefix match
    return (
      normalizedPath === pattern || normalizedPath.startsWith(`${pattern}/`)
    );
  });
};

// Safe hook wrapper to handle cases where router context is not available
export const useRouterHooks = () => {
  try {
    const {
      useLocation,
      useNavigate,
      useParams,
    } = require('@modern-js/runtime/router');
    return {
      navigate: useNavigate(),
      location: useLocation(),
      params: useParams(),
      hasRouter: true,
    };
  } catch (error) {
    return {
      navigate: null,
      location: null,
      params: {},
      hasRouter: false,
    };
  }
};
