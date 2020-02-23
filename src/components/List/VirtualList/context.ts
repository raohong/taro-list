import { createContext } from '@tarojs/taro';

import { CellCacheItem } from './types';

export interface VirtualListContext {
  onResize: (index: number, size: CellCacheItem) => void;
  dynamic: boolean;
}

export const VirtualListContext = createContext<VirtualListContext>(
  {} as VirtualListContext
);
