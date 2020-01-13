import Taro from "@tarojs/taro-h5";
import ResizeObserver from 'resize-observer-polyfill';
export class ComponentResizeObserver extends Taro.PureComponent {
  constructor() {
    super(...arguments);
    this.lastNode = null;
    this.ob = null;
    this.lastWidth = -1;
    this.lastHeight = -1;
  }
  componentDidMount() {
    // @ts-ignore
    const node = this.vnode.dom;
    if (node) {
      this.ob = new ResizeObserver(this.handleResize);
      this.lastNode = node;
      this.ob.observe(node);
    }
  }
  componentDidUpdate() {
    // @ts-ignore
    const node = this.vnode.dom;
    if (this.ob === null) {
      if (node) {
        this.ob = new ResizeObserver(this.handleResize);
        this.lastNode = node;
        this.ob.observe(node);
      }
    } else {
      if (node && node !== this.lastNode) {
        this.ob.unobserve(this.lastNode);
        this.ob.observe(node);
        this.lastNode = node;
      }
    }
  }
  componentWillUnmount() {
    if (this.ob !== null) {
      this.ob.disconnect();
    }
  }
  render() {
    return this.props.children;
  }
  handleResize = ([entry]) => {
    const { width, height } = entry.contentRect;
    const { onResize } = this.props;
    if ((width !== this.lastWidth || height !== this.lastHeight) && typeof onResize === 'function') {
      onResize();
    }
    this.lastWidth = width;
    this.lastHeight = height;
  };
}