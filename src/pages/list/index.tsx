import Taro from '@tarojs/taro';
import { View, Input } from '@tarojs/components';

import TaroList from '../../components/List/index';
import {
  VirutalListDataManager,
  VirutalListItemData
} from '../../components/List/VirtualList/VirutalListDataManager';
import './index.less';

function getTopic(page: number) {
  return Taro.request({
    method: 'GET',
    url: 'https://cnodejs.org/api/v1/topics',
    data: {
      page
    }
  });
}

interface ListState {
  list: VirutalListItemData[];
}

type LoadStatus = 'none' | 'loadMore' | 'ended' | 'loading' | 'refreshing';

export default class List extends Taro.Component<any, ListState> {
  page = 1;
  state: ListState = {
    list: []
  };

  loadStatus: LoadStatus = 'none';

  dataManager = new VirutalListDataManager({
    itemSize: '240rpx',
    onChange: data => {
      this.setState({
        list: data
      });
    }
  });

  componentDidMount() {
    this.fetch();
  }

  fetch = () => {
    return getTopic(this.page).then(({ data }) => {
      const list: any[] = data.data || [];

      if (list.length) {
        this.page += 1;
      } else {
        // 没有更多了
      }
      this.dataManager.push(...list);
    });
  };

  handleLoadMore = () => {
    // 这里假设加载完毕就不能再次加载了
    if (this.loadStatus !== 'none') {
      return;
    }
  };

  handleRefresh = cb => {
    if (this.loadStatus == 'refreshing') {
      return;
    }

    this.page = 1;
    this.loadStatus = 'refreshing';

    this.fetch()
      .then(cb)
      .then(() => {
        this.loadStatus = 'none';
      });
  };

  render() {
    const { list } = this.state;

    return (
      <View className='page'>
        <TaroList
          onRefresh={this.handleRefresh}
          onLoadmore={this.handleLoadMore}
          virtual
          height='100vh'
          dataManager={this.dataManager}
        >
          {list.map(item => (
            <View
              className='topic-item'
              key={item.item.id}
              style={{
                ...item.style
              }}
            >
              <View className='topic-item-inner'>
                <View
                  className='topic-item__avatar'
                  style={{
                    background: `no-repeat url(${item.item.author.avatar_url}) center / cover`
                  }}
                />
                <View>
                  <View className='topic-item__title'>
                    #{item.index} - {item.item.title}
                  </View>
                  <View>{item.item.author.loginname}</View>
                </View>
              </View>
            </View>
          ))}
        </TaroList>
      </View>
    );
  }
}
