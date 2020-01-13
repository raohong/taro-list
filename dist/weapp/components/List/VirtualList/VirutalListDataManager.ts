import Taro from '@tarojs/taro';
import isEqual from 'lodash.isequal';
import { ItemStyle } from '.';
import {
  ItemSize,
  DEFAULT_ITEMSIZE,
  DEFAULT_OVERSCAN,
  DEFAULT_COLUMN
} from './types';

interface SizeAndPositionOfItemData {
  index: number;
  style: ItemStyle;
}

export interface VirutalListItemData<T = any>
  extends SizeAndPositionOfItemData {
  item: T;
}

type MiniItemSizeValue = string | number;
type MiniItemSize =
  | MiniItemSizeValue
  | MiniItemSizeValue[]
  | ((index: number) => MiniItemSizeValue);

type VirutalListDataManagerChangeHandler<T> = (
  items: VirutalListItemData<T>[]
) => void;

type VirutalListDataManagerUpdater<T> = (data: T[]) => VirutalListItemData<T>[];

export interface VirutalListDataManagerOptions<T> {
  itemSize?: MiniItemSize;
  estimatedSize?: number;
  stickyIndices?: number[];
  overscan?: number;
  column?: number;
  onChange: VirutalListDataManagerChangeHandler<T>;
}

export interface ILoadStatusResult<T> {
  id: string;
  clearAndAddData: (...values: T[]) => void;
}

export interface VirutalListDataManagerState<T> {
  data: T[];
  itemSize: ItemSize;
  overscan: number;
  column: number;
  itemCount: number;
  estimatedSize: number;
  stickyIndices: number[];
  onChange: VirutalListDataManagerChangeHandler<T>;
}

let index = 0;

export const VIRTUAL_LIST_DATA_MANAGER_FLAG = 'VIRTUAL_LIST_DATA_MANAGER_FLAG';

const generateId = () => `__${index++}__${VIRTUAL_LIST_DATA_MANAGER_FLAG}`;
const RATIO = Taro.getSystemInfoSync().windowWidth / 375;
const LOAD_ITEM_DATA_ID = 'LOAD_ITEM_DATA_ID';

const defaultOptions: Omit<VirutalListDataManagerOptions<any>, 'onChange'> = {
  estimatedSize: DEFAULT_ITEMSIZE,
  itemSize: DEFAULT_ITEMSIZE,
  overscan: DEFAULT_OVERSCAN,
  column: DEFAULT_COLUMN
};

const getItemCount = <T>(data: T[], column: number) => {
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

    while (
      j < column &&
      i + j < length &&
      (data[i + j][VIRTUAL_LIST_DATA_MANAGER_FLAG] === undefined ||
        !data[i + j])
    ) {
      j++;
    }

    i += j;
  }

  return total;
};

const itemSizeTransformer = (value: string | number): number => {
  const parser = /^[+-]?\d+(\.\d+)?r?px$/;
  if (typeof value === 'string') {
    if (parser.test(value)) {
      return value.includes('rpx')
        ? (parseFloat(value) / 2) * RATIO
        : parseFloat(value);
    }
    throw Error('Invalid ItemSize types');
  }

  return value;
};

const itemSizeAdapter = (itemSize: MiniItemSize): ItemSize => {
  if (typeof itemSize === 'string') {
    return itemSizeTransformer(itemSize);
  }

  if (Array.isArray(itemSize)) {
    return itemSize.map(itemSizeTransformer);
  }

  if (typeof itemSize === 'function') {
    return (index: number) => {
      const val = itemSize(index);

      return itemSizeTransformer(val);
    };
  }

  return itemSize || 0;
};

const keys: (keyof VirutalListDataManagerState<any>)[] = [
  'estimatedSize',
  'itemSize',
  'overscan',
  'stickyIndices',
  'onChange',
  'column'
];

const getInitialState = <T>() => {
  const state = { data: [] as T[] } as VirutalListDataManagerState<T>;

  Object.defineProperty(state, 'itemCount', {
    get() {
      return getItemCount(state.data, state.column);
    }
  });

  return state;
};

export class VirutalListDataManager<T = any> {
  private __lastSizeAndPositionData: SizeAndPositionOfItemData[];
  private __state: VirutalListDataManagerState<T>;
  private __updater: VirutalListDataManagerUpdater<T>;
  private __onStateChange: (prevState: VirutalListDataManagerState<T>) => void;
  private __timer = 0;

  constructor(options: VirutalListDataManagerOptions<T>) {
    const params = { ...defaultOptions, ...options };
    const state = getInitialState<T>();

    keys.forEach(key => {
      const item = params[key];

      if (params[key]) {
        state[key] = key === 'itemSize' ? itemSizeAdapter(item) : item;
      }
    });

    this.__state = state;
  }

  public updateConfig(config: Partial<VirutalListDataManagerOptions<T>>) {
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

  public setLoadStatus = (
    customData: Record<string | number, any> = {}
  ): ILoadStatusResult<T> => {
    let inserted = false;

    const id = generateId();
    const loadStatusData = {
      ...customData,
      [LOAD_ITEM_DATA_ID]: id,
      [VIRTUAL_LIST_DATA_MANAGER_FLAG]: VIRTUAL_LIST_DATA_MANAGER_FLAG
    };

    // @ts-ignore
    this.push(loadStatusData);

    const clearAndAddData = (...value: T[]) => {
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

  public clearAllLoadStatus = (id?: string) => {
    const data = this.get().filter(
      item =>
        item &&
        typeof item === 'object' &&
        (id
          ? item[LOAD_ITEM_DATA_ID] !== id
          : item[LOAD_ITEM_DATA_ID] === undefined)
    );

    this.set(data);
  };

  public getItemCount = () => {
    return this.__getState().itemCount;
  };

  public clear = () => {
    const { data, itemCount } = this.__state;
    data.length = 0;

    this._triggerStateChange({ ...this.__state, itemCount });
    this.__nextTickUpdate();
  };

  public push = (...value: T[]): number => {
    const { data, itemCount } = this.__state;

    data.push(...value);
    this._triggerStateChange({ ...this.__state, itemCount });
    this.__nextTickUpdate();

    return this.__state.data.length;
  };

  public set = (value: T[]) => {
    const { itemCount } = this.__state;

    this.__state.data = value;
    this._triggerStateChange({ ...this.__state, itemCount });
    this.__nextTickUpdate();
  };

  public splice = (start: number, deleteCount: number = 0, ...items: T[]) => {
    const { itemCount } = this.__state;

    const removed = this.__state.data.splice(start, deleteCount, ...items);
    this._triggerStateChange({ ...this.__state, itemCount });
    this.__nextTickUpdate();

    return removed;
  };

  public get = (): T[] => {
    return this.__state.data;
  };

  public pop = (): T | undefined => {
    return this.__state.data.pop();
  };

  public __nextTickUpdate() {
    this._nextTick(this._update);
  }

  public __getState() {
    return { ...this.__state, itemCount: this.__state.itemCount };
  }

  public __setUpdater = (cb: VirutalListDataManagerUpdater<T>) => {
    this.__updater = cb;
  };

  public __setOnStateChange = (
    onStateChange: (prevState: VirutalListDataManagerState<T>) => void
  ) => {
    if (typeof onStateChange === 'function') {
      this.__onStateChange = onStateChange;
    }
  };

  public forceUpdate = () => {
    this._update(false);
  };

  public destroy = () => {
    // @ts-ignore
    this.__state = null;
    // @ts-ignore
    this.__onStateChange = null;
    // @ts-ignore
    this.__updater = null;
  };

  private _update = (check = true) => {
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

  private _checkShouldUpdate(items) {
    return !isEqual(this.__lastSizeAndPositionData, items);
  }

  private _triggerStateChange = (prevState: VirutalListDataManagerState<T>) => {
    this._clearTimer();

    if (typeof this.__onStateChange === 'function') {
      this.__onStateChange(prevState);
    }
  };

  private _nextTick(cb: () => void) {
    this._clearTimer();
    // @ts-ignore
    this.__timer = setTimeout(() => {
      cb();
    }, 0);
  }

  private _clearTimer() {
    if (this.__timer) {
      this.__timer = 0;
      clearTimeout(this.__timer);
    }
  }
}
