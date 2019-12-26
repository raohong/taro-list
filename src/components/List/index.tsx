import Taro, { PureComponent } from '@tarojs/taro';
import { View, ScrollView } from '@tarojs/components';

import { DIRECTION, sizeProp } from './types';
import './index.less';
import { normalizeStyleValue, normalizeStyle } from './utils';

export interface ListProps {
  onRefresh?: () => void;
  refreshing?: boolean;
  height: string | number;
  width: string | number;
  className?: string;
  style?: React.CSSProperties;
  onLoadmore?: () => void;
  onScroll?: (evt: any) => void;
  scrollDirection?: DIRECTION;
}

interface ListState {
  containerSize: number;
}

export default class TaroList extends PureComponent<ListProps, ListState> {
  static defaultProps: Partial<ListProps> = {
    width: '100%',
    height: 600,
    scrollDirection: DIRECTION.VERTICAL,
    className: ''
  };

  static options = {
    addGlobalClass: true
  };

  private containerSize: number = 0;
  private bodySize: number = 0;
  private down: boolean = false;
  private refreshTimer: number = 0;

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

  private handleScroll = () => {};

  private handleTouchStart = () => {};

  private handleTouchMove = () => {};
  private handleTouchEnd = () => {};

  render() {
    const {
      scrollDirection,
      width,
      height,
      style,
      className,
      refreshing
    } = this.props;

    const cls = `taro-list__container ${className}`.trim();

    return (
      <View style={normalizeStyle(style)} className={cls}>
        <ScrollView
          style={normalizeStyle({ width, height })}
          className='taro-list__scroll-view'
          onScroll={this.handleScroll}
          scrollX={scrollDirection === DIRECTION.HORIZONTAL}
          scrollY={scrollDirection === DIRECTION.VERTICAL}
        >
          <View
            onTouchStart={this.handleTouchStart}
            onTouchCancel={this.handleTouchEnd}
            onTouchMove={this.handleTouchMove}
            onTouchEnd={this.handleTouchEnd}
            className='taro-list__body'
          ></View>
        </ScrollView>
      </View>
    );
  }
}
