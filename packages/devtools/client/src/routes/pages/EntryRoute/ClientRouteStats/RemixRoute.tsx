import React, { useContext, useRef } from 'react';
import { RouteObject } from '@modern-js/runtime/router';
import { Box, Flex, Link, Code } from '@radix-ui/themes';
import styled from '@emotion/styled';
import _ from 'lodash';
import { withoutTrailingSlash } from 'ufo';
import { useHoverDirty } from 'react-use';
import { MatchRemixRouteContext } from '../MatchRemixRouteContext';

export interface RemixRouteProps {
  route: RouteObject | RouteObject[];
}

export const RemixRoute: React.FC<RemixRouteProps> = ({ route }) => {
  const routes = _.castArray(route);
  const curr = _.last(routes)!;
  const componentFile =
    '_component' in curr && _.isString(curr._component)
      ? curr._component
      : null;
  const displayPath = routes
    .map(r => r.path && withoutTrailingSlash(r.path))
    .filter(_.isString)
    .join('/');
  const isIndex = curr.index ?? false;
  const isRoot = displayPath === '/';
  const matched = useContext(MatchRemixRouteContext);
  const isMatching = matched.length > 0;
  const isMatched = _.find(matched, { route: { id: curr.id } });

  const ref = useRef<HTMLDivElement>(null);
  const hovered = useHoverDirty(ref);

  return (
    <Box ref={ref}>
      <Flex gap="2" align="center" mb={curr.children && '1'}>
        <EndpointContainer data-miss-matched={isMatching && !isMatched}>
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
        </EndpointContainer>
        {hovered && componentFile && <ShyLink>{componentFile}</ShyLink>}
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
  color: 'var(--gray-9)',
  fontSize: 'var(--font-size-1)',
});

const EndpointContainer = styled(Box)({
  display: 'flex',
  transition: 'opacity 200ms',
  '&[data-miss-matched="true"]': {
    opacity: '0.5',
  },
});
