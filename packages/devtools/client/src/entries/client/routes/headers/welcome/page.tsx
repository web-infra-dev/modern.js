import { useNavigate } from '@modern-js/runtime/router';
import { Box, Button, Heading, Text, Link } from '@radix-ui/themes';
import type React from 'react';

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
        <Link href="/sw-proxy.js" target="_blank" mx="1">
          /sw-proxy.js
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
