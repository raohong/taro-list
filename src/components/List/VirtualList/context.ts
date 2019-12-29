import { createContext } from '@tarojs/taro';

import { CellCacheItem } from './types';
import { ItemStyle } from '.';

export interface VirtualListContext {
  onResize: (index: number, size: CellCacheItem) => void;
  getStyle: (index: number) => null | ItemStyle;
  registerUpdateCallback: (cb: () => void) => () => void;
}

export const VirutalListContext = createContext<VirtualListContext>(
  {} as VirtualListContext
);
