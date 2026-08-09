import { EccLevel, QrMatrix } from './types';

/**
 * Immutable QrMatrix implementation storing module states in a flat Uint8Array.
 * Origin: top-left (0, 0), x increases rightward, y increases downward.
 */
export class QrMatrixImpl implements QrMatrix {
  public readonly size: number;
  public readonly version: number;
  public readonly ecc: EccLevel;
  public readonly mask: number;

  private readonly modules: Uint8Array;

  constructor(
    version: number,
    ecc: EccLevel,
    mask: number,
    modules: Uint8Array | boolean[] | boolean[][]
  ) {
    this.version = version;
    this.size = version * 4 + 17;
    this.ecc = ecc;
    this.mask = mask;

    const total = this.size * this.size;
    this.modules = new Uint8Array(total);

    if (modules instanceof Uint8Array) {
      if (modules.length !== total) {
        throw new RangeError(
          `Invalid module buffer length: expected ${total}, got ${modules.length}`
        );
      }
      this.modules.set(modules);
    } else if (Array.isArray(modules)) {
      if (modules.length === total && typeof modules[0] === 'boolean') {
        for (let i = 0; i < total; i++) {
          this.modules[i] = (modules as boolean[])[i] ? 1 : 0;
        }
      } else if (modules.length === this.size && Array.isArray(modules[0])) {
        const grid = modules as boolean[][];
        for (let y = 0; y < this.size; y++) {
          const row = grid[y];
          if (!row || row.length !== this.size) {
            throw new RangeError(`Invalid row length at y=${y}: expected ${this.size}`);
          }
          for (let x = 0; x < this.size; x++) {
            this.modules[y * this.size + x] = row[x] ? 1 : 0;
          }
        }
      } else {
        throw new RangeError('Invalid module grid format');
      }
    } else {
      throw new RangeError('Invalid modules parameter');
    }
  }

  public isDark(x: number, y: number): boolean {
    if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
      throw new RangeError(`Coordinate out of bounds: (${x}, ${y}) for matrix size ${this.size}`);
    }
    return this.modules[y * this.size + x] === 1;
  }
}
