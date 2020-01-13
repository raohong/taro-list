import { sizeProp, DEFAULT_ITEMSIZE } from './types';
export const getItemSizeGetter = (itemSize, cellCache, scrollDirection, estimatedSizeGetter) => {
  return index => {
    if (cellCache !== undefined) {
      const item = cellCache.get(index);
      return item ? item[sizeProp[scrollDirection]] : estimatedSizeGetter();
    }
    if (typeof itemSize === 'function') {
      return itemSize(index);
    }
    return Array.isArray(itemSize) ? itemSize[index] : itemSize;
  };
};
export const getEstimatedGetter = (estimatedSize, itemSize) => {
  return () => estimatedSize || typeof itemSize === 'number' && itemSize || DEFAULT_ITEMSIZE;
};
export const normalizeValue = value => typeof value === 'number' && value ? `${value}px` : value;
export const normalizeStyle = style => {
  const props = ['margin', 'padding', 'width', 'height', 'left', 'top', 'right', 'bottom', 'fontSize', 'lineHeight'];
  return Object.keys(style).reduce((ret, key) => {
    ret[key] = props.find(p => key.includes(p)) ? normalizeValue(style[key]) : style[key];
    return ret;
  }, {});
};