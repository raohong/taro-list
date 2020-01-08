'use strict';
var _a, _b, _c;
exports.__esModule = true;
var ALIGN;
(function(ALIGN) {
  ALIGN['START'] = 'start';
  ALIGN['END'] = 'end';
  ALIGN['CENTER'] = 'center';
  ALIGN['Auto'] = 'auto';
})((ALIGN = exports.ALIGN || (exports.ALIGN = {})));
var DIRECTION;
(function(DIRECTION) {
  DIRECTION['VERTICAL'] = 'vertical';
  DIRECTION['HORIZONTAL'] = 'horizontal';
})((DIRECTION = exports.DIRECTION || (exports.DIRECTION = {})));
exports.scrollProp =
  ((_a = {}),
  (_a[DIRECTION.VERTICAL] = 'scrollTop'),
  (_a[DIRECTION.HORIZONTAL] = 'scrollLeft'),
  _a);
exports.sizeProp =
  ((_b = {}),
  (_b[DIRECTION.VERTICAL] = 'height'),
  (_b[DIRECTION.HORIZONTAL] = 'width'),
  _b);
exports.positionProp =
  ((_c = {}),
  (_c[DIRECTION.HORIZONTAL] = 'left'),
  (_c[DIRECTION.VERTICAL] = 'top'),
  _c);
exports.DEFAULT_ITEMSIZE = 50;
exports.DEFAULT_ZINDEX = 10;
exports.DEFAULT_OVERSCAN = 3;
