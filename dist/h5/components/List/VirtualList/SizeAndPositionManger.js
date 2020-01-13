import { ALIGN } from './types';
export class SizeAndPositionManager {
  constructor({ itemCount, itemSizeGetter, estimatedSizeGetter }) {
    this.lastMeasuredIndex = -1;
    this.sizeAndPositionData = {};
    this.itemCount = itemCount;
    this.itemSizeGetter = itemSizeGetter;
    this.estimatedSizeGetter = estimatedSizeGetter;
  }
  updateConfig({ itemCount, itemSizeGetter, estimatedSizeGetter }) {
    if (itemCount !== undefined) {
      this.itemCount = itemCount;
    }
    if (itemSizeGetter !== undefined) {
      this.itemSizeGetter = itemSizeGetter;
    }
    if (estimatedSizeGetter !== undefined) {
      this.estimatedSizeGetter = estimatedSizeGetter;
    }
  }
  getSizeAndPositionForIndex(index) {
    if (index < 0 || index >= this.itemCount) {
      throw Error(`Invalid index ${index} is outof range 0..${this.itemCount - 1}`);
    }
    if (index > this.lastMeasuredIndex) {
      const lastSizeAndPosition = this.getSizeAndPositionOfLastMeasured();
      let offset = lastSizeAndPosition.offset + lastSizeAndPosition.size;
      for (let i = this.lastMeasuredIndex + 1; i <= index; i++) {
        const size = this.itemSizeGetter(i);
        if (isNaN(size)) {
          throw Error(`itemSize must be a number`);
        }
        this.sizeAndPositionData[i] = {
          offset,
          size
        };
        offset += size;
      }
      this.lastMeasuredIndex = index;
    }
    return this.sizeAndPositionData[index];
  }
  getSizeAndPositionOfLastMeasured() {
    return this.lastMeasuredIndex < 0 ? { offset: 0, size: 0 } : this.sizeAndPositionData[this.lastMeasuredIndex];
  }
  getTotalSize() {
    const lastSizeAndPosition = this.getSizeAndPositionOfLastMeasured();
    const restNum = Math.max(0, this.itemCount - 1 - Math.max(0, this.lastMeasuredIndex));
    return lastSizeAndPosition.size + lastSizeAndPosition.offset + restNum * this.estimatedSizeGetter();
  }
  getUpdatedOffsetForIndex({ align, targetIndex, currentOffset, containerSize }) {
    if (containerSize <= 0) {
      return 0;
    }
    const sizeAndPosition = this.getSizeAndPositionForIndex(targetIndex);
    const maxOffset = sizeAndPosition.offset;
    const minOffset = maxOffset + sizeAndPosition.size - containerSize;
    let offset;
    switch (align) {
      case ALIGN.START:
        offset = maxOffset;
        break;
      case ALIGN.END:
        offset = minOffset;
        break;
      case ALIGN.CENTER:
        offset = maxOffset - containerSize / 2 + sizeAndPosition.size / 2;
        break;
      default:
        offset = Math.min(maxOffset, Math.max(minOffset, currentOffset));
    }
    const totalSize = this.getTotalSize();
    return Math.max(0, Math.min(totalSize - containerSize, offset));
  }
  getVisibleRange({ currentOffset, containerSize, overscan }) {
    const totalSize = this.getTotalSize();
    if (totalSize === 0 || containerSize === 0) {
      return {};
    }
    currentOffset = Math.max(0, currentOffset);
    const maxOffset = currentOffset + containerSize;
    let start = this.findNearestIndex(currentOffset);
    const sizeAndPosition = this.getSizeAndPositionForIndex(start);
    let end = start;
    let offset = sizeAndPosition.offset + sizeAndPosition.size;
    while (offset < maxOffset && end < this.itemCount - 1) {
      end++;
      offset += this.getSizeAndPositionForIndex(end).size;
    }
    if (overscan > 0) {
      start = Math.max(0, start - overscan);
      end = Math.min(this.itemCount - 1, end + overscan);
    }
    return {
      start,
      end
    };
  }
  resetItem(index) {
    this.lastMeasuredIndex = Math.min(this.lastMeasuredIndex, index - 1);
  }
  findNearestIndex(offset) {
    if (isNaN(offset)) {
      throw Error(`Invalid offset ${offset}`);
    }
    const sizeAndPosition = this.getSizeAndPositionOfLastMeasured();
    const currentOffset = sizeAndPosition.offset + sizeAndPosition.size;
    const last = Math.max(0, this.lastMeasuredIndex);
    if (offset <= currentOffset) {
      return this.binarySearch(0, last, offset);
    }
    return this.exponentSearch(last, offset);
  }
  exponentSearch(index, offset) {
    let interval = 1;
    while (index < this.itemCount && this.getSizeAndPositionForIndex(index).offset < offset) {
      index += interval;
      interval *= 2;
    }
    return this.binarySearch(Math.floor(index / 2), Math.min(this.itemCount - 1, index), offset);
  }
  binarySearch(low, high, offset) {
    let middle;
    while (high >= low) {
      middle = low + Math.floor((high - low) / 2);
      const currentOffset = this.getSizeAndPositionForIndex(middle).offset;
      if (currentOffset > offset) {
        high = middle - 1;
      } else if (currentOffset < offset) {
        low = middle + 1;
      } else {
        return middle;
      }
    }
    return Math.max(0, low - 1);
  }
}
export default SizeAndPositionManager;