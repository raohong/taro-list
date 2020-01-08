import TaroVirutalList from './VirutalList';

type ExcludeProps =
  | 'height'
  | 'dynamic'
  | 'width'
  | 'className'
  | 'style'
  | 'scrollDirection'
  | 'scrollOffset'
  | 'onOffsetChange';

interface TaroListProps
  extends Omit<TaroVirutalList.VirtualListProps, ExcludeProps> {
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
}

declare class TaroList extends Taro.PureComponent<TaroListProps> {}
