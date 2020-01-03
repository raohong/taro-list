import Taro, { useState, useRef, useCallback, useEffect } from '@tarojs/taro';
import { View, Image } from '@tarojs/components';

import List from '../../components/List/index';
import VirtualItem from '../../components/List/VirtualList/VirtualItem';
import { VirutalListDataManager } from '../../components/List/VirtualList/VirutalListDataManager';
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


export default () => {
  const pageRef = useRef(1);
  const [list, set] = useState<any[]>([]);
  const dataManager = useRef<VirutalListDataManager>(
    new VirutalListDataManager(set)
  );
  const [loading, setLoading] = useState(false);
  const [ened, setEnded] = useState(false);

  const fetch = useCallback(() => {
    setLoading(true);
    return getTopic(pageRef.current)
      .then(({ data }) => {
        const list: any[] = data.data || [];
        if (list.length) {
          pageRef.current += 1;
        } else {
          setEnded(true);
        }
        dataManager.current.push(list);
      })
      .then(() => {
        setLoading(false);
      });
  }, []);

  const handleRefresh = useCallback(
    cb => {
      pageRef.current = 0;
      setEnded(false);
      fetch().then(cb);
    },
    [fetch]
  );

  useEffect(() => {
    fetch();
  }, []);

  const { windowHeight } = Taro.getSystemInfoSync();


  return (
    <View
      style={{
        fontSize: '16px',
        backgroundColor: '#f4f4f4'
      }}
    >
      <List
        onRefresh={handleRefresh}
        onLoadmore={fetch}
        estimatedSize={80}
        itemSize={80}
        virtual
        dynamic={false}
        height={windowHeight}
        dataManager={dataManager.current}
        itemCount={dataManager.current.get().length}
      >
        {list.map(item => (
          <VirtualItem index={item.index} style={item.style} key={item.item.id}>
            <View
              style={{
                padding: '10px 10px 10px'
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
                <Image
                  mode='aspectFill'
                  style={{
                    width: '50px',
                    flexShrink: 0,
                    marginRight: '10px',
                    height: '50px'
                  }}
                  src={item.item.author.avatar_url}
                />
                <View>
                  <View>{item.item.title}</View>
                  <View>{item.item.author.loginname}</View>
                </View>
              </View>
            </View>
          </VirtualItem>
        ))}
      </List>
    </View>
  );
};
