import Taro from '@tarojs/taro';
import { View } from '@tarojs/components';

import List from '../../components/List/index';
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

interface IndexState {
  list: VirutalListItemData[];
}

export default class Index extends Taro.Component<any, IndexState> {
  page = 1;
  state: IndexState = {
    list: []
  };

  dataManager = new VirutalListDataManager({
    itemSize: 120,
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
      }
      this.dataManager.push(...list);
    });
  };

  handleRefresh = cb => {
    this.fetch().then(cb);
  };

  render() {
    const { list } = this.state;
    const { windowHeight } = Taro.getSystemInfoSync();

    return (
      <View
        style={{
          fontSize: '16px',
          backgroundColor: '#f4f4f4'
        }}
      >
        <View className='menu-list'>
          <View
            className='menu-item'
            onClick={() =>
              this.dataManager.updateConfig({
                itemSize: 100 + Math.floor(Math.random() * 100)
              })
            }
          >
            改变 itemSize
          </View>
          <View
            className='menu-item'
            onClick={() =>
              this.dataManager.updateConfig({
                stickyIndices: [0, 1, 2]
              })
            }
          >
            设置 sticky
          </View>
        </View>
        <List
          onRefresh={this.handleRefresh}
          onLoadmore={this.fetch}
          virtual
          height={windowHeight}
          dataManager={this.dataManager}
        >
          {list.map(item => (
            <View
              key={item.item.id}
              style={{
                padding: '10px 10px 10px',
                overflow: 'hidden',
                ...item.style
              }}
            >
              <View
                style={{
                  padding: '10px',
                  display: 'flex',
                  backgroundColor: '#fff',
                  borderRadius: '5px'
                }}
              >
                <View
                  style={{
                    width: '50px',
                    flexShrink: 0,
                    marginRight: '10px',
                    height: '50px',
                    background: `no-repeat url(${item.item.author.avatar_url}) center / cover`
                  }}
                />
                <View>
                  <View>{item.item.title}</View>
                  <View>{item.item.author.loginname}</View>
                </View>
              </View>
            </View>
          ))}
        </List>
      </View>
    );
  }
}
