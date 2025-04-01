/// <reference types='@modern-js/plugin-state/types' />

import '../dist/types/runtime';
import '../dist/types/runtime/core/react';
import '../dist/types/runtime/core/browser';
import '../dist/types/runtime/exports/loadable';
import '../dist/types/runtime/core/context';
import '../dist/types/runtime/core/plugin';
import '../dist/types/runtime/exports/head';
import '../dist/types/runtime/exports/styled';
import '../dist/types/runtime/exports/server';
import '../dist/types/runtime/document';
import '../dist/types/runtime/core/server';
import '../dist/types/runtime/core/server/server';
import '../dist/types/runtime/router';
import '../dist/types/runtime/router/runtime/server';
import '../dist/types/runtime/cli/ssr/loadable-bundler-plugin';
import '../dist/types/runtime/rsc/server';
import '../dist/types/runtime/rsc/client';
import '../dist/types/runtime/cache';

declare module 'http' {
    interface ServerResponse {
        locals: Record<string, any>;
    }
}

declare module '@modern-js/runtime' {
    export * from '../dist/types/runtime';
}

declare module '@modern-js/runtime/react' {
    export * from '../dist/types/runtime/core/react';
}

declare module '@modern-js/runtime/browser' {
    export * from '../dist/types/runtime/core/browser';
}

declare module '@modern-js/runtime/loadable' {
    export * from '../dist/types/runtime/exports/loadable';
}

declare module '@modern-js/runtime/context' {
    export * from '../dist/types/runtime/core/context';
}

declare module '@modern-js/runtime/plugin' {
    export * from '../dist/types/runtime/core/plugin';
}

declare module '@modern-js/runtime/head' {
    export * from '../dist/types/runtime/exports/head';
}

declare module '@modern-js/runtime/styled' {
    export * from '../dist/types/runtime/exports/styled';
}

declare module '@modern-js/runtime/server' {
    export * from '../dist/types/runtime/exports/server';
}

declare module '@modern-js/runtime/document' {
    export * from '../dist/types/runtime/document';
}

declare module '@modern-js/runtime/ssr' {
    export * from '../dist/types/runtime/core/server';
}

declare module '@modern-js/runtime/ssr/server' {
    export * from '../dist/types/runtime/core/server/server';
}

declare module '@modern-js/runtime/router' {
    export * from '../dist/types/runtime/router';
}

declare module '@modern-js/runtime/router/server' {
    export * from '../dist/types/runtime/router/runtime/server';
}

declare module '@modern-js/runtime/loadable-bundler-plugin' {
    export * from '../dist/types/runtime/cli/ssr/loadable-bundler-plugin';
}

declare module '@modern-js/runtime/rsc/server' {
    export * from '../dist/types/runtime/rsc/server';
}

declare module '@modern-js/runtime/rsc/client' {
    export * from '../dist/types/runtime/rsc/client';
}

declare module '@modern-js/runtime/cache' {
    export * from '../dist/types/runtime/cache';
}



