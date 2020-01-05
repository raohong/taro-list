import Taro from '@tarojs/taro';
import isEqual from 'lodash.isequal';
import PropTypes from 'prop-types';

import { ItemStyle } from '.';
import { ItemSize, DEFAULT_ITEMSIZE, DEFAULT_OVERSCAN } from './types';

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
  onChange: VirutalListDataManagerChangeHandler<T>;
}

export interface VirutalListDataManagerState<T> {
  data: T[];
  itemSize: ItemSize;
  overscan: number;
  itemCount: number;
  estimatedSize: number;
  stickyIndices: number[];
  onChange: VirutalListDataManagerChangeHandler<T>;
}

const propTypes: React.WeakValidationMap<VirutalListDataManagerOptions<any>> = {
  estimatedSize: PropTypes.number,
  overscan: PropTypes.number,
  stickyIndices: PropTypes.array,
  itemSize: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.array,
    PropTypes.func
  ]),
  onChange: PropTypes.func.isRequired
};

const RATIO = Taro.getSystemInfoSync().windowWidth / 375;

const defaultOptions: Omit<VirutalListDataManagerOptions<any>, 'onChange'> = {
  estimatedSize: DEFAULT_ITEMSIZE,
  itemSize: DEFAULT_ITEMSIZE,
  overscan: DEFAULT_OVERSCAN
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
  'onChange'
];

const getInitialState = <T>() => {
  const state = { data: [] as T[] } as VirutalListDataManagerState<T>;

  Object.defineProperty(state, 'itemCount', {
    get() {
      return state.data.length;
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
      if (config[key]) {
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
    return this.__state;
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
        this.__lastSizeAndPositionData = items;
        onChange(items);
      }
    }
  };

  private _checkShouldUpdate(items) {
    return !isEqual(this.__lastSizeAndPositionData, items);
  }

  private _triggerStateChange = (prevState: VirutalListDataManagerState<T>) => {
    if (typeof this.__onStateChange === 'function') {
      this.__onStateChange(prevState);
    }
  };

  private _nextTick(cb: () => void) {
    if (this.__timer) {
      this.__timer = 0;
      clearTimeout(this.__timer);
    }

    // @ts-ignore
    this.__timer = setTimeout(() => {
      cb();
    }, 0);
  }
}
