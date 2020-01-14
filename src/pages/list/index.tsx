import Taro from '@tarojs/taro';
import { View, Image } from '@tarojs/components';
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
    overscan: 5,
    onChange: data => {
      this.setState({
        list: data
      });
    }
  }, Taro);

  componentDidMount() {
    this.fetch();
  }

  fetch = () => {
    return getTopic(this.page).then(({ data }) => {
      const list: any[] = data.data || [];

      if (this.page === 1) {
        this.dataManager.set(list);
      } else {
        this.dataManager.push(...list);
      }

      if (list.length) {
        this.page += 1;
      } else {
        const total = this.dataManager.get().length;

        this.dataManager.updateConfig({
          itemSize: index => (index === total - 1 ? '140rpx' : '240rpx')
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
    this.dataManager.setLoadStatus({
      type: 'loadMore'
    });

    const length = this.dataManager.get().length;

    this.dataManager.updateConfig({
      itemSize: index => {
        return index === length - 1 ? '140rpx' : '240rpx';
      }
    });

    this.fetch().then(() => {
      this.dataManager.clearAllLoadStatus();
      this.loadStatus = 'none';
      this.dataManager.updateConfig({
        itemSize: '240rpx'
      });
    });
  };

  handleRefresh = cb => {
    if (this.loadStatus == 'refreshing') {
      return;
    }

    this.page = 1;
    this.loadStatus = 'refreshing';
    this.dataManager.clearAllLoadStatus();

    this.fetch()
      .then(cb)
      .then(() => {
        this.dataManager.updateConfig({
          itemSize: '240rpx'
        });
        this.loadStatus = 'none';
      });
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
          onLoadmore={this.handleLoadMore}
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
