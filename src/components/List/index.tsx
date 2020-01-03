import Taro, { PureComponent } from '@tarojs/taro';

import './index.less';
import { ListProps } from './types';

export default class TaroList extends PureComponent<ListProps> {
  static options = {
    addGlobalClass: true
  };

  render() {
    return this.props.children;
  }
}
