import React from 'react';
import { Helmet } from '../../../../exports/head';

export const NoSSRCache = () => {
  return (
    <Helmet>
      <meta name="no-ssr-cache" />
    </Helmet>
  );
};
