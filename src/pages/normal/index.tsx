import Taro from '@tarojs/taro';
import { View, Input } from '@tarojs/components';
import {
  VirutalListDataManager,
  VirutalListItemData
} from 'taro-list-data-manager';
import TaroList from '../../components/List/index';

import './index.less';

interface NormalListState {
  list: VirutalListItemData<number>[];
  scrollToIndex: number | undefined;
}

export default class List extends Taro.Component<any, NormalListState> {
  page = 1;
  state: NormalListState = {
    list: [],
    scrollToIndex: undefined
  };

  dataManager = new VirutalListDataManager<number>({
    itemSize: 50,
    onChange: data => {
      this.setState({
        list: data
      });
    }
  }, Taro);
  componentWillMount() {
    for (let i = 0; i < 10; i++) {
      this.add(i * 200);
    }
  }
  add = (start = 0) => {
    const data = Array.from({ length: 2000 }, (_, i) => start + i);

    this.dataManager.push(...data);
  };

  handleBlur = evt => {
    const { value } = evt.detail;

    const index = parseInt(value);

    if (!isNaN(index)) {
      this.setState({
        scrollToIndex: index
      });
    }
  };

  render() {
    const { list, scrollToIndex } = this.state;

    return (
      <View>
        <View className='action-area'>
          <Input
            className='input'
            onBlur={this.handleBlur}
            placeholder='输入 scrollToIndex'
            type='number'
          />
        </View>
        <TaroList
          scrollToIndex={scrollToIndex}
          virtual
          height='90vh'
          dataManager={this.dataManager}
        >
          {list.map(item => (
            <View style={item.style} className='item'>
              #{item.index}
            </View>
          ))}
        </TaroList>
      </View>
    );
  }
}
