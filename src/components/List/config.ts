export enum REFRESH_STATUS {
  NONE = 'none',
  // 拖动小于 刷新距离
  PULL = 'pull',
  // 拖动大于 刷新距离
  ACTIVE = 'active',
  // 释放
  RELEASE = 'release'
}

export enum REFRESH_STATUS_TEXT {
  pull = '下拉刷新',
  active = '释放刷新',
  release = '更新中'
}

export const MAX_REFRESHING_TIME = 1000 * 10;

export const DAMPING = 200;
export const DISTANCE_TO_REFRESH = 60;

export const HEIGHT = 0;
