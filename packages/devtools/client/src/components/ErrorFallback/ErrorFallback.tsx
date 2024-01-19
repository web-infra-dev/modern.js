import React from 'react';
import { FallbackProps } from 'react-error-boundary';
import { useRouteError } from '@modern-js/runtime/router';
import { Box, Heading, Text } from '@radix-ui/themes';

export type ErrorFallbackProps = FallbackProps;

export const ErrorFallback: React.FC<ErrorFallbackProps> = props => {
  const { error } = props;
  if (error instanceof Error) {
    return (
      <Box p="3">
        <Heading as="h4">
          <Text as="span">
            {error.name}: {error.message}
          </Text>
        </Heading>
        <pre>{error.stack}</pre>
      </Box>
    );
  } else {
    return (
      <Box p="3">
        <Heading as="h3">Unknown Error</Heading>
        <pre>{error.message}</pre>
      </Box>
    );
  }
};

export const ErrorRouteHandler: React.FC<ErrorFallbackProps> = props => {
  const error = useRouteError();
  return <ErrorFallback {...props} error={error} />;
};
