import { FC } from 'react';
import { useRouteError } from '@modern-js/runtime/router';
import { Box, Link } from '@radix-ui/themes';
import { parseURL } from 'ufo';
import { useSnapshot } from 'valtio';
import { useGlobals } from '@/entries/client/globals';
import {
  ErrorFallbackProps,
  ErrorRouteHandler,
} from '@/components/Error/Fallback';
import { FeatureDisabled } from '@/components/Error/FeatureDisabled';

const Handler: FC<ErrorFallbackProps> = () => {
  const error = useRouteError();
  const serverExported = useGlobals();
  const { def } = useSnapshot(serverExported).context;
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
