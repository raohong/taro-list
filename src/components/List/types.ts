import { VirtualListProps } from './VirtualList';

export type ExcludeProps =
  | 'width'
  | 'height'
  | 'className'
  | 'style'
  | 'dynamic'
  | 'scrollDirection'
  | 'scrollOffset'
  | 'scrollToIndex';

export interface ListProps extends Omit<VirtualListProps, ExcludeProps> {
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  distanceToRefresh?: number;
  damping?: number;
  refreshing?: boolean;
  onRefresh?: (cb: () => void) => void;
  onLoadmore?: () => void;
  custom?: boolean;
  virtual?: boolean;
}

export enum REFRESH_STATUS {
  NONE = 'none',
  // 拖动小于 刷新距离
  PULL = 'pull',
  // 拖动大于 刷新距离
  ACTIVE = 'active',
  // 释放
  RELEASE = 'release'
}

export const MAX_REFRESHING_TIME = 1000 * 10;
