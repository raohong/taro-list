import Nerv from "nervjs";
import Taro from "@tarojs/taro-h5";
import PropTypes from 'prop-types';
import { View } from '@tarojs/components';
import { DIRECTION, ALIGN, sizeProp, DEFAULT_ZINDEX, positionProp } from './types';
import SizeAndPositionManager from './SizeAndPositionManger';
import { getItemSizeGetter, getEstimatedGetter, normalizeStyle, normalizeValue } from './utils';
import { VirutalListDataManager } from './VirutalListDataManager';
const STYLE_INNER = {
  position: 'relative'
};
const STYLE_ITEM = {
  position: 'absolute',
  width: '100%',
  height: 'auto',
  left: 0,
  top: 0
};
export class VirtualList extends Taro.PureComponent {
  constructor() {
    super(...arguments);
    this.delayUpdateTimer = null;
    this.styleCache = {};
    this.needUpdate = true;
    this.offset = 0;
  }
  componentDidMount() {
    const { dataManager } = this.props;
    const { estimatedSize, itemCount, itemSize } = dataManager.__getState();
    // 初始化
    const estimatedSizeGetter = getEstimatedGetter(estimatedSize, itemSize);
    this.sizeAndPositionManager = new SizeAndPositionManager({
      itemCount: itemCount,
      itemSizeGetter: getItemSizeGetter(itemSize),
      estimatedSizeGetter
    });
    dataManager.__setUpdater(this.update);
    dataManager.__setOnStateChange(this.onStateChange);
  }
  componentDidUpdate(prevProps) {
    const { scrollToIndex, scrollDirection, onOffsetChange, dataManager } = this.props;
    const { itemCount } = dataManager.__getState();
    // itemCount > 0 才有效
    if (itemCount) {
      if (typeof scrollToIndex === 'number' && (prevProps.scrollToIndex !== scrollToIndex || this.props[sizeProp[scrollDirection]] && prevProps[sizeProp[scrollDirection]] === 0)) {
        onOffsetChange(this.getUpdatedScrollOffset(scrollToIndex, this.props));
      }
    }
    this.updateVirutalListDataRange();
  }
  componentWillUnmount() {
    if (this.delayUpdateTimer !== null) {
      clearTimeout(this.delayUpdateTimer);
    }
    this.props.dataManager.destroy();
  }
  render() {
    const { width, scrollDirection } = this.props;
    const totalSize = this.sizeAndPositionManager ? this.sizeAndPositionManager.getTotalSize() : 0;
    const innerStyle = {
      ...STYLE_INNER,
      width,
      [sizeProp[scrollDirection]]: normalizeValue(totalSize)
    };
    return <View style={innerStyle}>{this.props.children}</View>;
  }
  getContainerSize(props = this.props) {
    const { scrollDirection } = props;
    return props[sizeProp[scrollDirection]];
  }
  getStyle(index, sticky) {
    const { scrollDirection } = this.props;
    const style = this.styleCache[index];
    if (style) {
      return style;
    }
    const sizeAndPosition = this.sizeAndPositionManager.getSizeAndPositionForIndex(index);
    const size = sizeAndPosition.size;
    const itemStyle = sticky ? {
      ...STYLE_ITEM,
      [positionProp[scrollDirection]]: 0,
      [sizeProp[scrollDirection]]: size,
      zIndex: DEFAULT_ZINDEX,
      position: 'sticky'
    } : {
      ...STYLE_ITEM,
      [positionProp[scrollDirection]]: sizeAndPosition.offset,
      [sizeProp[scrollDirection]]: size,
      zIndex: 'auto'
    };
    // @ts-ignore
    this.styleCache[index] = normalizeStyle(itemStyle);
    return this.styleCache[index];
  }
  getUpdatedScrollOffset(scrollToIndex, props = this.props) {
    const { align } = props;
    return this.sizeAndPositionManager.getUpdatedOffsetForIndex({
      align: align,
      currentOffset: this.offset,
      targetIndex: scrollToIndex,
      containerSize: this.getContainerSize()
    });
  }
  updateVirutalListDataRange = () => {
    if (!this.needUpdate) {
      return;
    }
    this.props.dataManager.__nextTickUpdate();
    this.needUpdate = false;
  };
  setScrollOffset = scrollOffset => {
    if (this.offset !== scrollOffset) {
      this.offset = scrollOffset;
      this.needUpdate = true;
      this.updateVirutalListDataRange();
    }
  };
  onStateChange = prevState => {
    const { itemSize, itemCount, estimatedSize } = this.props.dataManager.__getState();
    if (prevState.itemCount !== itemCount) {
      this.sizeAndPositionManager.updateConfig({
        itemCount
      });
    }
    if (prevState.itemSize !== itemSize || prevState.estimatedSize !== estimatedSize) {
      this.sizeAndPositionManager.updateConfig({
        estimatedSizeGetter: getEstimatedGetter(estimatedSize, itemSize),
        itemSizeGetter: getItemSizeGetter(itemSize)
      });
    }
    this.recomputeSizes();
    this.forceUpdate();
  };
  update = data => {
    const items = [];
    const { overscan, stickyIndices, column } = this.props.dataManager.__getState();
    const { start, end } = this.sizeAndPositionManager.getVisibleRange({
      containerSize: this.getContainerSize(),
      currentOffset: this.offset,
      overscan: overscan
    });
    if (start !== undefined && end !== undefined) {
      if (Array.isArray(stickyIndices) && column === 1) {
        stickyIndices.forEach(i => items.push({
          index: i,
          style: this.getStyle(i, true),
          item: data.slice(i, i + column)
        }));
      }
      for (let i = start; i <= end; i++) {
        if (Array.isArray(stickyIndices) && stickyIndices.includes(i) && column === 1) {
          continue;
        }
        items.push({
          index: i,
          style: this.getStyle(i),
          item: data.slice(i * column, i * column + column)
        });
      }
    }
    return column === 1 ? items.map(dataItem => ({ ...dataItem, item: dataItem.item[0] })) : items.filter(item => item.item.length);
  };
  recomputeSizes = (index = 0) => {
    this.styleCache = {};
    this.sizeAndPositionManager.resetItem(index);
  };
}
VirtualList.defaultProps = {
  scrollDirection: DIRECTION.VERTICAL,
  align: ALIGN.CENTER,
  dynamic: false
};
VirtualList.propTypes = {
  dataManager: PropTypes.instanceOf(VirutalListDataManager).isRequired
};
export default VirtualList;