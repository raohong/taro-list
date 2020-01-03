import { ItemStyle } from '.';

export interface VirutalListItemData<T = any> {
  index: number;
  style: ItemStyle;
  item: T;
}

type VirutalListDataManagerUpdater<T> = (data: T[]) => VirutalListItemData<T>[];

export class VirutalListDataManager<T = any> {
  private __data: T[];
  private __updater: VirutalListDataManagerUpdater<T>;
  private __timer = 0;
  private onChange: (items: VirutalListItemData<T>[]) => void;

  constructor(onChange: (items: VirutalListItemData<T>[]) => void) {
    if (typeof onChange !== 'function') {
      throw Error(
        'VirutalListDataManager "onChange" is required with function '
      );
    }

    this.__data = [];
    this.onChange = onChange;
  }

  public clear = (): this => {
    this.__data.length = 0;
    this._nextTickUpdate();

    return this;
  };

  public push = (data: T[]): this => {
    this.__data.push(...data);
    this._nextTickUpdate();


    return this;
  };

  public update = (data: T[]): this => {
    this.__data = data;
    this._nextTickUpdate();

    return this;
  };

  public splice = (start: number, deleteCount: number = 0, ...items: T[]) => {
    this.__data.splice(start, deleteCount, ...items);

    this._nextTickUpdate();

    return this;
  };

  public get = (): T[] => {
    return this.__data;
  };

  private _nextTickUpdate() {
    this._nextTick(this._update);
  }

  private last;

  private _update = () => {
    if (typeof this.__updater === 'function') {
      const items = this.__updater(this.__data);
      console.log('updateed', this.last ?  Date.now() - this.last:0)
      this.last = Date.now()
      this.onChange(items);
    }
  };

  private _nextTick(cb: () => void) {
    if (this.__timer) {
      this.__timer = 0;
      clearTimeout(this.__timer);
    }

    // @ts-ignore
    this.__timer = setTimeout(() => {
      cb();
    }, 50);
  }

  private __setUpdater = (cb: VirutalListDataManagerUpdater<T>) => {
    this.__updater = cb;
  };
}
