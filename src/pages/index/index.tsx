import Taro, { useState, useRef, useCallback, useEffect } from '@tarojs/taro';
import { View, Image } from '@tarojs/components';

import List from '../../components/List/index';
import VirtualItem from '../../components/List/VirtualList/VirtualItem';

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
  const [loading, setLoading] = useState(false);
  const [ened, setEnded] = useState(false);

  const fetch = useCallback(() => {
    setLoading(true);
    return getTopic(pageRef.current)
      .then(({ data }) => {
        const list = data.data || [];
        if (list.length) {
          pageRef.current += 1;
        } else {
          setEnded(true);
        }

        set(prev => prev.concat(list));
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
        height={windowHeight}
        itemCount={list.length}
        virtual
      >
        {pageRef.current === 1 && loading ? 'loading...' : null}
        {list.map((item, index) => (
          <VirtualItem index={index} key={index}>
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
                  src={item.author.avatar_url}
                />
                <View>
                  <View>{item.title}</View>
                  <View>{item.author.loginname}</View>
                </View>
              </View>
            </View>
          </VirtualItem>
        ))}

        {pageRef.current > 1 && loading ? (
          <View style={{ textAlign: 'center' }}>加载更多</View>
        ) : null}
        {ened ? <View style={{ textAlign: 'center' }}>没有更多了</View> : null}
      </List>
    </View>
  );
};
