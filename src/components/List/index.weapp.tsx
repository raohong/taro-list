import Taro, { PureComponent } from '@tarojs/taro';
import PropTypes from 'prop-types';
import { View, ScrollView } from '@tarojs/components';

import VirtualList from './VirtualList';
import { ListProps } from './types';
import './index.less';

interface ListState {
  containerSize: number;
}

const  normalize = (value:any) => typeof value === 'number' ? `${value}px`: value

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
  private virtualListRef = Taro.createRef<VirtualList>();

  private domId = `zyouh-list__id-${TaroList.index++}`;

  constructor(props: ListProps) {
    super(props);

    this.state = {
      containerSize: 0
    };
  }

  private handleScrollToLower = () => {
    const { onLoadmore } = this.props;

    if (typeof onLoadmore === 'function') {
      onLoadmore();
    }
  };

  setRefresh = () => {
    console.log('refresh')
  }

  render() {
    const props = this.props;
    const {
      height,
      style,
      className,
      custom,
      distanceToRefresh,
      damping,
      virtual,
      itemCount,
      itemSize,
      estimatedSize,
      stickyIndices,
      refreshing,
      overscan
    } = props;
    const { containerSize } = this.state;

    const cls = `zyouh-list__container ${className}`.trim();
    const scrollerStyle = {
      width: '100%',
      height: normalize(height),
    };

    const refreshConfig = {
      damping,
      distanceToRefresh,
      // @ts-ignore
      id: this.id
    };

    const indicatorStyle = {
      height: normalize(distanceToRefresh),
      marginTop:  normalize(-distanceToRefresh!),
    }

    return (
      <View data-refreshing={refreshing} style={style} className={cls}>
        <wxs module='refresh' src='./refresh.wxs'></wxs>
        <include src='./index.template.wxml' />
        <ScrollView
          id={this.domId}
          style={scrollerStyle}
          className='zyouh-list__scroller-view'
          onScrollToLower={this.handleScrollToLower}
          onTouchStart='{{refresh.handleTouchStart}}'
          onTouchMove='{{refresh.handleTouchMove}}'
          onTouchEnd='{{refresh.handleTouchEnd}}'
          onTouchCancel='{{refresh.handleTouchEnd}}'
          scrollY
        >
          {!custom && (
            <View style={indicatorStyle} className='zyouh-list__indicator'>
              <View  className='zyouh-list__indicator-dot'></View>
              <View className='zyouh-list__indicator-dot'></View>
              <View className='zyouh-list__indicator-dot'></View>
              <View onClick={this.setRefresh} style={{display: 'none'}} />
            </View>
          )}
          <View data-config={refreshConfig} className='zyouh-list__body'>
            {virtual ? (
              <VirtualList
                width='100%'
                ref={this.virtualListRef}
                height={containerSize}
                estimatedSize={estimatedSize}
                itemCount={itemCount}
                itemSize={itemSize}
                stickyIndices={stickyIndices}
                overscan={overscan}
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
}
