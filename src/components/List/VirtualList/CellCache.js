'use strict';
exports.__esModule = true;
var CellCache = /** @class */ (function() {
  function CellCache() {
    this._map = Object.create(null);
  }
  CellCache.prototype.get = function(index) {
    return this._map[index];
  };
  CellCache.prototype.set = function(index, size) {
    this._map[index] = size;
  };
  CellCache.prototype.clear = function() {
    this._map = Object.create(null);
  };
  return CellCache;
})();
exports.CellCache = CellCache;
exports['default'] = CellCache;
