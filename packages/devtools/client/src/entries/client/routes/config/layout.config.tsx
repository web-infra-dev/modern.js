import type React from 'react';
import { Select, Tooltip, Text, Box } from '@radix-ui/themes';
import { useLocation, useNavigate } from '@modern-js/runtime/router';
import _ from 'lodash';
import styles from './layout.module.scss';

const TooltipSelectItem: React.FC<{ name: string; describe: string[] }> = ({
  name,
  describe,
}) => {
  const content = describe.map(line => (
    <Text key={line} style={{ display: 'block' }}>
      {line}
    </Text>
  ));
  return (
    <Tooltip
      key={name}
      className={styles.tooltip}
      side="right"
      content={content}
    >
      <Select.Item value={name}>
        <Box>{_.startCase(name)}</Box>
      </Select.Item>
    </Tooltip>
  );
};

const TOOLKIT_LIST = [
  {
    name: 'framework',
    describe: [
      'Framework config is a superset of Builder config, ',
      'extending it with additional configurations that ',
      'include server-side capabilities and so on.',
    ],
  },
  {
    name: 'builder',
    describe: [
      'Builder provides wrapped building capabilities for scheduling Bundler, ',
      'as well as other plugins and tools.',
    ],
  },
  {
    name: 'bundler',
    describe: [
      'Bundler is typically a low-level build tool like webpack or Rspack, ',
      'and their configuration options differ significantly from higher-level tools.',
    ],
  },
];

const SelectToolkit: React.FC = () => {
  const loc = useLocation();
  const navigate = useNavigate();
  const [toolkit, type] = loc.pathname.split('/').slice(2);

  const handleValueChange = (value: string) => {
    navigate(`/config/${value}/${type}`);
  };

  return (
    <Select.Root size="1" value={toolkit} onValueChange={handleValueChange}>
      <Select.Trigger>{toolkit}</Select.Trigger>
      <Select.Content>
        {TOOLKIT_LIST.map(({ name, describe }) => (
          <TooltipSelectItem key={name} name={name} describe={describe} />
        ))}
      </Select.Content>
    </Select.Root>
  );
};

const CONFIG_TYPE = [
  {
    name: 'resolved',
    describe: [
      'The configuration content passed by the user or superior tools,',
      'usually exposed to the plugin API for modification.',
    ],
  },
  {
    name: 'transformed',
    describe: [
      'The modified and frozen configuration objects,',
      'typically exposed to the plugin API for consumption.',
    ],
  },
];

const SelectType: React.FC = () => {
  const loc = useLocation();
  const navigate = useNavigate();
  const [toolkit, type] = loc.pathname.split('/').slice(2);

  const handleValueChange = (value: string) => {
    navigate(`/config/${toolkit}/${value}`);
  };

  return (
    <Select.Root size="1" value={type} onValueChange={handleValueChange}>
      <Select.Trigger>{type}</Select.Trigger>
      <Select.Content>
        {CONFIG_TYPE.map(({ name, describe }) => (
          <TooltipSelectItem key={name} name={name} describe={describe} />
        ))}
      </Select.Content>
    </Select.Root>
  );
};

export const handle = {
  breadcrumb: [
    { title: 'Config' },
    { title: <SelectToolkit /> },
    { title: <SelectType /> },
  ],
};
