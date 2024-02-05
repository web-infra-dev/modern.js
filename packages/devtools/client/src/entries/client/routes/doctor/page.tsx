import { FC } from 'react';
import { useSnapshot } from 'valtio';
import { Box, Flex, Heading, Link, Text, Theme } from '@radix-ui/themes';
import {
  HiChartBar,
  HiLink,
  HiMiniArchiveBox,
  HiMiniExclamationCircle,
  HiMiniInboxStack,
  HiMiniRectangleStack,
  HiMiniScale,
} from 'react-icons/hi2';
import _ from 'lodash';
import clsx from 'clsx';
import logo from './rsdoctor-large.png';
import { $doctor } from './state';
import styles from './page.module.scss';
import { IndicateCard } from '@/components/Card';

const Page: FC = () => {
  const doctor = useSnapshot($doctor);
  const costs = _(doctor.summary.costs)
    .sortBy(['startAt', 'name', 'costs'])
    .sortedUniqBy('name')
    .cloneDeep();

  for (const cost of costs) {
    if (cost.name === 'bootstrap->beforeCompile') {
      cost.name = 'prepare';
    } else if (cost.name === 'beforeCompile->afterCompile') {
      cost.name = 'compile';
    } else if (cost.name === 'afterCompile->done') {
      cost.name = 'optimize';
    }
  }

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
                Rsdoctor
              </Heading>
              <Flex gap="2">
                <button type="button">v1.2.0</button>
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
                <Link
                  href="https://rsdoctor.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <HiLink />
                  <Text>rsdoctor.dev</Text>
                </Link>
              </Flex>
            </Box>
            <img className={styles.logo} src={logo} />
          </Flex>
        </IndicateCard>
        <IndicateCard className={styles.countCard}>
          <IndicateCard.Column>
            <Text className={styles.countText} size="1">
              <HiMiniScale /> 114 MB
            </Text>
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
                <Box
                  key={cost.name}
                  className={styles.costBox}
                  style={{ flex: cost.costs }}
                >
                  <Text
                    size="1"
                    color="gray"
                    className={clsx(styles.textTruncation, styles.costLabel)}
                  >
                    {_.startCase(cost.name)} ({cost.costs}ms)
                  </Text>
                  <Box className={styles.costBar} />
                </Box>
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
