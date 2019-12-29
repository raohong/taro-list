import Taro, { PureComponent } from '@tarojs/taro';
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
  DEFAULT_ITEMSIZE
} from './types';
import SizeAndPositionManager from './SizeAndPositionManger';
import { getItemSizeGetter, getEstimatedGetter } from './utils';
import CellCache from './CellCache';
import { VirtualListContext, VirutalListContext } from './context';

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
  itemCount: number;
  itemSize?: ItemSize;
  estimatedSize?: number;
  stickyIndices?: number[];
  overscan?: number;
  align?: ALIGN;
  scrollDirection?: DIRECTION;
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
    overscan: 3
  };
  static index = 0;

  static getEventName = () => {
    return `VIRTUAL_ITEM_UPDATE-${VirtualList.index++}`;
  };

  private eventName = VirtualList.getEventName();
  private cellCache: CellCache<CellCacheItem>;
  private delayUpdateTimer: number | null = null;
  private styleCache: Record<number, ItemStyle> = {};
  private sizeAndPositionManager: SizeAndPositionManager;

  constructor(props: VirtualListProps) {
    super(props);

    const { itemCount, itemSize, estimatedSize, scrollDirection } = props;

    this.cellCache = new CellCache<CellCacheItem>();
    const estimatedSizeGetter = getEstimatedGetter(estimatedSize!, itemSize!);
    this.sizeAndPositionManager = new SizeAndPositionManager({
      itemCount: itemCount!,
      itemSizeGetter: getItemSizeGetter(
        itemSize!,
        this.cellCache,
        scrollDirection!,
        estimatedSizeGetter
      ),
      estimatedSizeGetter
    });

    this.state = {
      scrollReadyStatus: SCROLL_READY_STATUS.PREPARE,
      offset: 0
    };
  }

  componentWillReceiveProps(nextProps: VirtualListProps) {
    const {
      itemCount,
      itemSize,
      estimatedSize,
      scrollDirection,
      stickyIndices
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
    }

    if (
      itemSize !== prevProps.itemSize ||
      estimatedSize !== prevProps.estimatedSize
    ) {
      const estimatedSizeGetter = getEstimatedGetter(estimatedSize!, itemSize!);

      this.sizeAndPositionManager.updateConfig({
        itemSizeGetter: getItemSizeGetter(
          itemSize!,
          this.cellCache,
          scrollDirection!,
          estimatedSizeGetter
        ),
        estimatedSizeGetter
      });
    }

    if (
      sizePropsHaveChanged ||
      itemPropsHaveChanged ||
      (Array.isArray(stickyIndices) &&
        stickyIndices !== prevProps.stickyIndices)
    ) {
      this.recomputeSizes();
    }
  }

  componentWillUnmount() {
    if (this.delayUpdateTimer !== null) {
      clearTimeout(this.delayUpdateTimer);
    }
  }

  componentDidUpdate(prevProps: VirtualListProps) {
    const { scrollDirection } = this.props;

    if (
      this.props[sizeProp[scrollDirection!]] !==
      prevProps[sizeProp[scrollDirection!]]
    ) {
      Taro.eventCenter.trigger(this.eventName);
    }
  }

  setScrollOffset = (scrollOffset: number) => {
    if (this.state.offset !== scrollOffset) {
      this.setState({
        offset: scrollOffset
      });
    }
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
      clearTimeout(this.delayUpdateTimer);
    }

    // @ts-ignore
    this.delayUpdateTimer = setTimeout(() => {
      this.forceUpdate();
    }, 0);
  };

  render() {
    const { width, height, scrollDirection } = this.props;

    const totalSize = this.sizeAndPositionManager.getTotalSize();

    const outterStyle = {
      width,
      height
    };

    const innerStyle = {
      ...STYLE_INNER,
      [sizeProp[scrollDirection!]]: totalSize
    };

    const contextValue: VirtualListContext = {
      onResize: this.recomputeDynamicSizes,
      getStyle: this.getVirtualItemStyle,
      registerUpdateCallback: this.registerUpdateCallback
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

  private registerUpdateCallback = (cb: () => void) => {
    Taro.eventCenter.on(this.eventName, cb);

    return () => Taro.eventCenter.off(this.eventName, cb);
  };

  private getVirtualItemStyle = (index: number): null | ItemStyle => {
    const { stickyIndices, overscan } = this.props;
    const { offset } = this.state;

    const { start, end } = this.sizeAndPositionManager.getVisibleRange({
      currentOffset: offset,
      overscan: overscan!,
      containerSize: this.getContainerSize()
    });

    if (start === undefined || end === undefined) {
      return null;
    }

    if (index < start || index > end) {
      return null;
    }

    return this.getStyle(
      index,
      Array.isArray(stickyIndices) && stickyIndices.includes(index)
    );
  };

  private getStyle(index: number, sticky?: boolean) {
    const { scrollDirection } = this.props;
    const style = this.styleCache[index];

    if (style) {
      return style;
    }

    const sizeAndPosition = this.sizeAndPositionManager.getSizeAndPositionForIndex(
      index
    );
    const cellCacheItem = this.cellCache.get(index);
    const size = (cellCacheItem && cellCacheItem[scrollDirection!]) || 'auto';
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

    this.styleCache[index] = itemStyle;

    return itemStyle;
  }
}

export default VirtualList;
