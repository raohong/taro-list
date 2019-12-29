import Taro, { Component, ENV_TYPE } from '@tarojs/taro';
import PropTypes from 'prop-types';
import { View } from '@tarojs/components';
import ResizeObsever from 'resize-observer-polyfill';
import { VirutalListContext, VirtualListContext } from './context';

export interface VirtualItemProps {
  index: number;
  style?: React.CSSProperties;
}

export default class VirtualItem extends Component<VirtualItemProps> {
  static contextType = VirutalListContext;

  static propTypes = {
    index: PropTypes.number.isRequired,
    style: PropTypes.object
  };

  static defaultProps = {
    style: {}
  };

  static index = 0;
  private removeCb: () => void;
  private id = `taro-list-virutal-item-${(VirtualItem.index = ++VirtualItem.index)}`;
  private rootNode: HTMLDivElement;
  private ob: ResizeObsever | null = null;
  private weappOb: any;

  componentDidMount() {
    if (!this.context) {
      return;
    }

    const { registerUpdateCallback } = this.context as VirtualListContext;
    this.removeCb = registerUpdateCallback(this.getSize);
  }

  componentWillUnmount() {
    if (this.removeCb) {
      this.removeCb();
    }
  }

  getSize = () => {
    const { onResize } = this.context as VirtualListContext;
    const query = Taro.createSelectorQuery().in(this.$scope);

    query.select(`#${this.id}`).boundingClientRect();

    query.exec(rect => {
      if (!rect || !rect[0]) {
        return;
      }

      const { width, height } = rect[0];
      onResize(this.props.index, { width, height });
    });
  };

  saveRef = ref => {
    setTimeout(() => {
      if (Taro.getEnv() === ENV_TYPE.WEB && ref) {
        this.handleWEBObserver(ref._rendered && ref._rendered.dom);
      }
    }, 0);
  };

  handleWEBObserver(node: HTMLDivElement) {
    // 已经有 rootNode
    if (this.ob) {
      if (node === null) {
        this.ob.unobserve(this.rootNode);
        return;
      } else if (node !== this.rootNode!) {
        this.ob.unobserve(this.rootNode);
        this.ob.observe(node);
        this.rootNode = node;
      }
    } else if (node) {
      this.rootNode = node;
      this.ob = new ResizeObsever(this.handleWEBResizeCallback);
      this.ob.observe(node);
    }
  }

  handleWEBResizeCallback: ResizeObserverCallback = ([entry]) => {
    if (!this.context) {
      return;
    }
    const { width, height } = entry.contentRect;

    if (width === 0 || height === 0) {
      return;
    }
    this.context.onResize(this.props.index, { width, height });
  };

  render() {
    const { style, index } = this.props;

    if (!this.context) {
      return this.props.children;
    }

    const { getStyle } = this.context as VirtualListContext;
    const itemStyle = typeof getStyle === 'function' ? getStyle(index) : null;

    return itemStyle === null ? null : (
      <View
        ref={this.saveRef}
        id={this.id}
        style={{
          ...style,
          ...itemStyle
        }}
      >
        {this.props.children}
      </View>
    );
  }
}
