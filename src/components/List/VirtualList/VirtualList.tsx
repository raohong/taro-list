import Taro, { PureComponent } from '@tarojs/taro';

import {
  DIRECTION,
  ALIGN,
  ItemSize,
  SCROLL_READY_STATUS,
  scrollProp,
  sizeProp,
  DEFAULT_ZINDEX,
  CellCacheItem,
  positionProp,
  DEFAULT_ITEMSIZE
} from '../types';
import SizeAndPositionManager from './SizeAndPositionManger';
import { getItemSizeGetter, getEstimatedGetter } from './utils';
import CellCache from './CellCache';
import { ResizeEntryRect, CellMeasure } from './CellMeasure';

const STYLE_OUTTER: React.CSSProperties = {
  overflow: 'auto',
  display: 'block',
  willChange: 'scrollLeft, scrollTop'
};

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
  style?: React.CSSProperties;
  className?: string;
  renderItem: (index: number, style: ItemStyle) => React.ReactNode;
  width: number | string;
  height: number | string;
  itemCount: number;
  itemSize?: ItemSize;
  estimatedSize?: number;
  dynamic?: boolean;
  stickyIndices?: number[];
  overscan?: number;
  align?: ALIGN;
  scrollDirection?: DIRECTION;
  scrollOffset?: number;
  scrollToIndex?: number;
  onScroll?: (evt: Event) => void;
}

interface InstanceProps {
  sizeAndPositionManager: SizeAndPositionManager;
  prevProps: Partial<VirtualListProps>;
  cellCache: CellCache<CellCacheItem>;
  recomputeSizes: (index?: number) => void;
}

type ItemStylePosition = 'sticky' | 'absolute';

interface ItemStyle {
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
  instanceProps: InstanceProps;
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

  private cellCache: CellCache<CellCacheItem>;
  private rootNode: HTMLDivElement | null = null;
  private delayUpdateTimer: number | null = null;
  private styleCache: Record<number, ItemStyle> = {};

  constructor(props: VirtualListProps) {
    super(props);

    const {
      dynamic,
      itemCount,
      itemSize,
      estimatedSize,
      scrollDirection
    } = props;

    this.cellCache = new CellCache<CellCacheItem>();
    const estimatedSizeGetter = getEstimatedGetter(estimatedSize!, itemSize!);
    const sizeAndPositionManager = new SizeAndPositionManager({
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
      offset: 0,
      instanceProps: {
        prevProps: {},
        cellCache: this.cellCache,
        sizeAndPositionManager,
        recomputeSizes: this.recomputeSizes
      }
    };
  }

  static getContainerSize(props: VirtualListProps) {
    const { scrollDirection } = props;

    return props[sizeProp[scrollDirection!]];
  }

  static getScrollOffsetForUpdatedIndex(
    index: number,
    props: VirtualListProps,
    state: VirtualListState
  ) {
    const { itemCount, align } = props;
    const {
      offset,
      instanceProps: { sizeAndPositionManager }
    } = state;
    if (index < 0 || index >= itemCount) {
      index = 0;
    }

    return sizeAndPositionManager.getUpdatedOffsetForIndex({
      align: align!,
      containerSize: VirtualList.getContainerSize(props),
      targetIndex: index,
      currentOffset: offset
    });
  }

  static getDirivedStateFromProps(
    nextProps: VirtualListProps,
    prevState: VirtualListState
  ) {
    const {
      dynamic,
      itemCount,
      itemSize,
      estimatedSize,
      scrollToIndex,
      scrollOffset,
      scrollDirection,
      stickyIndices
    } = nextProps;

    const {
      prevProps,
      sizeAndPositionManager,
      cellCache,
      recomputeSizes
    } = prevState.instanceProps;

    const itemPropsHaveChanged =
      itemCount !== prevProps.itemCount ||
      itemSize !== prevProps.itemSize ||
      dynamic !== prevProps.dynamic;

    const scrollPropsHaveChanged =
      scrollOffset !== prevProps.scrollOffset ||
      scrollToIndex !== prevProps.scrollToIndex;

    if (itemCount !== prevProps.itemCount) {
      sizeAndPositionManager.updateConfig({
        itemCount
      });
    }

    if (
      dynamic !== prevProps.dynamic ||
      itemSize !== prevProps.itemSize ||
      estimatedSize !== prevProps.estimatedSize
    ) {
      const estimatedSizeGetter = getEstimatedGetter(estimatedSize!, itemSize!);

      sizeAndPositionManager.updateConfig({
        itemSizeGetter: getItemSizeGetter(
          itemSize!,
          dynamic ? cellCache : undefined,
          dynamic ? scrollDirection! : undefined,
          dynamic ? estimatedSizeGetter : undefined
        ),
        estimatedSizeGetter
      });
    }

    if (
      itemPropsHaveChanged ||
      (Array.isArray(stickyIndices) &&
        stickyIndices !== prevProps.stickyIndices)
    ) {
      recomputeSizes();
    }

    if (
      scrollPropsHaveChanged &&
      prevState.scrollReadyStatus !== SCROLL_READY_STATUS.NONE
    ) {
      const nextState: VirtualListState = {
        ...prevState,
        scrollReadyStatus: SCROLL_READY_STATUS.PREPARE
      };

      if (
        typeof scrollOffset === 'number' &&
        scrollOffset !== prevProps.scrollOffset
      ) {
        nextState.offset = scrollOffset;
      } else if (
        typeof scrollToIndex === 'number' &&
        scrollToIndex !== prevProps.scrollToIndex
      ) {
        nextState.offset = VirtualList.getScrollOffsetForUpdatedIndex(
          scrollToIndex,
          nextProps,
          prevState
        );
      }

      return nextState;
    }

    return null;
  }

  componentDidMount() {
    this.rootNode!.addEventListener('scroll', this.handleScroll, {
      passive: true
    });

    this.scrollTo(this.state.offset);
  }

  componentDidUpdate(_: VirtualListProps, prevState: VirtualListState) {
    const { offset, scrollReadyStatus } = this.state;

    if (
      offset !== prevState.offset &&
      scrollReadyStatus === SCROLL_READY_STATUS.PREPARE
    ) {
      this.scrollTo(offset);
    }
  }

  componentWillUnmount() {
    if (this.delayUpdateTimer !== null) {
      clearTimeout(this.delayUpdateTimer);
    }

    this.rootNode!.removeEventListener('scroll', this.handleScroll);
  }

  handleScroll = (evt: Event) => {
    const offset = this.getScrollOffset();
    const { onScroll } = this.props;

    if (
      offset === this.state.offset ||
      offset < 0 ||
      evt.target !== this.rootNode
    ) {
      return;
    }

    this.setState({
      offset,
      scrollReadyStatus: SCROLL_READY_STATUS.NONE
    });

    if (typeof onScroll === 'function') {
      onScroll(evt);
    }
  };

  scrollTo(scrollOffset: number) {
    const { scrollDirection } = this.props;

    if (this.rootNode) {
      this.rootNode[scrollProp[scrollDirection!]] = scrollOffset;
    }
  }

  recomputeSizes = (index: number = 0) => {
    this.styleCache = {};
    this.state.instanceProps.sizeAndPositionManager.resetItem(index);
  };

  recomputeDynamicSizes = (index: number, size: CellCacheItem) => {
    this.cellCache.set(index, size);
    this.recomputeSizes(index);
    this.delayForceUpdate();
  };

  handleResize = (index: number, entry: ResizeEntryRect) => {
    this.recomputeDynamicSizes(index, {
      width: entry.width,
      height: entry.height
    });
  };

  delayForceUpdate = () => {
    if (this.delayUpdateTimer) {
      clearTimeout(this.delayUpdateTimer);
    }

    this.delayUpdateTimer = window.setTimeout(() => {
      this.forceUpdate();
    }, 0);
  };

  render() {
    const {
      overscan,
      className,
      style,
      width,
      height,
      stickyIndices,
      scrollDirection
    } = this.props;
    const {
      offset,
      instanceProps: { sizeAndPositionManager }
    } = this.state;

    const { start, end } = sizeAndPositionManager.getVisibleRange({
      currentOffset: offset,
      overscan: overscan!,
      containerSize: this.getContainerSize()
    });

    const totalSize = sizeAndPositionManager.getTotalSize();
    const items: React.ReactNode[] = [];

    if (Array.isArray(stickyIndices)) {
      stickyIndices.forEach(index => {
        items.push(this.getNode(index, this.getStyle(index, true)));
      });
    }

    if (start !== undefined && end !== undefined) {
      for (let i = start; i <= end; i++) {
        if (Array.isArray(stickyIndices) && stickyIndices.includes(i)) {
          continue;
        }

        items.push(this.getNode(i, this.getStyle(i)));
      }
    }

    const outterStyle = {
      ...STYLE_OUTTER,
      ...style,
      width,
      height
    };

    const innerStyle = {
      ...STYLE_INNER,
      [sizeProp[scrollDirection!]]: totalSize
    };

    return (
      <div ref={this.saveRoot} style={outterStyle} className={className}>
        <div style={innerStyle}>{items}</div>
      </div>
    );
  }

  private getNode(index: number, styles: ItemStyle) {
    const {
      dynamic,
      renderItem,
      scrollDirection,
      itemSize,
      estimatedSize
    } = this.props;

    if (dynamic) {
      const size =
        (typeof itemSize === 'number' && itemSize) ||
        estimatedSize ||
        DEFAULT_ITEMSIZE;
      return (
        <CellMeasure
          width={scrollDirection === DIRECTION.HORIZONTAL ? size : 'fixed'}
          height={scrollDirection === DIRECTION.VERTICAL ? size : 'fixed'}
          key={index}
          onResize={this.handleResize.bind(this, index)}
        >
          {renderItem(index, styles)}
        </CellMeasure>
      );
    }

    return renderItem(index, styles);
  }

  private getContainerSize() {
    const { scrollDirection } = this.props;

    return this.props[sizeProp[scrollDirection!]];
  }

  private saveRoot = (node: HTMLDivElement) => {
    this.rootNode = node;
  };

  private getScrollOffset() {
    const { scrollDirection } = this.props;

    return Math.round(this.rootNode![scrollProp[scrollDirection!]]);
  }

  private getStyle(index: number, sticky?: boolean) {
    const { scrollDirection, dynamic } = this.props;
    const style = this.styleCache[index];

    if (style) {
      return style;
    }

    const sizeAndPosition = this.state.instanceProps.sizeAndPositionManager.getSizeAndPositionForIndex(
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

    this.styleCache[index] = itemStyle;

    return itemStyle;
  }
}

export default VirtualList;
