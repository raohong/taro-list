import Taro from '@tarojs/taro';
import { View } from '@tarojs/components';
import {
  VirutalListDataManager,
  VirutalListItemData
} from 'taro-list-data-manager';
import TaroList from '../../components/List';
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

const HEIGHT = '240rpx';

type LoadStatus =
  | 'none'
  | 'loadMore'
  | 'ended'
  | 'noData'
  | 'loading'
  | 'refreshing';

export default class List extends Taro.Component<any, ListState> {
  page = 1;
  state: ListState = {
    list: []
  };

  loadStatus: LoadStatus = 'none';

  dataManager = new VirutalListDataManager(
    {
      itemSize: HEIGHT,
      overscan: 5,
      // estimatedSize 尽可能接近真实尺寸
      estimatedSize: 70,
      onChange: data => {
        this.setState({
          list: data
        });
      }
    },
    Taro
  );

  count = 0;

  handleInit = () => {
    this.loadStatus = 'loading';

    this.dataManager.setLoadStatus(
      {
        type: 'loading'
      },
      '140rpx'
    );

    this.refresh();
  };

  refresh = () => {
    this.count = 0;

    return this.fetch().then(({ list, status }) => {
      // 请求结束后 清空所有加载状态 复原 itemSize
      this.dataManager.clearAllLoadStatus();
      this.dataManager.updateConfig({
        itemSize: HEIGHT
      });

      if (status !== 'none') {
        this.dataManager.clear();
        this.dataManager.setLoadStatus({ type: status }, '140rpx');
      } else {
        this.dataManager.set(list);
      }

      this.loadStatus = status;
    });
  };

  fetch = (): Promise<{
    list: any[];
    status: 'noData' | 'ended' | 'none';
  }> => {
    return new Promise((resolve, reject) => {
      getTopic(this.page)
        .then(({ data }) => {
          this.count++;
          const list: any[] = data.data || [];
          // 这里模仿数据记载完
          if (this.count === 10) {
            list.length = 0;
          }

          if (list.length) {
            this.page++;
          }

          resolve({
            list,
            status:
              list.length === 0
                ? this.page === 1
                  ? 'noData'
                  : 'ended'
                : 'none'
          });
        })
        .catch(reject);
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

    this.fetch().then(({ list, status }) => {
      this.loadStatus = status;
      clearAndAddData(...list);

      if (status !== 'none') {
        this.dataManager.setLoadStatus(
          {
            type: 'ended'
          },
          '140rpx'
        );
      }
    });
  };

  handleRefresh = cb => {
    if (this.loadStatus !== 'none') {
      return;
    }

    this.page = 1;
    this.loadStatus = 'refreshing';

    // 刷新时 清空所有加载状态 复原 itemSize
    this.dataManager.clearAllLoadStatus();
    this.dataManager.updateConfig({
      itemSize: HEIGHT
    });

    this.refresh()
      .then(cb)
      .catch(cb);
  };
  render() {
    const { list } = this.state;

    list.forEach(item => {
      if (!item.item.type) {
        item.item.avatarUrl = `url(${item.item.author.avatar_url}) no-repeat center / cover`;
      }
    });

    return (
      <View className='page list-page'>
        <TaroList
          onRefresh={this.handleRefresh}
          onLoadMore={this.handleLoadMore}
          onVirtualListInit={this.handleInit}
          virtual
          height='100vh'
          dataManager={this.dataManager}
        >
          {list.map(item =>
            item.item.type === 'loadMore' ? (
              <View className='loadStatus' style={item.style}>
                加载更多...
              </View>
            ) : item.item.type === 'ended' ? (
              <View className='loadStatus' style={item.style}>
                没有更多了
              </View>
            ) : item.item.type === 'loading' ? (
              <View className='loadStatus' style={item.style}>
                加载中...
              </View>
            ) : (
              <View
                className='topic-item'
                key={item.item.id}
                style={{
                  ...item.style
                }}
              >
                <View className='topic-item-inner'>
                  <View
                    style={{
                      background: item.item.avatarUrl
                    }}
                    className='topic-item__avatar'
                  />
                  <View>
                    <View className='topic-item__title'>
                      #{item.index} - {item.item.title}
                    </View>
                    <View>{item.item.author.loginname}</View>
                  </View>
                </View>
              </View>
            )
          )}
        </TaroList>
      </View>
    );
  }
}
