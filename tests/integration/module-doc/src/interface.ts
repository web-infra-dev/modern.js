import React from 'react';

/**
 * @title InnerProps
 *
 * @zh
 *
 * 向用户显示警告的信息时，通过警告提示，展现需要关注的信息。
 *
 * @en
 *
 * When displaying warning information to the user, the information that needs attention is displayed through the warning prompt.
 */
export interface InnerProps {
  /**
   * @zh 位置
   * @en position
   */
  position?: string;
  /**
   * @zh 尺寸
   * @en Size
   */
  size?: string;
  /**
   * @zh 状态
   * @en status
   */
  status?: 'danger' | 'error' | 'success';
}

/**
 * @title Alert
 *
 * @zh
 *
 * 向用户显示警告的信息时，通过警告提示，展现需要关注的信息。
 *
 * @en
 *
 * Display warning information to the user. the Alert is used to display the information that needs attention.
 */
export interface AlertProps {
  /**
   *
   * this is action
   * @zh 自定义操作项
   * @default ''
   * @version 2.15.0
   */
  action?: React.ReactNode;
  /**
   * @zh 是否可以关闭
   * @en Whether Alert can be closed
   * @defaultValue false
   */
  closable?: boolean;
}
