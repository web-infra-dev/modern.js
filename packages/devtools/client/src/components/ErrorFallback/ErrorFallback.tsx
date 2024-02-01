import React from 'react';
import { FallbackProps } from 'react-error-boundary';
import { useRouteError } from '@modern-js/runtime/router';
import { Box, Heading, Text, TextArea } from '@radix-ui/themes';

export type ErrorFallbackProps = FallbackProps;

export const ErrorFallback: React.FC<ErrorFallbackProps> = props => {
  const { error } = props;
  const title =
    error instanceof Error
      ? `${error.name}: ${error.message}`
      : 'Unknown Error';
  const description =
    error instanceof Error
      ? error.stack
      : Object.prototype.toString.call(error);

  return (
    <Box p="4">
      <Heading as="h4" mb="4">
        <Text as="span">{title}</Text>
      </Heading>
      <TextArea disabled style={{ height: '50vh' }}>
        {description}
      </TextArea>
    </Box>
  );
};

export const ErrorRouteHandler: React.FC<ErrorFallbackProps> = props => {
  const error = useRouteError();
  return <ErrorFallback {...props} error={error} />;
};
