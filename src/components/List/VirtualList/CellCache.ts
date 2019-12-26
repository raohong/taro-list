export class CellCache<T = number> {
  private _map: Record<number, T>;

  constructor() {
    this._map = Object.create(null);
  }

  get(index: number) {
    return this._map[index];
  }

  set(index: number, size: T) {
    this._map[index] = size;
  }

  clear() {
    this._map = Object.create(null);
  }
}

export default CellCache;
