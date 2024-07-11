import React from 'react';
import { useNavigate } from '@modern-js/runtime/router';
import { Box, Button, Heading, Text, Link } from '@radix-ui/themes';
import { SERVICE_SCRIPT } from '@/utils/service-agent';

const Page: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box>
      <Heading my="4">Header Modifier</Heading>
      <Text as="p" mb="2">
        Modifying headers of requests, useful for switch between traffic lanes.
      </Text>
      <Text as="p">
        That will register
        <Link href={SERVICE_SCRIPT} target="_blank" mx="1">
          {SERVICE_SCRIPT}
        </Link>
        as a service worker to handle all requests under
        <Link mx="1">{location.host}</Link>
      </Text>
      <Button my="4" onClick={() => navigate('../editor')}>
        Enable
      </Button>
    </Box>
  );
};

export default Page;
