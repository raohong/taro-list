import PropTypes from 'prop-types';
import { VirutalListDataManager } from './VirtualList/VirutalListDataManager';
export const ListPropTypes = {
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