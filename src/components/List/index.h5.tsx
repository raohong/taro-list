import Taro, { PureComponent } from '@tarojs/taro';
import { View, ScrollView } from '@tarojs/components';

import VirtualList from './VirtualList';
import {
  REFRESH_STATUS,
  ListProps,
  MAX_REFRESHING_TIME,
  DISTANCE_TO_REFRESH,
  DAMPING,
  HEIGHT,
  ListPropTypes
} from './types';
import './index.less';
import { VirtualListContext } from './VirtualList/context';

interface ListState {
  containerSize: number;
  status: REFRESH_STATUS;
  draging: boolean;
  offset: number;
}

const opts = {
  passive: false
};

export default class TaroList extends PureComponent<ListProps, ListState> {
  static defaultProps: Partial<ListProps> = {
    height: HEIGHT,
    className: '',
    width: '100%',
    distanceToRefresh: DISTANCE_TO_REFRESH,
    damping: DAMPING
  };

  static propTypes = ListPropTypes;

  static options = {
    addGlobalClass: true
  };

  static index = 0;

  private rootNode: HTMLDivElement;
  private refreshTimer: number = 0;
  private initialY = 0;
  private virtualListRef = Taro.createRef<VirtualList>();

  private domId = `zyouh-list__id-${TaroList.index++}`;

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
    this.triggerRefresh();

    if (this.props.virtual) {
      this.setVirtualListHeight();
    }
  }

  componentDidUpdate(prevProps: ListProps) {
    const { refreshing, virtual, height } = this.props;
    if (prevProps.refreshing !== refreshing) {
      this.triggerRefresh();
    }

    const offset = this.getScrollOffset();

    if (virtual && this.virtualListRef.current) {
      this.virtualListRef.current.setScrollOffset(offset);
    }

    if (virtual && height !== prevProps.height) {
      this.setVirtualListHeight();
    }
  }

  componentWillUnmount() {
    this.clearRefreshTimer();
    this.removeEventListener();
  }

  private setVirtualListHeight() {
    this.setState({
      containerSize: this.rootNode.offsetHeight
    });
  }

  private onScrollOffsetChange = (offset: number) => {
    this.virtualListRef.current!.setScrollOffset(offset);
  };

  private handleTouchStart = (evt: TouchEvent) => {
    if (this.state.status === REFRESH_STATUS.RELEASE) {
      this.cancelEvent(evt);
      return;
    }

    this.initialY = evt.touches[0].clientY;
  };

  private handleTouchMove = (evt: TouchEvent) => {
    const y = evt.touches[0].clientY;
    const { status, draging, offset } = this.state;

    if (status === REFRESH_STATUS.RELEASE) {
      this.cancelEvent(evt);
      return;
    }

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
      this.initialY = y;
    }

    const deltaY = this.damping(y - this.initialY);

    this.cancelEvent(evt);
    this.updateOffset(deltaY);

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
    const { status, draging } = this.state;
    if (status === REFRESH_STATUS.RELEASE) {
      return;
    }

    if (draging) {
      this.setState(() => ({
        draging: false
      }));
    }

    if (status === REFRESH_STATUS.ACTIVE) {
      this.setRefresh();
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
        this.reset();
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

    if (this.state.draging) {
      return;
    }

    if (refreshing) {
      this.setRefresh();
    } else {
      this.reset();
    }
  };

  private reset = () => {
    this.initialY = 0;
    this.updateOffset(0);
    this.setState({
      status: REFRESH_STATUS.NONE
    });
  };

  private cancelEvent = (evt: UIEvent) => {
    evt.preventDefault();
    evt.stopPropagation();
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
      width,
      style,
      className,
      custom,
      distanceToRefresh,
      virtual,
      itemCount,
      itemSize,
      estimatedSize,
      stickyIndices,
      scrollToIndex,
      overscan,
      enableBackToTop,
      scrollWithAnimation,
      dataManager
    } = props;
    const { draging, status, offset, containerSize } = this.state;

    const cls = `zyouh-list__container ${className}`.trim();
    const bodyCls = `zyouh-list__body ${
      !draging ? 'zyouh-list__body-transition' : ''
    }`.trim();

    const bodyStyle: React.CSSProperties = {
      transform: `translate3d(0, ${offset}px, 0)`
    };
    const normalIndicatorStyle: React.CSSProperties = {
      height: distanceToRefresh,
      transform: `translate3d(0, ${-distanceToRefresh! +
        Math.min(offset, distanceToRefresh!)}px, 0)`
    };

    return (
      <View style={style} className={cls}>
        <ScrollView
          id={this.domId}
          onScroll={this.handleScroll}
          scrollWithAnimation={scrollWithAnimation}
          enableBackToTop={enableBackToTop}
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
                estimatedSize={estimatedSize}
                itemCount={itemCount}
                dataManager={dataManager}
                itemSize={itemSize}
                overscan={overscan}
                scrollToIndex={scrollToIndex}
                stickyIndices={stickyIndices}
                onOffsetChange={this.onScrollOffsetChange}
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
