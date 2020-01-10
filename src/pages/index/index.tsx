import Taro from '@tarojs/taro';
import { View, Input } from '@tarojs/components';

import './index.less';

export default () => {
  const menus = [
    {
      title: '普通下拉加载数据',
      url: '/pages/normal/index'
    },
    {
      title: '虚拟列表',
      url: '/pages/list/index'
    },
    {
      title: '虚拟列表(两列)',
      url: '/pages/column/index'
    }
  ];

  return (
    <View className='page'>
      {menus.map(item => (
        <View
          className='menu-item'
          key={item.url}
          hoverClass='hover'
          onClick={() => Taro.navigateTo({ url: item.url })}
        >
          {item.title}
        </View>
      ))}
    </View>
  );
};
