import { FC } from 'react';
import { useRouteError } from '@modern-js/runtime/router';
import { Box, Link } from '@radix-ui/themes';
import { useSnapshot } from 'valtio';
import { parseURL } from 'ufo';
import { $definition } from '../state';
import {
  ErrorFallbackProps,
  ErrorRouteHandler,
} from '@/components/Error/Fallback';
import { FeatureDisabled } from '@/components/Error/FeatureDisabled';

const Handler: FC<ErrorFallbackProps> = () => {
  const error = useRouteError();
  const def = useSnapshot($definition);
  const isStateError =
    error && typeof error === 'object' && Object.keys(error).length === 0;
  if (isStateError) {
    const websiteDisplay = parseURL(def.doctor.quickStart).host;
    const websiteLink = (
      <Link
        href={def.doctor.quickStart}
        target="_blank"
        rel="noopener noreferrer"
      >
        🔗{websiteDisplay}
      </Link>
    );
    return (
      <Box width="100%">
        <FeatureDisabled title="Doctor is not working">
          Visit the website of {websiteLink} to learn more.
        </FeatureDisabled>
      </Box>
    );
  } else {
    return <ErrorRouteHandler />;
  }
};

export default Handler;
