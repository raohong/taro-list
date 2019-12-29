import CellCache from './CellCache';
import {
  ItemSizeGetter,
  EstimatedSizeGetter,
  CellCacheItem,
  DIRECTION,
  ItemSize,
  sizeProp,
  DEFAULT_ITEMSIZE
} from './types';

export const getItemSizeGetter = (
  itemSize: ItemSize,
  cellCache?: CellCache<CellCacheItem>,
  scrollDirection?: DIRECTION,
  estimatedSizeGetter?: EstimatedSizeGetter
): ItemSizeGetter => {
  return (index: number) => {
    if (cellCache !== undefined) {
      const item = cellCache.get(index);
      return item ? item[sizeProp[scrollDirection!]] : estimatedSizeGetter!();
    }

    if (typeof itemSize === 'function') {
      return itemSize[index];
    }

    return Array.isArray(itemSize) ? itemSize[index] : itemSize;
  };
};

export const getEstimatedGetter = (
  estimatedSize: number,
  itemSize: ItemSize
): EstimatedSizeGetter => {
  return () =>
    estimatedSize ||
    (typeof itemSize === 'number' && itemSize) ||
    DEFAULT_ITEMSIZE;
};
