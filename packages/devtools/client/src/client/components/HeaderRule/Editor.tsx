import React, { ChangeEvent } from 'react';
import { Box, IconButton, TextField } from '@radix-ui/themes';
import { HiPlusSmall, HiMinusSmall } from 'react-icons/hi2';
import type { BoxProps } from '@radix-ui/themes/dist/cjs/components/box';
import styles from './Editor.module.scss';
import { ModifyHeaderRule } from '@/client/utils/service-agent';

export interface HeaderRuleEditorProps extends BoxProps {
  value?: ModifyHeaderRule[];
  onChangeRule?: (index: number, value: ModifyHeaderRule) => void;
  onDeleteRule?: (index: number) => void;
  onCreateRule?: (index: number, value: ModifyHeaderRule) => void;
}

export const HeaderRuleEditor: React.FC<HeaderRuleEditorProps> = ({
  value = [],
  onChangeRule,
  onDeleteRule,
  onCreateRule,
  ...props
}) => {
  const createInputHandler = (index: number, type: 'key' | 'value') => {
    return (e: ChangeEvent<HTMLInputElement>) => {
      onChangeRule?.(index, {
        ...value[index],
        [type]: e.target.value,
      });
    };
  };

  const createInsertHandler = (index: number) => {
    return () => {
      onCreateRule?.(index + 1, {
        id: Date.now().toString(),
        key: '',
        value: '',
      });
    };
  };

  const createRemoveHandler = (index: number) => {
    return () => {
      onDeleteRule?.(index);
    };
  };

  return (
    <Box className={styles.container} {...props}>
      {value?.map((rule, i) => (
        <Box key={rule.id} className={styles.inputPair}>
          <TextField.Root>
            <TextField.Input
              value={rule.key}
              placeholder="Match header field..."
              onChange={createInputHandler(i, 'key')}
            />
          </TextField.Root>
          <Box asChild grow="1">
            <TextField.Root>
              <TextField.Input
                value={rule.value}
                placeholder="Replace by..."
                onChange={createInputHandler(i, 'value')}
              />
            </TextField.Root>
          </Box>
          <Box className={styles.spacer} />
          <IconButton
            variant="ghost"
            color="gray"
            onClick={createInsertHandler(i)}
          >
            <HiPlusSmall />
          </IconButton>
          <IconButton
            variant="ghost"
            color="gray"
            onClick={createRemoveHandler(i)}
          >
            <HiMinusSmall />
          </IconButton>
        </Box>
      ))}
    </Box>
  );
};
