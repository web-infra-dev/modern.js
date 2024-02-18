import { FC } from 'react';
import { useSnapshot } from 'valtio';
import {
  Box,
  Flex,
  Heading,
  HoverCard,
  Link,
  Text,
  Theme,
} from '@radix-ui/themes';
import {
  HiChartBar,
  HiLink,
  HiMiniArchiveBox,
  HiMiniExclamationCircle,
  HiMiniInboxStack,
  HiMiniRectangleStack,
} from 'react-icons/hi2';
import _ from 'lodash';
import { parseURL } from 'ufo';
import clsx from 'clsx';
import { $dependencies } from '../state';
import logo from './rsdoctor-large.png';
import { $doctor } from './state';
import styles from './page.module.scss';
import { IndicateCard } from '@/components/Card';

interface SummaryCostsData {
  title: string;
  name: string;
  startAt: number;
  costs: number;
}

const WEBPACK_HOOKS_PREFIX = 'https://webpack.js.org/api/compiler-hooks';

const GraphBar: FC<{ cost: SummaryCostsData }> = ({ cost }) => {
  const [leftHook, rightHook] = cost.name.split('->');
  const [leftHref, rightHref] = [leftHook, rightHook].map(hook =>
    ['bootstrap', 'done'].includes(hook)
      ? undefined
      : `${WEBPACK_HOOKS_PREFIX}#${hook.toLowerCase()}`,
  );
  const formattedCost =
    cost.costs > 1_000
      ? `${(cost.costs / 1_000).toFixed(2)}s`
      : `${cost.costs}ms`;
  return (
    <HoverCard.Root>
      <HoverCard.Trigger>
        <Box className={styles.costBox} style={{ flex: cost.costs }}>
          <Text
            size="1"
            color="gray"
            className={clsx(styles.textTruncation, styles.costLabel)}
          >
            {_.startCase(cost.title)}({formattedCost})
          </Text>
          <Box className={styles.costBar} />
        </Box>
      </HoverCard.Trigger>
      <HoverCard.Content size="1">
        <Text size="1" color="gray">
          <Link target="_blank" href={leftHref}>
            {leftHook}
          </Link>
          <Text> ···{formattedCost}··· </Text>
          <Link target="_blank" href={rightHref}>
            {rightHook}
          </Link>
        </Text>
      </HoverCard.Content>
    </HoverCard.Root>
  );
};

const Page: FC = () => {
  const doctor = useSnapshot($doctor);

  const dependencies = useSnapshot($dependencies);
  const isWebDoctor = Object.keys(dependencies).find(key =>
    key.startsWith('@web-doctor/'),
  );
  const implementation = isWebDoctor ? 'Web Doctor' : 'Rsdoctor';
  const website = 'https://rsdoctor.dev';
  const version =
    dependencies['@web-doctor/webpack-plugin(builder)'] ??
    dependencies['@web-doctor/rspack-plugin(builder)'] ??
    dependencies['@web-doctor/webpack-plugin'] ??
    dependencies['@web-doctor/rspack-plugin'] ??
    dependencies['@rsdoctor/rspack-plugin'] ??
    dependencies['@rsdoctor/webpack-plugin'] ??
    dependencies['@rsdoctor/core'];

  const costs: SummaryCostsData[] = _(doctor.summary.costs)
    .sortBy(['startAt', 'name', 'costs'])
    .sortedUniqBy('name')
    .cloneDeep()
    .map(cost => {
      if (cost.name === 'bootstrap->beforeCompile') {
        return { ...cost, title: 'prepare' };
      } else if (cost.name === 'beforeCompile->afterCompile') {
        return { ...cost, title: 'compile' };
      } else if (cost.name === 'afterCompile->done') {
        return { ...cost, title: 'optimize' };
      }
      return { ...cost, title: 'unknown' };
    });

  const errors = _.groupBy(doctor.errors, 'description');

  return (
    <Flex direction="column" align="center" p="4">
      <Flex
        wrap="wrap"
        gap="4"
        mb="8"
        justify="center"
        className={styles.container}
      >
        <IndicateCard className={styles.primaryCard}>
          <Theme appearance="light" hasBackground={false} asChild>
            <IndicateCard.Column>
              <Heading as="h1" color="gray" className={styles.heading}>
                {implementation}
              </Heading>
              <Flex gap="2">
                <button type="button">
                  {version ? `v${version}` : 'Unknown'}
                </button>
              </Flex>
              <Text as="p" color="gray" size="1">
                Click to open panel with complete features.
              </Text>
            </IndicateCard.Column>
          </Theme>
        </IndicateCard>
        <IndicateCard className={styles.infoCard}>
          <Flex justify="between" gap="2" align="center" height="100%">
            <Box>
              <Text color="gray">Visit our website</Text>
              <Flex align="center" asChild>
                <Link href={website} target="_blank" rel="noopener noreferrer">
                  <HiLink />
                  <Text>{parseURL(website).host}</Text>
                </Link>
              </Flex>
            </Box>
            <img className={styles.logo} src={logo} />
          </Flex>
        </IndicateCard>
        <IndicateCard className={styles.countCard}>
          <IndicateCard.Column>
            <Text className={styles.countText} size="1">
              <HiMiniRectangleStack /> {doctor.numModules} modules
            </Text>
            <Text className={styles.countText} size="1">
              <HiMiniInboxStack /> {doctor.numPackages} packages
            </Text>
            <Text className={styles.countText} size="1">
              <HiMiniArchiveBox /> {doctor.numChunks} chunks
            </Text>
          </IndicateCard.Column>
        </IndicateCard>
        <IndicateCard className={styles.compileCostCard}>
          <IndicateCard.Column>
            <Flex asChild align="center" gap="1">
              <Heading as="h3" size="2" color="gray">
                <HiChartBar />
                Compile Overall
              </Heading>
            </Flex>
            <Flex width="100%" gap="1">
              {costs.map(cost => (
                <GraphBar key={cost.name} cost={cost} />
              ))}
            </Flex>
          </IndicateCard.Column>
        </IndicateCard>
        <IndicateCard width="100%">
          <IndicateCard.Column>
            <Text weight="bold" size="1" color="gray">
              Found {_.size(errors)} {_.size(errors) > 1 ? 'errors' : 'error'}
            </Text>
            {Object.entries(errors).map(([desc, errs]) => (
              <Box key={desc} className={styles.errorItem}>
                <HiMiniExclamationCircle className={styles.errorIcon} />{' '}
                <Text size="1" className={styles.textTruncation}>
                  {desc}
                </Text>
                {errs.length > 1 && (
                  <Text size="1" className={styles.errorCount}>
                    (x{errs.length})
                  </Text>
                )}
              </Box>
            ))}
          </IndicateCard.Column>
        </IndicateCard>
      </Flex>
    </Flex>
  );
};

export default Page;
