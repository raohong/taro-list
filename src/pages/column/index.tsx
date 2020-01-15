import Taro from '@tarojs/taro';
import { View } from '@tarojs/components';
import {
  VirutalListDataManager,
  VirutalListItemData
} from 'taro-list-data-manager';
import TaroList from '../../components/List/index';

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

interface ColumnListState {
  list: VirutalListItemData[];
}

type LoadStatus = 'none' | 'loadMore' | 'ended' | 'loading' | 'refreshing';

const HEIGHT = '410rpx';

export default class List extends Taro.Component<any, ColumnListState> {
  page = 1;
  state: ColumnListState = {
    list: []
  };

  loadStatus: LoadStatus = 'none';

  dataManager = new VirutalListDataManager(
    {
      itemSize: HEIGHT,
      overscan: 5,
      column: 2,
      onChange: data => {
        this.setState({
          list: data
        });
      }
    },
    Taro
  );

  componentDidMount() {
    this.fetch();
  }

  fetch = (cb?: (data: any[]) => void) => {
    return getTopic(this.page).then(({ data }) => {
      const list: any[] = data.data || [];

      if (typeof cb === 'function') {
        cb(list);
      } else {
        if (this.page === 1) {
          this.dataManager.set(list);
        } else {
          this.dataManager.push(...list);
        }
      }

      if (list.length) {
        this.page += 1;
      } else {
        const total = this.dataManager.get().length;

        this.dataManager.updateConfig({
          itemSize: index => (index === total - 1 ? '140rpx' : HEIGHT)
        });
        this.dataManager.setLoadStatus({
          type: 'ended'
        });
        // 没有更多了
      }
    });
  };

  handleLoadMore = () => {
    // 这里假设加载完毕就不能再次加载了
    if (this.loadStatus !== 'none') {
      return;
    }

    this.loadStatus = 'loadMore';
    const { clearAndAddData } = this.dataManager.setLoadStatus(
      {
        type: 'loadMore'
      },
      '140rpx'
    );

    this.fetch(list => {
      clearAndAddData(...list);
      this.loadStatus = 'none';
    });
  };

  handleRefresh = cb => {
    if (this.loadStatus == 'refreshing') {
      return;
    }

    this.page = 1;
    this.loadStatus = 'refreshing';
    this.dataManager.clearAllLoadStatus();
    this.dataManager.updateConfig({
      itemSize: HEIGHT
    });

    this.fetch()
      .then(cb)
      .then(() => {
        this.loadStatus = 'none';
      });
  };

  render() {
    const { list } = this.state;

    list.forEach(item => {
      item.item.forEach(topic => {
        if (!topic.type) {
          topic.avatarUrl = `url(${topic.author.avatar_url}) no-repeat center / cover`;
        }
      });
    });

    return (
      <View className='page column-page'>
        <TaroList
          onRefresh={this.handleRefresh}
          onLoadmore={this.handleLoadMore}
          virtual
          height='100vh'
          dataManager={this.dataManager}
        >
          {list.map(item =>
            item.item[0].type === 'loadMore' ? (
              <View className='loadStatus' style={item.style}>
                加载更多...
              </View>
            ) : item.item[0].type === 'ended' ? (
              <View className='loadStatus' style={item.style}>
                没有更多了
              </View>
            ) : (
              <View
                style={{
                  ...item.style
                }}
                key={item.index}
                className='topic-column'
              >
                {item.item.map((topic, k) => (
                  <View className='topic-item' key={topic.id}>
                    <View className='topic-item-inner'>
                      <View
                        style={{
                          background: topic.avatarUrl
                        }}
                        className='topic-item__avatar'
                      />
                      <View className='topic-item__main'>
                        <View className='topic-item__title'>
                          #{item.index * 2 + k} - {topic.title}
                        </View>
                        <View>{topic.author.loginname}</View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )
          )}
        </TaroList>
      </View>
    );
  }
}
