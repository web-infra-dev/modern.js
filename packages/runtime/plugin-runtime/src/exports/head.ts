'use client';
import type { ComponentClass, PropsWithChildren } from 'react';
import { Helmet as RequestHelmet } from 'react-helmet-async';
import type {
  HelmetProps as AsyncHelmetProps,
  HelmetTags,
} from 'react-helmet-async/lib/types';

// The 2.x component declaration references the pre-React 19 global JSX namespace.
// Expose its props from the type module without leaking that class declaration.
export const Helmet: ComponentClass<HelmetProps> = RequestHelmet;
export default Helmet;
export type {
  HelmetTags,
  HelmetServerState as HelmetData,
  HelmetDatum,
  HelmetHTMLBodyDatum,
  HelmetHTMLElementDatum,
} from 'react-helmet-async/lib/types';

export type HelmetProps = PropsWithChildren<AsyncHelmetProps>;

// Keep the existing type name using the current implementation's prop types.
export type HelmetPropsToState = HelmetTags &
  Pick<
    HelmetProps,
    | 'bodyAttributes'
    | 'defer'
    | 'htmlAttributes'
    | 'onChangeClientState'
    | 'title'
    | 'titleAttributes'
  > & { encode: boolean };
