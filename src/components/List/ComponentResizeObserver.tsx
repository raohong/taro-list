import Taro from '@tarojs/taro';
import ResizeObserver from 'resize-observer-polyfill';

type ResizeObserverNode = HTMLElement | null;

export interface ComponentResizeObserverProps {
  onResize?: () => void;
}

export class ComponentResizeObserver extends Taro.PureComponent<
  ComponentResizeObserverProps
> {
  private lastNode: ResizeObserverNode = null;
  private ob: ResizeObserver | null = null;
  private lastWidth = -1;
  private lastHeight = -1;

  componentDidMount() {
    // @ts-ignore
    const node = this.vnode.dom as ResizeObserverNode;

    if (node) {
      this.ob = new ResizeObserver(this.handleResize);
      this.lastNode = node;
      this.ob.observe(node);
    }
  }

  componentDidUpdate() {
    // @ts-ignore
    const node = this.vnode.dom as ResizeObserverNode;

    if (this.ob === null) {
      if (node) {
        this.ob = new ResizeObserver(this.handleResize);
        this.lastNode = node;
        this.ob.observe(node);
      }
    } else {
      if (node && node !== this.lastNode) {
        this.ob.unobserve(this.lastNode!);
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

  handleResize: ResizeObserverCallback = ([entry]) => {
    const { width, height } = entry.contentRect;
    const { onResize } = this.props;

    if (
      (width !== this.lastWidth || height !== this.lastHeight) &&
      typeof onResize === 'function'
    ) {
      onResize();
    }

    this.lastWidth = width;
    this.lastHeight = height;
  };

  render() {
    return this.props.children;
  }
}
