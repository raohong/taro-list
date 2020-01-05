import PropTypes from 'prop-types';
import { VirtualListProps } from './VirtualList';

export type ExcludeProps =
  | 'height'
  | 'dynamic'
  | 'width'
  | 'className'
  | 'style'
  | 'scrollDirection'
  | 'scrollOffset'
  | 'onOffsetChange';

export interface ListProps extends Omit<VirtualListProps, ExcludeProps> {
  height?: number;
  className?: string;
  width?: number | string;
  style?: React.CSSProperties;
  distanceToRefresh?: number;
  damping?: number;
  refreshing?: boolean;
  onRefresh?: (cb: () => void) => void;
  onLoadmore?: () => void;
  custom?: boolean;
  virtual?: boolean;
  enableBackToTop?: boolean;
  scrollWithAnimation?: boolean;
}

export const ListPropTypes: React.WeakValidationMap<ListProps> = {
  damping: PropTypes.number,
  distanceToRefresh: PropTypes.number,
  refreshing: PropTypes.bool,
  height: PropTypes.number.isRequired,
  className: PropTypes.string,
  style: PropTypes.object,
  onRefresh: PropTypes.func,
  onLoadmore: PropTypes.func,
  custom: PropTypes.bool,
  scrollToIndex: PropTypes.number
};

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

export const DAMPING = 200;
export const DISTANCE_TO_REFRESH = 60;

export const HEIGHT = 600;
