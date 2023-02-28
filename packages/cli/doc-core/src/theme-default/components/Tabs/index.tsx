import { ComponentProps, ReactElement, ReactNode, useContext } from 'react';
import { Tab as HeadlessTab } from '@headlessui/react';
import { TabDataContext } from '../../logic/TabDataContext';
import styles from './index.module.scss';

type TabItem = {
  value?: string;
  label?: string;
  disabled?: boolean;
};

interface TabsProps {
  values: ReactNode[] | ReadonlyArray<ReactNode> | TabItem[];
  defaultValue?: string;
  onChange?: (index: number) => void;
  children: ReactNode;
  groupId?: string;
  tabContainerClassName?: string;
}

function isTabItem(item: unknown): item is TabItem {
  if (item && typeof item === 'object' && 'label' in item) {
    return true;
  }
  return false;
}

const renderTab = (item: ReactNode | TabItem) => {
  if (isTabItem(item)) {
    return item.label || item.value;
  }
  return item;
};

export function Tabs(props: TabsProps): ReactElement {
  const {
    values,
    defaultValue,
    onChange,
    children,
    groupId,
    tabContainerClassName,
  } = props;
  let tabValues = values || [];
  if (tabValues.length === 0) {
    tabValues = (children as ReactElement[]).map(child => ({
      label: child.props?.label,
      value: child.props?.value || child.props?.label,
    }));
  }
  const { tabData, setTabData } = useContext(TabDataContext);
  let defaultIndex = 0;
  if (groupId && tabData[groupId]) {
    defaultIndex = tabData[groupId] as number;
  } else if (defaultValue) {
    defaultIndex = tabValues.findIndex(item => {
      if (typeof item === 'string') {
        return item === defaultValue;
      } else if (item && typeof item === 'object' && 'value' in item) {
        return item.value === defaultValue;
      }
      return false;
    });
  }
  return (
    <HeadlessTab.Group
      onChange={index => {
        onChange?.(index);
        if (groupId) {
          setTabData({ ...tabData, [groupId]: index });
        }
      }}
      selectedIndex={defaultIndex}
    >
      <div className={tabContainerClassName || ''}>
        <HeadlessTab.List className="mt-4 flex w-max min-w-full border-b border-gray-200">
          {tabValues.map((item, index) => {
            const disabled = Boolean(
              item &&
                typeof item === 'object' &&
                'disabled' in item &&
                item.disabled,
            );

            return (
              <HeadlessTab
                key={index}
                disabled={disabled}
                className={({ selected }) =>
                  `${styles.tab} ${
                    selected ? styles.selected : styles.notSelected
                  }`
                }
              >
                {renderTab(item)}
              </HeadlessTab>
            );
          })}
        </HeadlessTab.List>
      </div>
      <HeadlessTab.Panels>{children}</HeadlessTab.Panels>
    </HeadlessTab.Group>
  );
}

export function Tab({
  children,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <HeadlessTab.Panel {...props} className="rounded pt-4">
      {children}
    </HeadlessTab.Panel>
  );
}
