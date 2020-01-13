import PropTypes from 'prop-types';
import { VirtualListProps } from './VirtualList';
import { VirutalListDataManager } from './VirtualList/VirutalListDataManager';

export type ExcludeProps =
  | 'height'
  | 'dynamic'
  | 'width'
  | 'className'
  | 'style'
  | 'scrollDirection'
  | 'scrollOffset'
  | 'onOffsetChange'
  | 'dataManager';

export interface ListProps extends Omit<VirtualListProps, ExcludeProps> {
  height?: number | string;
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
  disabled?: boolean;
  showRefreshText?: boolean;
  dataManager?: VirutalListDataManager;
}

export const ListPropTypes: React.WeakValidationMap<ListProps> = {
  damping: PropTypes.number,
  distanceToRefresh: PropTypes.number,
  refreshing: PropTypes.bool,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  className: PropTypes.string,
  style: PropTypes.object,
  onRefresh: PropTypes.func,
  onLoadmore: PropTypes.func,
  showRefreshText: PropTypes.bool,
  custom: PropTypes.bool,
  scrollToIndex: PropTypes.number,
  disabled: PropTypes.bool,
  dataManager: PropTypes.instanceOf(VirutalListDataManager)
};
