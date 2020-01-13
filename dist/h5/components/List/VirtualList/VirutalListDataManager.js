import Taro, { getSystemInfoSync as _getSystemInfoSync } from "@tarojs/taro-h5";
import isEqual from 'lodash.isequal';
import { DEFAULT_ITEMSIZE, DEFAULT_OVERSCAN, DEFAULT_COLUMN } from './types';
let index = 0;
export const VIRTUAL_LIST_DATA_MANAGER_FLAG = 'VIRTUAL_LIST_DATA_MANAGER_FLAG';
const generateId = () => `__${index++}__${VIRTUAL_LIST_DATA_MANAGER_FLAG}`;
const RATIO = _getSystemInfoSync().windowWidth / 375;
const LOAD_ITEM_DATA_ID = 'LOAD_ITEM_DATA_ID';
const defaultOptions = {
  estimatedSize: DEFAULT_ITEMSIZE,
  itemSize: DEFAULT_ITEMSIZE,
  overscan: DEFAULT_OVERSCAN,
  column: DEFAULT_COLUMN
};
const getItemCount = (data, column) => {
  const length = data.length;
  if (column === 1) {
    return length;
  }
  let total = 0;
  let i = 0;
  while (i < length) {
    total += 1;
    // 这里过滤掉用户可能传入的基本数据
    if (typeof data[i] !== 'object' && data[i]) {
      i++;
      continue;
    }
    const type = data[i][VIRTUAL_LIST_DATA_MANAGER_FLAG];
    // 状态点或者最后一个
    if (type === VIRTUAL_LIST_DATA_MANAGER_FLAG || i === length - 1) {
      i++;
      continue;
    }
    let j = 1;
    while (j < column && i + j < length && (data[i + j][VIRTUAL_LIST_DATA_MANAGER_FLAG] === undefined || !data[i + j])) {
      j++;
    }
    i += j;
  }
  return total;
};
const itemSizeTransformer = value => {
  const parser = /^[+-]?\d+(\.\d+)?r?px$/;
  if (typeof value === 'string') {
    if (parser.test(value)) {
      return value.includes('rpx') ? parseFloat(value) / 2 * RATIO : parseFloat(value);
    }
    throw Error('Invalid ItemSize types');
  }
  return value;
};
const itemSizeAdapter = itemSize => {
  if (typeof itemSize === 'string') {
    return itemSizeTransformer(itemSize);
  }
  if (Array.isArray(itemSize)) {
    return itemSize.map(itemSizeTransformer);
  }
  if (typeof itemSize === 'function') {
    return index => {
      const val = itemSize(index);
      return itemSizeTransformer(val);
    };
  }
  return itemSize || 0;
};
const keys = ['estimatedSize', 'itemSize', 'overscan', 'stickyIndices', 'onChange', 'column'];
const getInitialState = () => {
  const state = { data: [] };
  Object.defineProperty(state, 'itemCount', {
    get() {
      return getItemCount(state.data, state.column);
    }
  });
  return state;
};
export class VirutalListDataManager {
  constructor(options) {
    this.__timer = 0;
    this.setLoadStatus = (customData = {}) => {
      let inserted = false;
      const id = generateId();
      const loadStatusData = {
        ...customData,
        [LOAD_ITEM_DATA_ID]: id,
        [VIRTUAL_LIST_DATA_MANAGER_FLAG]: VIRTUAL_LIST_DATA_MANAGER_FLAG
      };
      // @ts-ignore
      this.push(loadStatusData);
      const clearAndAddData = (...value) => {
        if (inserted) {
          return;
        }
        inserted = true;
        this.clearAllLoadStatus(id);
        this.push(...value);
      };
      return {
        id,
        clearAndAddData
      };
    };
    this.clearAllLoadStatus = id => {
      const data = this.get().filter(item => item && typeof item === 'object' && (id ? item[LOAD_ITEM_DATA_ID] !== id : item[LOAD_ITEM_DATA_ID] === undefined));
      this.set(data);
    };
    this.getItemCount = () => {
      return this.__getState().itemCount;
    };
    this.clear = () => {
      const { data, itemCount } = this.__state;
      data.length = 0;
      this._triggerStateChange({ ...this.__state, itemCount });
      this.__nextTickUpdate();
    };
    this.push = (...value) => {
      const { data, itemCount } = this.__state;
      data.push(...value);
      this._triggerStateChange({ ...this.__state, itemCount });
      this.__nextTickUpdate();
      return this.__state.data.length;
    };
    this.set = value => {
      const { itemCount } = this.__state;
      this.__state.data = value;
      this._triggerStateChange({ ...this.__state, itemCount });
      this.__nextTickUpdate();
    };
    this.splice = (start, deleteCount = 0, ...items) => {
      const { itemCount } = this.__state;
      const removed = this.__state.data.splice(start, deleteCount, ...items);
      this._triggerStateChange({ ...this.__state, itemCount });
      this.__nextTickUpdate();
      return removed;
    };
    this.get = () => {
      return this.__state.data;
    };
    this.pop = () => {
      return this.__state.data.pop();
    };
    this.__setUpdater = cb => {
      this.__updater = cb;
    };
    this.__setOnStateChange = onStateChange => {
      if (typeof onStateChange === 'function') {
        this.__onStateChange = onStateChange;
      }
    };
    this.forceUpdate = () => {
      this._update(false);
    };
    this.destroy = () => {
      // @ts-ignore
      this.__state = null;
      // @ts-ignore
      this.__onStateChange = null;
      // @ts-ignore
      this.__updater = null;
    };
    this._update = (check = true) => {
      if (typeof this.__updater === 'function') {
        const { onChange, data } = this.__state;
        const items = this.__updater(data);
        const sizeAndPositionOfItemData = items.map(item => ({
          style: item.style,
          index: item.index
        }));
        if (this._checkShouldUpdate(sizeAndPositionOfItemData) && check) {
          this.__lastSizeAndPositionData = sizeAndPositionOfItemData;
          onChange(items);
        } else if (!check) {
          this.__lastSizeAndPositionData = sizeAndPositionOfItemData;
          onChange(items);
        }
      }
    };
    this._triggerStateChange = prevState => {
      this._clearTimer();
      if (typeof this.__onStateChange === 'function') {
        this.__onStateChange(prevState);
      }
    };
    const params = { ...defaultOptions, ...options };
    const state = getInitialState();
    keys.forEach(key => {
      const item = params[key];
      if (params[key]) {
        state[key] = key === 'itemSize' ? itemSizeAdapter(item) : item;
      }
    });
    this.__state = state;
  }
  updateConfig(config) {
    const state = this.__state;
    const prevState = { ...state };
    let needUpdated = false;
    keys.forEach(key => {
      const item = config[key];
      if (config[key] !== undefined) {
        if (key !== 'onChange' && state[key] !== item) {
          needUpdated = true;
        }
        state[key] = key === 'itemSize' ? itemSizeAdapter(item) : item;
      }
    });
    if (needUpdated) {
      this._triggerStateChange(prevState);
      this.__nextTickUpdate();
    }
  }
  __nextTickUpdate() {
    this._nextTick(this._update);
  }
  __getState() {
    return { ...this.__state, itemCount: this.__state.itemCount };
  }
  _checkShouldUpdate(items) {
    return !isEqual(this.__lastSizeAndPositionData, items);
  }
  _nextTick(cb) {
    this._clearTimer();
    // @ts-ignore
    this.__timer = setTimeout(() => {
      cb();
    }, 0);
  }
  _clearTimer() {
    if (this.__timer) {
      this.__timer = 0;
      clearTimeout(this.__timer);
    }
  }
}