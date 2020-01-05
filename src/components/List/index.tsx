import Taro, { PureComponent } from '@tarojs/taro';
import { Block } from '@tarojs/components';

import './index.less';
import { ListProps } from './types';

export default class TaroList extends PureComponent<ListProps> {
  static options = {
    addGlobalClass: true
  };

  render() {
    return <Block>{this.props.children}</Block>;
  }
}
