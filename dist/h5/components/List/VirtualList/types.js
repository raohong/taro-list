export var ALIGN;
(function (ALIGN) {
  ALIGN["START"] = "start";
  ALIGN["END"] = "end";
  ALIGN["CENTER"] = "center";
  ALIGN["Auto"] = "auto";
})(ALIGN || (ALIGN = {}));
export var DIRECTION;
(function (DIRECTION) {
  DIRECTION["VERTICAL"] = "vertical";
  DIRECTION["HORIZONTAL"] = "horizontal";
})(DIRECTION || (DIRECTION = {}));
export const scrollProp = {
  [DIRECTION.VERTICAL]: 'scrollTop',
  [DIRECTION.HORIZONTAL]: 'scrollLeft'
};
export const sizeProp = {
  [DIRECTION.VERTICAL]: 'height',
  [DIRECTION.HORIZONTAL]: 'width'
};
export const positionProp = {
  [DIRECTION.HORIZONTAL]: 'left',
  [DIRECTION.VERTICAL]: 'top'
};
export const DEFAULT_ITEMSIZE = 50;
export const DEFAULT_ZINDEX = 10;
export const DEFAULT_OVERSCAN = 3;
export const DEFAULT_COLUMN = 1;