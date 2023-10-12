import React, { useContext, useRef } from 'react';
import { RouteObject } from '@modern-js/runtime/router';
import { Box, Flex, Link, Code } from '@radix-ui/themes';
import _ from 'lodash';
import { resolveURL } from 'ufo';
import { useHoverDirty } from 'react-use';
import { MatchRemixRouteContext } from './Context';
import styles from './Route.module.scss';

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
  const displayPath =
    resolveURL('/', ...routes.map(r => r.path).filter(_.isString)) || '/';
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
        <Box
          className={styles.endpointContainer}
          data-miss-matched={isMatching && !isMatched}
        >
          {(isIndex && isRoot) || (
            <Code
              className={styles.endpointTag}
              data-compose={isIndex && 'head'}
            >
              {displayPath}
            </Code>
          )}
          {isIndex && (
            <Code
              className={styles.endpointTag}
              color="purple"
              data-compose={!isRoot && 'tail'}
            >
              /(index)
            </Code>
          )}
        </Box>
        {componentFile && (
          <Link
            className={styles.shyLink}
            style={{ visibility: hovered ? 'visible' : 'hidden' }}
          >
            {componentFile}
          </Link>
        )}
      </Flex>
      <Flex direction="column" gap="1">
        {curr.children?.map(route => (
          <RemixRoute key={route.id} route={routes.concat(route)} />
        ))}
      </Flex>
    </Box>
  );
};
