import Taro from '@tarojs/taro';
import { View } from '@tarojs/components';

import List from '../../components/List';

export default () => (
  <View>
    <List width='100%' height='100vh'>
      <View style={{ height: '200vh', backgroundColor: '#ccc' }}>123123</View>
    </List>
  </View>
);
