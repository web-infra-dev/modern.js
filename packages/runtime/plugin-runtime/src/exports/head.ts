'use client';
import type { ComponentClass } from 'react';
import type { HelmetProps } from 'react-helmet';
import { Helmet as RequestHelmet } from 'react-helmet-async';

export const Helmet: ComponentClass<HelmetProps> = RequestHelmet;
export default Helmet;
export type {
  HelmetTags,
  HelmetProps,
  HelmetPropsToState,
  HelmetData,
  HelmetDatum,
  HelmetHTMLBodyDatum,
  HelmetHTMLElementDatum,
} from 'react-helmet';
