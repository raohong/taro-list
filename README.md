# taro-list

> 支持下拉刷新 、 加载更多 、虚拟列表

## 安装及使用

```
npm i taro-list
npm i taro-list-data-manager

```

[h5 demo](https://raohong.github.io/taro-list-demo/dist/index.html)

小程序 demo

![小程序 demo](https://i.loli.net/2020/01/16/Q4d1eZDXbfnv93y.jpg)

1. 配置文件里添加

```
 copy: {
    patterns: [
      {
        from:  'node_modules/taro-list/dist/weapp/components/List/refresh.wxs',
        to:  'dist/npm/taro-list/dist/weapp/components/List/refresh.wxs',
      },
      {
        from:  'node_modules/taro-list/dist/weapp/components/List/index.template.wxml',
        to:  'dist/npm/taro-list/dist/weapp/components/List/index.template.wxml',
      }
    ]
  },
```

2. 使用

```tsx

import Taro  from '@tarojs/taro';
import TaroList from 'taro-list'

export default Index() => {

  return (
    <TaroList height="100vh" onRefresh={cb => {
      console.log('刷新');

      setTimemout(cb, 1000);
    }}>
  </TaroList>)
}

```

具体使用可查看 [https://github.com/raohong/taro-list/tree/master/src/pages](https://github.com/raohong/taro-list/tree/master/src/pages)

### taro-list

|        属性         |              类型               |    默认值    | 必填                    | 说明                                          |
| :-----------------: | :-----------------------------: | :----------: | ----------------------- | --------------------------------------------- |
|       height        |          number/string          |      0       | 是                      | 组件高度，支持 css                            |
|        width        |          number/string          |      0       | 否                      | 组件宽度，支持 css                            |
|      className      |             string              |              | 否                      | 容器类名                                      |
|        style        |       React.CSSProperties       |              | 否                      | 容器样式                                      |
|      disabled       |             boolean             |              | 否                      | 禁用下拉刷新                                  |
|  distanceToRefresh  |             number              |      60      | 否                      | 刷新距离                                      |
|       damping       |             number              |     200      | 否                      | 最大下拉距离                                  |
|     refreshing      |             boolean             |              | 否                      | 是否处于刷新状态 （最大刷新时间 10s）         |
|      onRefresh      | (onSuccess: () => void) => void |              | 否                      | 刷新回调函数，参数 onSuccess 调用结束刷新状态 |
|     onLoadmore      |           () => void            |              | 否                      | 下拉加载更多回调函数                          |
|   enableBackToTop   |             boolean             |              | 否                      | 参考 ScrollView enableBackToTop               |
| scrollWithAnimation |             boolean             |              | 否                      | 参考 ScrollView scrollWithAnimation           |
|       virtual       |             boolean             |              | 否                      | 是否启用虚拟滚动                              |
|     dataManager     |             object              |              | 当启用虚拟滚动时， 必传 | VirtualList Data Manager                      |
|    scrollToIndex    |             number              |              | 否                      | 容器滚动 item index                           |
|        align        |              ALIGN              | ALIGN.CENTER | 否                      | 设置 scrollToIndex 滚动时滚动值对其方式       |

### taro-list-data-manager

taro-list-data-manager 文档 [https://github.com/raohong/taro-list-data-manager](https://github.com/raohong/taro-list-data-manager)
