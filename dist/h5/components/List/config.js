export var REFRESH_STATUS;
(function (REFRESH_STATUS) {
  REFRESH_STATUS["NONE"] = "none";
  // 拖动小于 刷新距离
  REFRESH_STATUS["PULL"] = "pull";
  // 拖动大于 刷新距离
  REFRESH_STATUS["ACTIVE"] = "active";
  // 释放
  REFRESH_STATUS["RELEASE"] = "release";
})(REFRESH_STATUS || (REFRESH_STATUS = {}));
export var REFRESH_STATUS_TEXT;
(function (REFRESH_STATUS_TEXT) {
  REFRESH_STATUS_TEXT["pull"] = "\u4E0B\u62C9\u5237\u65B0";
  REFRESH_STATUS_TEXT["active"] = "\u91CA\u653E\u5237\u65B0";
  REFRESH_STATUS_TEXT["release"] = "\u66F4\u65B0\u4E2D";
})(REFRESH_STATUS_TEXT || (REFRESH_STATUS_TEXT = {}));
export const MAX_REFRESHING_TIME = 10000;
export const DAMPING = 200;
export const DISTANCE_TO_REFRESH = 60;
export const HEIGHT = 0;