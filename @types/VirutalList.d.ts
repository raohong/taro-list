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

interface VirtualListProps {
  width: number | string;
  height: number | string;
  dynamic?: boolean;
  align?: ALIGN;
  scrollDirection?: DIRECTION;
  scrollToIndex?: number;
  dataManager: VirutalListDataManager;
  onOffsetChange: (scrollTop: number) => void;
}

interface SizeAndPositionOfItemData {
  index: number;
  style: ItemStyle;
}

export interface VirutalListItemData<T = any>
  extends SizeAndPositionOfItemData {
  item: T;
}

type MiniItemSizeValue = string | number;
type MiniItemSize =
  | MiniItemSizeValue
  | MiniItemSizeValue[]
  | ((index: number) => MiniItemSizeValue);

type VirutalListDataManagerChangeHandler<T> = (
  items: VirutalListItemData<T>[]
) => void;

type VirutalListDataManagerUpdater<T> = (data: T[]) => VirutalListItemData<T>[];

interface VirutalListDataManagerOptions<T> {
  itemSize?: MiniItemSize;
  estimatedSize?: number;
  stickyIndices?: number[];
  overscan?: number;
  column?: number;
  onChange: VirutalListDataManagerChangeHandler<T>;
}

interface VirutalListDataManagerState<T> {
  data: T[];
  column: number;
  itemSize: ItemSize;
  overscan: number;
  itemCount: number;
  estimatedSize: number;
  stickyIndices: number[];
  onChange: VirutalListDataManagerChangeHandler<T>;
}

export class VirutalListDataManager<T = any> {
  constructor(options: VirutalListDataManagerOptions<T>);

  updateConfig: (config: Partial<VirutalListDataManagerOptions<T>>) => void;
  getItemCount: () => number;
  clear: () => void;
  push: (...value: T[]) => number;
  set: (...value: T[]) => void;
  splice: (start: number, deleteCount: number, ...items: T[]) => T[];
  get: () => T[];
  pop: () => T | undefined;
  forceUpdate: () => void;
}
