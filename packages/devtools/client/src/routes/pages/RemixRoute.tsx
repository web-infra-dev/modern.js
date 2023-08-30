import React from 'react';
import { RouteObject } from '@modern-js/runtime/router';
import { Box, Flex, Link, Code } from '@radix-ui/themes';
import styled from '@emotion/styled';
import _ from 'lodash';
import { withoutTrailingSlash } from 'ufo';

export interface RemixRouteProps {
  route: RouteObject | RouteObject[];
}

export const RemixRoute: React.FC<RemixRouteProps> = ({ route }) => {
  const routes = _.castArray(route);
  const curr = _.last(routes)!;
  const displayPath = routes
    .map(r => r.path && withoutTrailingSlash(r.path))
    .filter(_.isString)
    .join('/');
  const isIndex = curr.index ?? false;
  const isRoot = displayPath === '/';

  return (
    <Box>
      <Flex gap="2" align="center" mb={curr.children && '1'}>
        <Flex>
          {!isRoot && (
            <EndpointTag data-compose={isIndex && 'head'}>
              {displayPath}
            </EndpointTag>
          )}
          {isIndex && (
            <EndpointTag color="purple" data-compose={!isRoot && 'tail'}>
              /(index)
            </EndpointTag>
          )}
        </Flex>
        <ShyLink size="1" color="gray">
          {(curr as any)._component.replace('@_modern_js_src/', '@/')}
        </ShyLink>
      </Flex>
      <Flex direction="column" gap="1">
        {curr.children?.map(route => (
          <RemixRoute key={route.id} route={routes.concat(route)} />
        ))}
      </Flex>
    </Box>
  );
};

const EndpointTag = styled(Code)({
  fontSize: 'var(--font-size-2)',
  '&[data-compose="head"]': {
    paddingRight: '0',
    borderTopRightRadius: '0',
    borderBottomRightRadius: '0',
  },
  '&[data-compose="tail"]': {
    paddingLeft: '0',
    borderTopLeftRadius: '0',
    borderBottomLeftRadius: '0',
  },
});

const ShyLink = styled(Link)({
  color: 'transparent',
  ':hover': {
    color: 'var(--gray-9)',
  },
});
