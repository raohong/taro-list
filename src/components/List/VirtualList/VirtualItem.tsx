import Taro, { PureComponent, ENV_TYPE } from '@tarojs/taro';
import PropTypes from 'prop-types';
import { View } from '@tarojs/components';
import ResizeObsever from 'resize-observer-polyfill';
import { VirutalListContext, VirtualListContext } from './context';

export interface VirtualItemProps {
  index: number;
  style?: React.CSSProperties;
  className?: React.CSSProperties;
  id?: string;
}

export default class VirtualItem extends PureComponent<VirtualItemProps> {
  static contextType = VirutalListContext;

  static options = {
    addGlobalClass: true
  };

  static propTypes = {
    index: PropTypes.number.isRequired,
    style: PropTypes.object
  };

  static defaultProps = {
    style: {}
  };


  private rootNode: HTMLDivElement;
  private ob: ResizeObsever | null = null;

  componentDidMount() {
    const { dynamic } = this.context as VirtualListContext;
    if (Taro.getEnv() === ENV_TYPE.WEAPP && dynamic) {
      this.handleWeappGetSize();
    }
  }

  componentWillUnmount() {
    if (Taro.getEnv() === ENV_TYPE.WEB && this.ob) {
      this.ob.disconnect();
    }
  }

  saveRef = ref => {
    const { dynamic } = this.context as VirtualListContext;

    if (Taro.getEnv() === ENV_TYPE.WEB && ref && dynamic) {
      requestAnimationFrame(() => {
        this.handleWEBObserver(ref._rendered && ref._rendered.dom);
      });
    }
  };

  handleWeappGetSize = () => {
    const query = Taro.createSelectorQuery().in(this.$scope);

    query.select('.virutal-list-item').boundingClientRect();
    query.exec(rect => {
      if (!rect || !rect[0]) {
        return;
      }

      const { width, height } = rect[0];

      if (width === 0 || height === 0) {
        return;
      }

      this.context.onResize(this.props.index, { width, height });
    });
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
    const { style, id, className } = this.props;

    const cls = `virutal-list-item ${className || ''}`.trim();

    return (
      <View ref={this.saveRef} id={id} className={cls} style={style}>
        {this.props.children}
      </View>
    );
  }
}
