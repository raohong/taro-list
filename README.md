# taro-list

> 支持下拉刷新 、 加载更多 、虚拟列表 (组件没法同时更新样式, 暂不支持动态大小)

## 安装及使用

```
npm i taro-list
# or
yarn add taro-list
```

快速使用

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

## 属性

### TaroList

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

### VirtualListDataManager

> 虚拟列表数据管理类， 启用虚拟滚动时必传

#### 使用方式

```ts
const dataManager = new VirutalListDataManager({
  itemSize: 120,
  onChange: data => {
    this.setState({
      list: data
    });
  }
});
```

#### API

```ts
class VirutalListDataManager<T = any> {
  // 初始化参数
  constructor(options: VirutalListDataManagerOptions<T>);
  // 更新配置 参数等同 options
  updateConfig: (config: Partial<VirutalListDataManagerOptions<T>>) => void;
  // 清空数据
  clear: () => void;
  // push 数据 同 Array.prototype.push
  push: (...value: T[]) => number;
  // 设置数据
  set: (...value: T[]) => void;
  // 删除或者增加数据, 同 Array.prototype.splice
  splice: (start: number, deleteCount: number, ...items: T[]) => T[];
  // 获取整个数据
  get: () => T[];
  // 同 Array.prototype.pop
  pop: () => T | undefined;
  // 更新 Virtual List
  forceUpdate: () => void;
}

// 初始化参数
interface VirutalListDataManagerOptions<T> {
  // 虚拟列表项目每个大小, 支持 number / string / number[] / string[] / () => string[] | number[] , 默认 50
  itemSize?: MiniItemSize;
  // 项目估算大小 默认 50
  estimatedSize?: number;
  // sticky 数组, 通过 sticky 定位实现
  stickyIndices?: number[];
  // 提前渲染项目数量, 增大可避免快速滚动白屏, 默认 3
  overscan?: number;
  // 必传, 将当前要渲染的数据更新
  onChange: VirutalListDataManagerChangeHandler<T>;
}

type MiniItemSizeValue = string | number;
type MiniItemSize =
  | MiniItemSizeValue
  | MiniItemSizeValue[]
  | ((index: number) => MiniItemSizeValue);

interface SizeAndPositionOfItemData {
  index: number;
  style: ItemStyle;
}

interface VirutalListItemData<T = any> extends SizeAndPositionOfItemData {
  item: T;
}

type VirutalListDataManagerChangeHandler<T> = (
  items: VirutalListItemData<T>[]
) => void;

type VirutalListDataManagerUpdater<T> = (data: T[]) => VirutalListItemData<T>[];
```
