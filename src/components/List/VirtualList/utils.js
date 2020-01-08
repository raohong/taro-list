'use strict';
exports.__esModule = true;
var types_1 = require('./types');
exports.getItemSizeGetter = function(
  itemSize,
  cellCache,
  scrollDirection,
  estimatedSizeGetter
) {
  return function(index) {
    if (cellCache !== undefined) {
      var item = cellCache.get(index);
      return item
        ? item[types_1.sizeProp[scrollDirection]]
        : estimatedSizeGetter();
    }
    if (typeof itemSize === 'function') {
      return itemSize[index];
    }
    return Array.isArray(itemSize) ? itemSize[index] : itemSize;
  };
};
exports.getEstimatedGetter = function(estimatedSize, itemSize) {
  return function() {
    return (
      estimatedSize ||
      (typeof itemSize === 'number' && itemSize) ||
      types_1.DEFAULT_ITEMSIZE
    );
  };
};
exports.normalizeValue = function(value) {
  return typeof value === 'number' && value ? value + 'px' : value;
};
exports.normalizeStyle = function(style) {
  var props = [
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
  return Object.keys(style).reduce(function(ret, key) {
    ret[key] = props.find(function(p) {
      return key.includes(p);
    })
      ? exports.normalizeValue(style[key])
      : style[key];
    return ret;
  }, {});
};
