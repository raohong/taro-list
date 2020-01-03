import Taro, { PureComponent, chooseInvoiceTitle } from '@tarojs/taro';
import { View } from '@tarojs/components';

import {
  DIRECTION,
  ALIGN,
  ItemSize,
  SCROLL_READY_STATUS,
  sizeProp,
  DEFAULT_ZINDEX,
  CellCacheItem,
  positionProp,
  DEFAULT_ITEMSIZE,
  DEFAULT_OVERSCAN
} from './types';
import SizeAndPositionManager from './SizeAndPositionManger';
import {
  getItemSizeGetter,
  getEstimatedGetter,
  normalizeStyle,
  normalizeValue
} from './utils';
import CellCache from './CellCache';
import { VirtualListContext, VirutalListContext } from './context';
import {
  VirutalListDataManager,
  VirutalListItemData
} from './VirutalListDataManager';

const STYLE_INNER: React.CSSProperties = {
  position: 'relative'
};

const STYLE_ITEM: {
  position: ItemStylePosition;
  width: number | string;
  height: number | string;
  left: number;
  top: number;
} = {
  position: 'absolute',
  width: '100%',
  height: 'auto',
  left: 0,
  top: 0
};

export interface VirtualListProps {
  width: number | string;
  height: number | string;
  // 这里保留 state 里的 offset
  onOffsetChange: (offset: number) => void;
  itemCount: number;
  itemSize?: ItemSize;
  dynamic?: boolean;
  estimatedSize?: number;
  stickyIndices?: number[];
  overscan?: number;
  align?: ALIGN;
  scrollDirection?: DIRECTION;
  scrollToIndex?: number;
  dataManager: VirutalListDataManager;
}

type ItemStylePosition = 'sticky' | 'absolute';

export interface ItemStyle {
  position: ItemStylePosition;
  width: string | number;
  height: string | number;
  left: number;
  top: number;
  zIndex: React.CSSProperties['zIndex'];
}

export interface VirtualListState {
  offset: number;
  scrollReadyStatus: SCROLL_READY_STATUS;
}

export class VirtualList extends PureComponent<
  VirtualListProps,
  VirtualListState
> {
  static defaultProps: Partial<VirtualListProps> = {
    scrollDirection: DIRECTION.VERTICAL,
    align: ALIGN.Auto,
    estimatedSize: DEFAULT_ITEMSIZE,
    itemSize: DEFAULT_ITEMSIZE,
    overscan: DEFAULT_OVERSCAN,
    dynamic: true
  };

  private cellCache: CellCache<CellCacheItem>;
  private delayUpdateTimer: number | null = null;
  private styleCache: Record<number, ItemStyle> = {};
  private sizeAndPositionManager: SizeAndPositionManager;
  private isMounted = false;
  private needUpdate = true;

  constructor(props: VirtualListProps) {
    super(props);

    const {
      itemCount,
      itemSize,
      estimatedSize,
      scrollDirection,
      dynamic
    } = props;

    this.cellCache = new CellCache<CellCacheItem>();
    const estimatedSizeGetter = getEstimatedGetter(estimatedSize!, itemSize!);
    this.sizeAndPositionManager = new SizeAndPositionManager({
      itemCount: itemCount!,
      itemSizeGetter: getItemSizeGetter(
        itemSize!,
        dynamic ? this.cellCache : undefined,
        dynamic ? scrollDirection! : undefined,
        dynamic ? estimatedSizeGetter : undefined
      ),
      estimatedSizeGetter
    });

    this.state = {
      scrollReadyStatus: SCROLL_READY_STATUS.PREPARE,
      offset: 0
    };
  }

  componentWillReceiveProps(nextProps: VirtualListProps) {
    if (!this.isMounted) {
      return;
    }

    const {
      itemCount,
      itemSize,
      estimatedSize,
      scrollDirection,
      stickyIndices,
      dynamic,
      scrollToIndex,
      onOffsetChange
    } = nextProps;
    const prevProps = this.props;

    const sizePropsHaveChanged =
      nextProps[sizeProp[scrollDirection!]] !==
      prevProps[sizeProp[scrollDirection!]];
    const itemPropsHaveChanged =
      itemCount !== prevProps.itemCount || itemSize !== prevProps.itemSize;

    if (itemCount !== prevProps.itemCount) {
      this.sizeAndPositionManager.updateConfig({
        itemCount
      });
      this.needUpdate = true;
    }

    if (
      itemSize !== prevProps.itemSize ||
      estimatedSize !== prevProps.estimatedSize
    ) {
      const estimatedSizeGetter = getEstimatedGetter(estimatedSize!, itemSize!);

      this.sizeAndPositionManager.updateConfig({
        itemSizeGetter: getItemSizeGetter(
          itemSize!,
          dynamic ? this.cellCache : undefined,
          dynamic ? scrollDirection! : undefined,
          dynamic ? estimatedSizeGetter : undefined
        ),
        estimatedSizeGetter
      });
      this.needUpdate = true;
    }

    if (
      sizePropsHaveChanged ||
      itemPropsHaveChanged ||
      (Array.isArray(stickyIndices) &&
        stickyIndices !== prevProps.stickyIndices)
    ) {
      this.needUpdate = true;
      this.recomputeSizes();
    }

    if (
      typeof scrollToIndex === 'number' &&
      scrollToIndex !== this.props.scrollToIndex
    ) {
      this.needUpdate = true;
      onOffsetChange(this.getUpdatedScrollOffset(scrollToIndex, nextProps));
    }


  }

  componentDidMount() {
    this.isMounted = true;

    const { dataManager } = this.props;

    // @ts-ignore
    dataManager.__setUpdater(this.update);

  }

  componentDidUpdate(_: VirtualListProps, prevState: VirtualListState) {
    this.needUpdate = this.needUpdate || prevState.offset !== this.state.offset;

    if (!this.needUpdate) {
      return;
    }


    // @ts-ignore
    this.props.dataManager._nextTickUpdate()

    this.needUpdate = false;
  }

  componentWillUnmount() {
    if (this.delayUpdateTimer !== null) {
      clearTimeout(this.delayUpdateTimer);
    }
  }

  setScrollOffset = (scrollOffset: number) => {
    if (this.state.offset !== scrollOffset) {
      this.setState({
        offset: scrollOffset
      });
    }
  };

  update = (data: any[]) => {
    const items: VirutalListItemData[] = [];
    const { overscan, stickyIndices } = this.props;

    const { start, end } = this.sizeAndPositionManager.getVisibleRange({
      containerSize: this.getContainerSize(),
      currentOffset: this.state.offset,
      overscan: overscan!
    });


    console.log('XXXX update')

    if (start !== undefined && end !== undefined) {
      if (Array.isArray(stickyIndices)) {
        stickyIndices.forEach(i =>
          items.push({
            index: i,
            style: this.getStyle(i, true),
            item: data[i]
          })
        );
      }

      for (let i = start; i <= end; i++) {
        if (Array.isArray(stickyIndices) && stickyIndices.includes(i)) {
          continue;
        }
        items.push({
          index: i,
          style: this.getStyle(i),
          item: data[i]
        });
      }
    }

    return items;
  };

  recomputeSizes = (index: number = 0) => {
    this.styleCache = {};
    this.sizeAndPositionManager.resetItem(index);
  };

  recomputeDynamicSizes = (index: number, size: CellCacheItem) => {
    this.cellCache.set(index, size);
    this.recomputeSizes(index);
    this.delayForceUpdate();
  };

  delayForceUpdate = () => {
    if (this.delayUpdateTimer) {
      this.delayUpdateTimer = 0;
      clearTimeout(this.delayUpdateTimer);
    }

    // @ts-ignore
    this.delayUpdateTimer = setTimeout(() => {
      this.forceUpdate();
    }, 0);
  };

  render() {
    const { width, height, scrollDirection, dynamic } = this.props;

    const totalSize = this.sizeAndPositionManager.getTotalSize();
    const outterStyle = normalizeStyle({
      width,
      height
    });

    const innerStyle = {
      ...STYLE_INNER,
      [sizeProp[scrollDirection!]]: normalizeValue(totalSize)
    };

    const contextValue: VirtualListContext = {
      onResize: this.recomputeDynamicSizes,
      dynamic: !!dynamic
    };

    return (
      <VirutalListContext.Provider value={contextValue}>
        <View style={outterStyle}>
          <View style={innerStyle}>{this.props.children}</View>
        </View>
      </VirutalListContext.Provider>
    );
  }

  private getContainerSize(props = this.props) {
    const { scrollDirection } = props;

    return props[sizeProp[scrollDirection!]];
  }

  private getStyle(index: number, sticky?: boolean) {
    const { scrollDirection, dynamic } = this.props;
    const style = this.styleCache[index];

    if (style) {
      return style;
    }

    const sizeAndPosition = this.sizeAndPositionManager.getSizeAndPositionForIndex(
      index
    );
    const cellCacheItem = this.cellCache.get(index);
    const size = dynamic
      ? (cellCacheItem && cellCacheItem[scrollDirection!]) || 'auto'
      : sizeAndPosition.size;

    const itemStyle: ItemStyle = sticky
      ? {
          ...STYLE_ITEM,
          [positionProp[scrollDirection!]]: sizeAndPosition.offset,
          [sizeProp[scrollDirection!]]: size,
          zIndex: DEFAULT_ZINDEX,
          position: 'sticky'
        }
      : {
          ...STYLE_ITEM,
          [positionProp[scrollDirection!]]: sizeAndPosition.offset,
          [sizeProp[scrollDirection!]]: size,
          zIndex: 'auto'
        };

    // @ts-ignore
    this.styleCache[index] = normalizeStyle(itemStyle);

    return this.styleCache[index];
  }

  private getUpdatedScrollOffset(scrollToIndex: number, props = this.props) {
    const { align } = props;

    return this.sizeAndPositionManager.getUpdatedOffsetForIndex({
      align: align!,
      containerSize: this.getContainerSize(props),
      targetIndex: scrollToIndex,
      currentOffset: (this.state && this.state.offset) || 0
    });
  }
}

export default VirtualList;
