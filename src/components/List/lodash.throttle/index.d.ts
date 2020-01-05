interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

export type ThrottleResult<T> = T & {
  cancel: () => any;
};

declare function throttle<T extends (...args: any[]) => any>(
  fun: T,
  wait?: number,
  options?: ThrottleOptions
): ThrottleResult<T>;

export default throttle;
