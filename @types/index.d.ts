import { VirutalListDataManager } from 'taro-list-data-manager';

export enum ALIGN {
  START = 'start',
  END = 'end',
  CENTER = 'center',
  Auto = 'auto'
}

export enum DIRECTION {
  VERTICAL = 'vertical',
  HORIZONTAL = 'horizontal'
}

type ItemSize = number | number[] | ((index: number) => number);

type ItemSizeGetter = (indx: number) => number;

type EstimatedSizeGetter = () => number;

type ItemStylePosition = 'sticky' | 'absolute';

interface ItemStyle {
  position: ItemStylePosition;
  width: string | number;
  height: string | number;
  left: number;
  top: number;
  zIndex: React.CSSProperties['zIndex'];
}

export interface TaroListProps {
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
  align?: ALIGN;
  scrollToIndex?: number;
  dataManager: VirutalListDataManager;
  showRefreshText?: boolean;
}

export class TaroList extends Taro.PureComponent<TaroListProps> {}
export default TaroList;
