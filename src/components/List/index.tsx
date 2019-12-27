import Taro, { PureComponent } from '@tarojs/taro';
import { View, ScrollView } from '@tarojs/components';

import { DIRECTION, sizeProp, Vector } from './types';
import { normalizeStyle, getTouches, subV, easing } from './utils';
import './index.less';

export interface ListProps {
  height: string | number;
  width: string | number;
  distanceToRefresh?: number;
  damping?: number;
  refreshing?: boolean;
  loadMore?: boolean;
  onRefresh?: () => void;
  className?: string;
  style?: React.CSSProperties;
  onLoadmore?: () => void;
  scrollDirection?: DIRECTION;
}

interface ListState {
  containerSize: number;
  offset: number;
}

export default class TaroList extends PureComponent<ListProps, ListState> {
  static defaultProps: Partial<ListProps> = {
    width: '100%',
    height: 600,
    scrollDirection: DIRECTION.VERTICAL,
    className: '',
    distanceToRefresh: 25,
    damping: 100
  };

  static MAX_REFRESHING_TIME = 1000 * 8;

  static options = {
    addGlobalClass: true
  };

  private containerSize: number = 0;
  private bodySize: number = 0;

  private refreshTimer: number = 0;

  state: ListState = {
    offset: 0,
    containerSize: 0
  };

  componentDidMount() {
    this.recomputeSize();
  }

  recomputeSize() {
    this.getContainerAndScrollBodySize().then(() => {
      this.setState({
        containerSize: this.containerSize
      });
    });
  }

  getContainerAndScrollBodySize() {
    const { scrollDirection = DIRECTION.HORIZONTAL } = this.props;
    const query = Taro.createSelectorQuery().in(this.$scope);
    const size = sizeProp[scrollDirection];

    return new Promise(resolve => {
      query.select('.taro-list__scroll-view').boundingClientRect();
      query.select('.taro-list__body').boundingClientRect();

      query.exec(rect => {
        const [container, body] = rect as Taro.SelectorQuery.execObject[];

        this.containerSize = Math.floor(container[size]);
        this.bodySize = Math.floor(body[size]);
        resolve();
      });
    });
  }

  private down: boolean = false;
  private initial: Vector = [0, 0];
  private delta: Vector = [0, 0];

  private handleTouchStart = evt => {
    this.down = true;
    this.initial = getTouches(evt.touches);
  };

  private handleTouchMove = evt => {
    const { scrollDirection } = this.props;
    const xy = getTouches(evt.touches);

    // 向下滚动
    if (scrollDirection === DIRECTION.VERTICAL && xy[1] - this.initial[1] < 0) {
      return;
    }

    // 向右滚动
    if (
      scrollDirection === DIRECTION.HORIZONTAL &&
      xy[0] - this.initial[0] < 0
    ) {
      return;
    }

    this.delta = subV(xy, this.initial);
    const offset = this.delta[scrollDirection === DIRECTION.HORIZONTAL ? 0 : 1];

    this.updateOffset(offset);
  };

  private handleTouchEnd = () => {
    const { scrollDirection, distanceToRefresh } = this.props;

    this.down = false;

    const offset = this.delta[scrollDirection === DIRECTION.HORIZONTAL ? 0 : 1];
    const triggered =
      (scrollDirection === DIRECTION.VERTICAL && offset > distanceToRefresh!) ||
      (scrollDirection === DIRECTION.HORIZONTAL && offset > distanceToRefresh!);

    // 向下滚动
    if (triggered) {
      this.setRefesh();
    } else {
      this.updateOffset(0);
    }

    this.initial = [0, 0];
    this.delta = [0, 0];
  };

  updateOffset = (offset: number) => {
    const { damping, distanceToRefresh } = this.props;

    offset =
      offset > distanceToRefresh! ? Math.min(damping!, easing(offset)) : offset;

    this.setState({
      offset
    });
  };

  setRefesh = () => {
    clearTimeout(this.refreshTimer);
    const { onRefresh } = this.props;

    if (typeof onRefresh === 'function') {
      onRefresh();
    }
  };

  private handleScrollToLower = () => {
    const { onLoadmore } = this.props;

    if (typeof onLoadmore === 'function') {
      onLoadmore();
    }
  };

  render() {
    const props = this.props;
    const {
      scrollDirection,
      width,
      height,
      style,
      className,
      refreshing
    } = props;
    const { offset } = this.state;

    const cls = `taro-list__container ${className}`.trim();
    const transformStyle: React.CSSProperties = {
      transform: `translate3d(${
        scrollDirection === DIRECTION.HORIZONTAL ? offset : 0
      }px, ${scrollDirection === DIRECTION.VERTICAL ? offset : 0}px , 0)`
    };

    return (
      <View style={normalizeStyle(style)} className={cls}>
        <ScrollView
          style={normalizeStyle({ width, height })}
          className='taro-list__scroll-view'
          onScrollToLower={this.handleScrollToLower}
          scrollX={scrollDirection === DIRECTION.HORIZONTAL}
          scrollY={scrollDirection === DIRECTION.VERTICAL}
          onTouchStart={this.handleTouchStart}
          onTouchCancel={this.handleTouchEnd}
          onTouchMove={this.handleTouchMove}
          onTouchEnd={this.handleTouchEnd}
        >
          <View style={transformStyle} className='taro-list__body'>
            {props.children}
          </View>
        </ScrollView>
      </View>
    );
  }
}
