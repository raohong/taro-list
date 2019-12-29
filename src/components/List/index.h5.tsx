import Taro, { PureComponent } from '@tarojs/taro';
import PropTypes from 'prop-types';
import omit from 'omit.js';
import { View, ScrollView } from '@tarojs/components';

import VirtualList, { VirtualListProps } from './VirtualList';
import './index.h5.less';

export type ExcludeProps =
  | 'width'
  | 'height'
  | 'className'
  | 'style'
  | 'dynamic'
  | 'scrollDirection'
  | 'scrollOffset'
  | 'scrollToIndex';

export interface ListProps extends Omit<VirtualListProps, ExcludeProps> {
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  distanceToRefresh?: number;
  damping?: number;
  refreshing?: boolean;
  onRefresh?: (cb: () => void) => void;
  onLoadmore?: () => void;
  custom?: boolean;
  virtual?: boolean;
}

enum REFRESH_STATUS {
  NONE = 'none',
  // 拖动小于 刷新距离
  PULL = 'pull',
  // 拖动大于 刷新距离
  ACTIVE = 'active',
  // 释放
  RELEASE = 'release'
}

interface ListState {
  containerSize: number;
  status: REFRESH_STATUS;
  draging: boolean;
  offset: number;
}

const MAX_REFRESHING_TIME = 1000 * 10;

const opts = {
  passive: false
};

export default class TaroList extends PureComponent<ListProps, ListState> {
  static defaultProps: Partial<ListProps> = {
    height: 600,
    className: '',
    distanceToRefresh: 60,
    damping: 200
  };

  static propTypes: React.WeakValidationMap<ListProps> = {
    damping: PropTypes.number,
    distanceToRefresh: PropTypes.number,
    refreshing: PropTypes.bool,
    height: PropTypes.number.isRequired,
    className: PropTypes.string,
    style: PropTypes.object,
    onRefresh: PropTypes.func,
    onLoadmore: PropTypes.func,
    custom: PropTypes.bool
  };

  static options = {
    addGlobalClass: true
  };

  static index = 0;

  private rootNode: HTMLDivElement;
  private refreshTimer: number = 0;
  private initialY = 0;
  private virtualListRef = Taro.createRef<VirtualList>();

  private domId = `zyouh-list__id-${(TaroList.index = TaroList.index++)}`;

  constructor(props: ListProps) {
    super(props);

    this.state = {
      containerSize: 0,
      status: REFRESH_STATUS.NONE,
      draging: false,
      offset: 0
    };
  }

  componentDidMount() {
    this.getRootNode();
    this.addEventListener();
    this.setState(
      {
        containerSize: this.rootNode.offsetHeight
      },
      () => {
        if (this.virtualListRef.current && this.props.virtual) {
          this.virtualListRef.current.forceUpdate();
        }
      }
    );

    this.triggerRefresh();
  }

  componentDidUpdate(prevProps: ListProps) {
    if (prevProps.refreshing !== this.props.refreshing) {
      this.triggerRefresh();
    }
  }

  componentWillUnmount() {
    this.clearRefreshTimer();
    this.removeEventListener();
  }

  private handleTouchStart = (evt: TouchEvent) => {
    this.initialY = evt.touches[0].clientY;
  };

  private handleTouchMove = (evt: TouchEvent) => {
    const y = evt.touches[0].clientY;
    const { status, draging, offset } = this.state;

    // 如果 offset 大于0 处于拖动中或者好 release
    if (y < this.initialY && offset < 1) {
      return;
    }

    if (this.checkIsInScrolling()) {
      return;
    }

    if (!draging) {
      this.setState({
        draging: true
      });
      // 如果是 releae 补上 offset
      this.initialY = status === REFRESH_STATUS.RELEASE ? y - offset : y;
    }

    evt.stopPropagation();
    evt.preventDefault();

    const deltaY = this.damping(y - this.initialY);
    this.updateOffset(deltaY);

    // 刷新释放后状态不变 仅改变 offset
    if (status === REFRESH_STATUS.RELEASE) {
      return;
    }

    if (deltaY < this.props.distanceToRefresh!) {
      if (status !== REFRESH_STATUS.PULL) {
        this.setState({
          status: REFRESH_STATUS.PULL
        });
      }
    } else {
      if (status !== REFRESH_STATUS.ACTIVE) {
        this.setState({
          status: REFRESH_STATUS.ACTIVE
        });
      }
    }
  };

  private handleTouchEnd = () => {
    const { status, draging, offset } = this.state;

    if (draging) {
      this.setState(() => ({
        draging: false
      }));
    }

    if (status === REFRESH_STATUS.ACTIVE) {
      this.initialY = 0;
      this.setRefresh();
      // 触发刷新后 如果下拉距离 小于 distanceToRefresh 则关闭刷新 此时这里不能改变 status
    } else if (status === REFRESH_STATUS.RELEASE) {
      if (offset < this.props.distanceToRefresh!) {
        this.clearRefreshTimer();
        // 这里强制重置掉刷新状态
        this.setState({
          status: REFRESH_STATUS.NONE
        });
        this.reset();
      }
    } else {
      this.reset();
    }
  };

  private handleScroll = () => {
    const offset = this.getScrollOffset();

    if (this.props.virtual && this.virtualListRef.current) {
      this.virtualListRef.current.setScrollOffset(offset);
    }
  };

  private setRefresh() {
    const { distanceToRefresh, onRefresh } = this.props;

    this.setState(
      {
        status: REFRESH_STATUS.RELEASE
      },
      () => this.updateOffset(distanceToRefresh!)
    );

    const onEnd = () => {
      this.clearRefreshTimer();
      if (!this.props.refreshing) {
        this.setState(() => ({ status: REFRESH_STATUS.NONE }), this.reset);
      }
    };

    this.clearRefreshTimer();

    this.refreshTimer = window.setTimeout(() => {
      onEnd();
    }, MAX_REFRESHING_TIME);
    if (typeof onRefresh === 'function') {
      onRefresh(onEnd);
    }
  }

  private triggerRefresh = () => {
    const { refreshing } = this.props;

    if (!this.state.draging) {
      if (refreshing) {
        this.setRefresh();
      } else {
        this.setState({
          status: REFRESH_STATUS.NONE
        });

        this.reset();
      }
    }
  };

  private reset = () => {
    this.initialY = 0;
    this.updateOffset(0);
  };

  private clearRefreshTimer = () => {
    clearTimeout(this.refreshTimer);
  };

  private updateOffset = (offset: number) => {
    if (this.state.offset !== offset) {
      this.setState({
        offset
      });
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
      height,
      style,
      className,
      custom,
      distanceToRefresh,
      virtual,
      ...rest
    } = props;
    const { draging, status, offset, containerSize } = this.state;

    const cls = `zyouh-list__container ${className}`.trim();
    const width = '100%';
    const bodyCls = `zyouh-list__body ${
      !draging ? 'zyouh-list__body-refreshing' : ''
    }`.trim();

    const bodyStyle: React.CSSProperties = {
      transform: `translate3d(0, ${offset}px, 0)`
    };
    const normalIndicatorStyle: React.CSSProperties = {
      height: distanceToRefresh,
      transform: `translate3d(0, ${-distanceToRefresh! +
        Math.min(offset, distanceToRefresh!)}px, 0)`
    };

    const virtualListProps = omit(rest, [
      'children',
      'damping',
      'onLoadmore',
      'onRefresh',
      'refreshing'
    ]);

    return (
      <View style={style} className={cls}>
        <ScrollView
          id={this.domId}
          onScroll={this.handleScroll}
          style={{ width, height }}
          className='zyouh-list__scroller-view'
          onScrollToLower={this.handleScrollToLower}
          scrollY
        >
          {!custom && (
            <View
              style={normalIndicatorStyle}
              className={`zyouh-list__indicator ${
                status === REFRESH_STATUS.RELEASE ? 'flashing' : ''
              }`.trim()}
            >
              <View className='zyouh-list__indicator-dot'></View>
              <View className='zyouh-list__indicator-dot'></View>
              <View className='zyouh-list__indicator-dot'></View>
            </View>
          )}
          <View style={bodyStyle} className={bodyCls}>
            {virtual ? (
              <VirtualList
                width={width}
                ref={this.virtualListRef}
                height={containerSize}
                {...virtualListProps}
              >
                {props.children}
              </VirtualList>
            ) : (
              props.children
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  private addEventListener() {
    this.rootNode.addEventListener('touchstart', this.handleTouchStart, opts);
    this.rootNode.addEventListener('touchmove', this.handleTouchMove, opts);
    this.rootNode.addEventListener('touchend', this.handleTouchEnd, opts);
    this.rootNode.addEventListener('touchcancel', this.handleTouchEnd, opts);
  }

  private removeEventListener() {
    this.rootNode.removeEventListener('touchstart', this.handleTouchStart);
    this.rootNode.removeEventListener('touchmove', this.handleTouchMove);
    this.rootNode.removeEventListener('touchend', this.handleTouchEnd);
    this.rootNode.removeEventListener('touchcancel', this.handleTouchEnd);
  }

  private damping(offset: number) {
    const { distanceToRefresh, damping } = this.props;

    return offset > distanceToRefresh!
      ? Math.min(damping!, offset / (1 + Math.abs(offset) * 0.002))
      : offset;
  }

  private getRootNode() {
    this.rootNode = document.querySelector('#' + this.domId) as HTMLDivElement;
  }

  private checkIsInScrolling() {
    return this.getScrollOffset() > 0;
  }

  private getScrollOffset() {
    return (this.rootNode && Math.floor(this.rootNode.scrollTop)) || 0;
  }
}
