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

export const normalizeValue = (value: any) =>
  typeof value === 'number' && value ? `${value}px` : value;

export const normalizeStyle = (style: Record<string, any>) => {
  const props = [
    'margin',
    'padding',
    'width',
    'height',
    'left',
    'top',
    'right',
    'bottom',
    'fontSize',
    'lineHeight'
  ];

  return Object.keys(style).reduce((ret, key) => {
    ret[key] = props.find(p => key.includes(p))
      ? normalizeValue(style[key])
      : style[key];

    return ret;
  }, {} as Record<string, any>);
};
