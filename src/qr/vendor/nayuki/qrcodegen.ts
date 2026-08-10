/* eslint-disable */
/**
 * Project Nayuki QR Code generator library (TypeScript)
 *
 * Upstream Repository: https://github.com/nayuki/QR-Code-generator
 * Upstream Language: TypeScript (`typescript/qrcodegen.ts`)
 * Upstream Commit: 9f9331899166099df2809f6df8d0a8523efec97c
 * License: MIT License (Copyright (c) Project Nayuki)
 *
 * Update Procedure:
 * To update this vendored module from upstream:
 * 1. Copy the latest `qrcodegen.ts` from Project Nayuki's repository into this path.
 * 2. Update the recorded upstream commit hash in this header and in `docs/architecture/0004-qr-core.md`.
 * 3. Run the full verification suite (`npm run check`) to ensure no regressions in QRVerity's encoder adapter.
 *
 * ARCHITECTURE RESTRICTION:
 * This module is vendored for internal use by QRVerity. Exactly ONE adapter module
 * (`src/qr/encoder.ts`) is permitted to import this file. No UI, renderer, payload,
 * or external module may import this file directly.
 */

/*
 * QR Code generator library (TypeScript)
 *
 * Copyright (c) Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/qr-code-generator-library
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 * - The above copyright notice and this permission notice shall be included in
 *   all copies or substantial portions of the Software.
 * - The Software is provided "as is", without warranty of any kind, express or
 *   implied, including but not limited to the warranties of merchantability,
 *   fitness for a particular purpose and noninfringement. In no event shall the
 *   authors or copyright holders be liable for any claim, damages or other
 *   liability, whether in an action of contract, tort or otherwise, arising from,
 *   out of or in connection with the Software or the use or other dealings in the
 *   Software.
 */

export namespace qrcodegen {
  /*
   * A QR Code symbol, which is a type of two-dimensional barcode.
   * Invented by Denso Wave and described in ISO/IEC 18004.
   * Instances of this class represent an immutable square grid of dark and light cells.
   * The class provides static factory functions to create a QR Code from text or binary data.
   */
  export class QrCode {
    /* -- Public static factory functions -- */

    // Returns a QR Code representing the given Unicode text string at the given error correction level.
    // As a conservative fallback, this function encodes the text as a byte sequence using UTF-8.
    public static encodeText(text: string, ecl: QrCode.Ecc): QrCode {
      const segs: QrSegment[] = QrSegment.makeSegments(text);
      return QrCode.encodeSegments(segs, ecl);
    }

    // Returns a QR Code representing the given binary data, which can be of any length.
    public static encodeBinary(data: ReadonlyArray<number>, ecl: QrCode.Ecc): QrCode {
      const segs: QrSegment[] = [QrSegment.makeBytes(data)];
      return QrCode.encodeSegments(segs, ecl);
    }

    // Returns a QR Code representing the given segments with the given encoding options.
    public static encodeSegments(
      segs: ReadonlyArray<QrSegment>,
      ecl: QrCode.Ecc,
      minVersion: number = 1,
      maxVersion: number = 40,
      mask: number = -1,
      boostEcl: boolean = true
    ): QrCode {
      if (
        !(
          QrCode.MIN_VERSION <= minVersion &&
          minVersion <= maxVersion &&
          maxVersion <= QrCode.MAX_VERSION
        ) ||
        mask < -1 ||
        mask > 7
      ) {
        throw new RangeError('Invalid value for version or mask');
      }

      // Find the minimal version number to fit the data
      let version: number;
      let dataUsedBits: number;
      for (version = minVersion; ; version++) {
        const dataCapacityBits: number = QrCode.getNumDataCodewords(version, ecl) * 8;
        const usedBits: number = QrSegment.getTotalBits(segs, version);
        if (usedBits <= dataCapacityBits) {
          dataUsedBits = usedBits;
          break; // This version fits
        }
        if (version >= maxVersion) {
          // All versions in range failed
          throw new RangeError('Data length overflow');
        }
      }

      // Increase the error correction level if data still fits in the same version
      for (const newEcl of [QrCode.Ecc.MEDIUM, QrCode.Ecc.QUARTILE, QrCode.Ecc.HIGH]) {
        if (boostEcl && dataUsedBits <= QrCode.getNumDataCodewords(version, newEcl) * 8) {
          ecl = newEcl;
        }
      }

      // Concatenate all sequences to form the data bits
      const bb: number[] = [];
      for (const seg of segs) {
        appendBits(seg.mode.modeBits, 4, bb);
        appendBits(seg.numChars, seg.mode.numCharCountBits(version), bb);
        for (const b of seg.getData()) bb.push(b);
      }

      // Add terminator and pad up to a byte if needed
      const dataCapacityBits: number = QrCode.getNumDataCodewords(version, ecl) * 8;
      appendBits(0, Math.min(4, dataCapacityBits - bb.length), bb);
      appendBits(0, (8 - (bb.length % 8)) % 8, bb);

      // Pad with repeating bytes until total capacity reached
      for (let padByte = 0xec; bb.length < dataCapacityBits; padByte ^= 0xec ^ 0x11) {
        appendBits(padByte, 8, bb);
      }

      // Pack bytes into an array of bytes
      const dataCodewords: number[] = new Array(Math.floor(bb.length / 8)).fill(0);
      for (let i = 0; i < bb.length; i++) {
        dataCodewords[i >>> 3]! |= bb[i]! << (7 - (i & 7));
      }

      // Create the QR Code object
      return new QrCode(version, ecl, dataCodewords, mask);
    }

    /* -- Public fields -- */

    // The width and height of this QR Code, measured in modules, between 21 and 177.
    public readonly size: number;

    // The index of the mask pattern used in this QR Code, which is between 0 and 7 (inclusive).
    public readonly mask: number;

    // The modules of this QR Code (true = dark, false = light).
    private readonly modules: boolean[][] = [];

    // The function modules of this QR Code (true = function, false = data/ecc).
    private readonly isFunction: boolean[][] = [];

    /* -- Constructor -- */

    public constructor(
      public readonly version: number,
      public readonly errorCorrectionLevel: QrCode.Ecc,
      dataCodewords: ReadonlyArray<number>,
      msk: number
    ) {
      if (version < QrCode.MIN_VERSION || version > QrCode.MAX_VERSION) {
        throw new RangeError('Version value out of range');
      }
      if (msk < -1 || msk > 7) {
        throw new RangeError('Mask value out of range');
      }
      this.size = version * 4 + 17;

      // Initialize grid
      const row: boolean[] = new Array(this.size).fill(false);
      for (let i = 0; i < this.size; i++) {
        this.modules.push(row.slice());
        this.isFunction.push(row.slice());
      }

      // Compute ECC and draw template
      this.drawFunctionPatterns();
      const allCodewords: number[] = this.addEccAndInterleave(dataCodewords);
      this.drawCodewords(allCodewords);

      // Handle masking
      if (msk === -1) {
        // Automatically choose best mask
        let minPenalty = Infinity;
        for (let i = 0; i < 8; i++) {
          this.applyMask(i);
          this.drawFormatBits(i);
          const penalty = this.getPenaltyScore();
          if (penalty < minPenalty) {
            minPenalty = penalty;
            msk = i;
          }
          this.applyMask(i); // Undoes the mask due to XOR
        }
      }
      this.mask = msk;
      this.applyMask(msk);
      this.drawFormatBits(msk);

      this.isFunction = []; // Allow garbage collection
    }

    /* -- Public instance methods -- */

    public getModule(x: number, y: number): boolean {
      return 0 <= x && x < this.size && 0 <= y && y < this.size && Boolean(this.modules[y]?.[x]);
    }

    /* -- Private helper methods -- */

    private drawFunctionPatterns(): void {
      // Draw horizontal and vertical timing patterns
      for (let i = 0; i < this.size; i++) {
        this.setFunctionModule(6, i, i % 2 === 0);
        this.setFunctionModule(i, 6, i % 2 === 0);
      }

      // Draw 3 finder patterns
      this.drawFinderPattern(3, 3);
      this.drawFinderPattern(this.size - 4, 3);
      this.drawFinderPattern(3, this.size - 4);

      // Draw 5x5 alignment patterns
      const alignPatPos: number[] = this.getAlignmentPatternPositions();
      const numAlign: number = alignPatPos.length;
      for (let i = 0; i < numAlign; i++) {
        for (let j = 0; j < numAlign; j++) {
          // Don't draw on top of finder patterns
          if (!(
            (i === 0 && j === 0) ||
            (i === 0 && j === numAlign - 1) ||
            (i === numAlign - 1 && j === 0)
          )) {
            this.drawAlignmentPattern(alignPatPos[i]!, alignPatPos[j]!);
          }
        }
      }

      // Draw configuration data
      this.drawFormatBits(0);
      this.drawVersion();
    }

    private drawFormatBits(mask: number): void {
      // Calculate format bits
      const data: number = (this.errorCorrectionLevel.formatBits << 3) | mask;
      let rem: number = data;
      for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      const bits: number = ((data << 10) | rem) ^ 0x5412;

      // Draw first copy
      for (let i = 0; i <= 5; i++) this.setFunctionModule(8, i, getBit(bits, i));
      this.setFunctionModule(8, 7, getBit(bits, 6));
      this.setFunctionModule(8, 8, getBit(bits, 7));
      this.setFunctionModule(7, 8, getBit(bits, 8));
      for (let i = 9; i < 15; i++) this.setFunctionModule(14 - i, 8, getBit(bits, i));

      // Draw second copy
      for (let i = 0; i < 8; i++) this.setFunctionModule(this.size - 1 - i, 8, getBit(bits, i));
      for (let i = 8; i < 15; i++) this.setFunctionModule(8, this.size - 15 + i, getBit(bits, i));
      this.setFunctionModule(8, this.size - 8, true); // Dark module
    }

    private drawVersion(): void {
      if (this.version < 7) return;

      let rem: number = this.version;
      for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
      const bits: number = (this.version << 12) | rem;

      for (let i = 0; i < 18; i++) {
        const bit: boolean = getBit(bits, i);
        const a: number = this.size - 11 + (i % 3);
        const b: number = Math.floor(i / 3);
        this.setFunctionModule(a, b, bit);
        this.setFunctionModule(b, a, bit);
      }
    }

    private drawFinderPattern(x: number, y: number): void {
      for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          const dist: number = Math.max(Math.abs(dx), Math.abs(dy));
          const xx: number = x + dx;
          const yy: number = y + dy;
          if (0 <= xx && xx < this.size && 0 <= yy && yy < this.size) {
            this.setFunctionModule(xx, yy, dist !== 2 && dist !== 4);
          }
        }
      }
    }

    private drawAlignmentPattern(x: number, y: number): void {
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          this.setFunctionModule(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
      }
    }

    private setFunctionModule(x: number, y: number, isDark: boolean): void {
      this.modules[y]![x] = isDark;
      this.isFunction[y]![x] = true;
    }

    private addEccAndInterleave(data: ReadonlyArray<number>): number[] {
      const ver: number = this.version;
      const ecl: QrCode.Ecc = this.errorCorrectionLevel;
      if (data.length !== QrCode.getNumDataCodewords(ver, ecl)) {
        throw new RangeError('Invalid data length');
      }

      // Calculate parameter numbers
      const numBlocks: number = QrCode.NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal]![ver]!;
      const blockEccLen: number = QrCode.ECC_CODEWORDS_PER_BLOCK[ecl.ordinal]![ver]!;
      const rawCodewords: number = Math.floor(QrCode.getNumRawDataModules(ver) / 8);
      const numShortBlocks: number = numBlocks - (rawCodewords % numBlocks);
      const shortBlockLen: number = Math.floor(rawCodewords / numBlocks);

      // Split data into blocks and compute ECC
      const blocks: number[][] = [];
      const rsDiv: number[] = QrCode.reedSolomonComputeDivisor(blockEccLen);

      for (let i = 0, k = 0; i < numBlocks; i++) {
        const dat: number[] = data.slice(
          k,
          k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1)
        );
        k += dat.length;
        const ecc: number[] = QrCode.reedSolomonComputeRemainder(dat, rsDiv);
        if (i < numShortBlocks) dat.push(0);
        blocks.push(dat.concat(ecc));
      }

      // Interleave codewords
      const result: number[] = [];
      for (let i = 0; i < blocks[0]!.length; i++) {
        for (let j = 0; j < blocks.length; j++) {
          if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks) {
            result.push(blocks[j]![i]!);
          }
        }
      }
      return result;
    }

    private drawCodewords(data: ReadonlyArray<number>): void {
      if (data.length !== Math.floor(QrCode.getNumRawDataModules(this.version) / 8)) {
        throw new RangeError('Invalid data length');
      }
      let i = 0; // Bit index into data
      // Scan right to left, 2 columns at a time
      for (let right = this.size - 1; right >= 1; right -= 2) {
        if (right === 6) right = 5;
        for (let vert = 0; vert < this.size; vert++) {
          for (let j = 0; j < 2; j++) {
            const x: number = right - j;
            const upward: boolean = ((right + 1) & 2) === 0;
            const y: number = upward ? this.size - 1 - vert : vert;
            if (!this.isFunction[y]![x] && i < data.length * 8) {
              this.modules[y]![x] = getBit(data[i >>> 3]!, 7 - (i & 7));
              i++;
            }
          }
        }
      }
    }

    private applyMask(mask: number): void {
      if (mask < 0 || mask > 7) throw new RangeError('Mask out of range');
      for (let y = 0; y < this.size; y++) {
        for (let x = 0; x < this.size; x++) {
          let invert: boolean;
          switch (mask) {
            case 0:
              invert = (x + y) % 2 === 0;
              break;
            case 1:
              invert = y % 2 === 0;
              break;
            case 2:
              invert = x % 3 === 0;
              break;
            case 3:
              invert = (x + y) % 3 === 0;
              break;
            case 4:
              invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
              break;
            case 5:
              invert = ((x * y) % 2) + ((x * y) % 3) === 0;
              break;
            case 6:
              invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
              break;
            case 7:
              invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
              break;
            default:
              throw new Error('Unreachable');
          }
          if (!this.isFunction[y]![x] && invert) {
            this.modules[y]![x] = !this.modules[y]![x];
          }
        }
      }
    }

    private getPenaltyScore(): number {
      let result = 0;

      // Adjacent modules in row/column in same color
      for (let y = 0; y < this.size; y++) {
        let runColor = false;
        let runVal = 0;
        let runX = 0;
        // let _runY = 0;
        for (let x = 0; x < this.size; x++) {
          if (x === 0 || this.modules[y]![x] !== runColor) {
            runColor = Boolean(this.modules[y]![x]);
            runVal = 1;
          } else {
            runVal++;
            if (runVal === 5) result += QrCode.PENALTY_N1;
            else if (runVal > 5) result++;
          }
        }
        for (let x = 0; x < this.size; x++) {
          if (x === 0 || this.modules[x]![y] !== runColor) {
            runColor = Boolean(this.modules[x]![y]);
            runX = 1;
          } else {
            runX++;
            if (runX === 5) result += QrCode.PENALTY_N1;
            else if (runX > 5) result++;
          }
        }
      }

      // 2x2 blocks of same color
      for (let y = 0; y < this.size - 1; y++) {
        for (let x = 0; x < this.size - 1; x++) {
          const val: boolean = Boolean(this.modules[y]![x]);
          if (
            val === Boolean(this.modules[y]![x + 1]) &&
            val === Boolean(this.modules[y + 1]![x]) &&
            val === Boolean(this.modules[y + 1]![x + 1])
          ) {
            result += QrCode.PENALTY_N2;
          }
        }
      }

      // Finder-like 1:1:3:1:1 pattern in rows and columns
      for (let y = 0; y < this.size; y++) {
        let bits = 0;
        for (let x = 0; x < this.size; x++) {
          bits = ((bits << 1) & 0x7ff) | (this.modules[y]![x] ? 1 : 0);
          if (x >= 10 && (bits === 0x05d || bits === 0x5d0)) result += QrCode.PENALTY_N3;
        }
      }
      for (let x = 0; x < this.size; x++) {
        let bits = 0;
        for (let y = 0; y < this.size; y++) {
          bits = ((bits << 1) & 0x7ff) | (this.modules[y]![x] ? 1 : 0);
          if (y >= 10 && (bits === 0x05d || bits === 0x5d0)) result += QrCode.PENALTY_N3;
        }
      }

      // Balance of dark and light modules
      let dark = 0;
      for (const row of this.modules) {
        for (const color of row) {
          if (color) dark++;
        }
      }
      const total: number = this.size * this.size;
      const k: number = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
      result += k * QrCode.PENALTY_N4;
      return result;
    }

    private getAlignmentPatternPositions(): number[] {
      if (this.version === 1) return [];
      else {
        const num: number = Math.floor(this.version / 7) + 2;
        const step: number =
          this.version === 32 ? 26 : Math.ceil((this.version * 4 + 4) / (num * 2 - 2)) * 2;
        const result: number[] = [6];
        for (let pos = this.size - 7; result.length < num; pos -= step) {
          result.splice(1, 0, pos);
        }
        return result;
      }
    }

    /* -- Private static helper functions -- */

    private static getNumRawDataModules(ver: number): number {
      let result: number = (16 * ver + 128) * ver + 64;
      if (ver >= 2) {
        const numAlign: number = Math.floor(ver / 7) + 2;
        result -= (25 * numAlign - 10) * numAlign - 55;
        if (ver >= 7) result -= 36;
      }
      return result;
    }

    private static getNumDataCodewords(ver: number, ecl: QrCode.Ecc): number {
      return (
        Math.floor(QrCode.getNumRawDataModules(ver) / 8) -
        QrCode.ECC_CODEWORDS_PER_BLOCK[ecl.ordinal]![ver]! *
          QrCode.NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal]![ver]!
      );
    }

    private static reedSolomonComputeDivisor(degree: number): number[] {
      if (degree < 1 || degree > 255) throw new RangeError('Degree out of range');
      const result: number[] = new Array(degree).fill(0);
      result[degree - 1] = 1;
      let root = 1;
      for (let i = 0; i < degree; i++) {
        for (let j = 0; j < result.length; j++) {
          result[j] = QrCode.reedSolomonMultiply(result[j]!, root);
          if (j + 1 < result.length) result[j] = result[j]! ^ result[j + 1]!;
        }
        root = QrCode.reedSolomonMultiply(root, 0x02);
      }
      return result;
    }

    private static reedSolomonComputeRemainder(
      data: ReadonlyArray<number>,
      divisor: ReadonlyArray<number>
    ): number[] {
      const result: number[] = new Array(divisor.length).fill(0);
      for (const b of data) {
        const factor: number = b ^ result.shift()!;
        result.push(0);
        for (let i = 0; i < divisor.length; i++) {
          result[i] = result[i]! ^ QrCode.reedSolomonMultiply(divisor[i]!, factor);
        }
      }
      return result;
    }

    private static reedSolomonMultiply(x: number, y: number): number {
      if (x >>> 8 !== 0 || y >>> 8 !== 0) throw new RangeError('Byte out of range');
      let z = 0;
      for (let i = 7; i >= 0; i--) {
        z = (z << 1) ^ (((z << 1) >>> 8) * 0x11d);
        z ^= ((y >>> i) & 1) * x;
      }
      return z & 0xff;
    }

    /* -- Constants -- */

    public static readonly MIN_VERSION: number = 1;
    public static readonly MAX_VERSION: number = 40;

    private static readonly PENALTY_N1: number = 3;
    private static readonly PENALTY_N2: number = 3;
    private static readonly PENALTY_N3: number = 40;
    private static readonly PENALTY_N4: number = 10;

    private static readonly ECC_CODEWORDS_PER_BLOCK: ReadonlyArray<ReadonlyArray<number>> = [
      // Version: 0, 1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40
      [
        -1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28,
        30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
      ], // Low
      [
        -1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28,
        28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
      ], // Medium
      [
        -1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30,
        30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
      ], // Quartile
      [
        -1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24,
        30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
      ], // High
    ];

    private static readonly NUM_ERROR_CORRECTION_BLOCKS: ReadonlyArray<ReadonlyArray<number>> = [
      // Version: 0, 1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40
      [
        -1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13,
        14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25,
      ], // Low
      [
        -1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21,
        23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49,
      ], // Medium
      [
        -1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29,
        34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68,
      ], // Quartile
      [
        -1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32,
        35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81,
      ], // High
    ];
  }

  // Helper functions
  function getBit(x: number, i: number): boolean {
    return ((x >>> i) & 1) !== 0;
  }

  function appendBits(val: number, len: number, bb: number[]): void {
    if (len < 0 || len > 31 || val >>> len !== 0) throw new RangeError('Value out of range');
    for (let i = len - 1; i >= 0; i--) bb.push((val >>> i) & 1);
  }

  /*
   * A segment of character/binary data for a QR Code symbol.
   * Instances of this class are immutable.
   */
  export class QrSegment {
    /* -- Factory functions -- */

    public static makeBytes(data: ReadonlyArray<number>): QrSegment {
      const bb: number[] = [];
      for (const b of data) appendBits(b, 8, bb);
      return new QrSegment(QrSegment.Mode.BYTE, data.length, bb);
    }

    public static makeNumeric(digits: string): QrSegment {
      if (!QrSegment.isNumeric(digits))
        throw new RangeError('String contains non-numeric characters');
      const bb: number[] = [];
      for (let i = 0; i < digits.length;) {
        const n: number = Math.min(digits.length - i, 3);
        appendBits(parseInt(digits.substring(i, i + n), 10), n * 3 + 1, bb);
        i += n;
      }
      return new QrSegment(QrSegment.Mode.NUMERIC, digits.length, bb);
    }

    public static makeAlphanumeric(text: string): QrSegment {
      if (!QrSegment.isAlphanumeric(text))
        throw new RangeError('String contains characters not encodable in alphanumeric mode');
      const bb: number[] = [];
      let i: number;
      for (i = 0; i + 2 <= text.length; i += 2) {
        let temp: number = QrSegment.ALPHANUMERIC_CHARSET.indexOf(text.charAt(i)) * 45;
        temp += QrSegment.ALPHANUMERIC_CHARSET.indexOf(text.charAt(i + 1));
        appendBits(temp, 11, bb);
      }
      if (i < text.length) {
        appendBits(QrSegment.ALPHANUMERIC_CHARSET.indexOf(text.charAt(i)), 6, bb);
      }
      return new QrSegment(QrSegment.Mode.ALPHANUMERIC, text.length, bb);
    }

    public static makeSegments(text: string): QrSegment[] {
      if (text === '') return [];
      else if (QrSegment.isNumeric(text)) return [QrSegment.makeNumeric(text)];
      else if (QrSegment.isAlphanumeric(text)) return [QrSegment.makeAlphanumeric(text)];
      else return [QrSegment.makeBytes(QrSegment.toUtf8ByteArray(text))];
    }

    public static makeEci(assignVal: number): QrSegment {
      const bb: number[] = [];
      if (assignVal < 0) throw new RangeError('ECI assignment value out of range');
      else if (assignVal < 128) appendBits(assignVal, 8, bb);
      else if (assignVal < 16384) {
        appendBits(2, 2, bb);
        appendBits(assignVal, 14, bb);
      } else if (assignVal < 1000000) {
        appendBits(6, 3, bb);
        appendBits(assignVal, 21, bb);
      } else throw new RangeError('ECI assignment value out of range');
      return new QrSegment(QrSegment.Mode.ECI, 0, bb);
    }

    public static isNumeric(text: string): boolean {
      return QrSegment.NUMERIC_REGEX.test(text);
    }

    public static isAlphanumeric(text: string): boolean {
      return QrSegment.ALPHANUMERIC_REGEX.test(text);
    }

    /* -- Constructor -- */

    public constructor(
      public readonly mode: QrSegment.Mode,
      public readonly numChars: number,
      private readonly bitData: ReadonlyArray<number>
    ) {
      if (numChars < 0) throw new RangeError('Invalid char count');
      this.bitData = bitData.slice();
    }

    /* -- Methods -- */

    public getData(): number[] {
      return this.bitData.slice();
    }

    public static getTotalBits(segs: ReadonlyArray<QrSegment>, version: number): number {
      let result = 0;
      for (const seg of segs) {
        const ccbits: number = seg.mode.numCharCountBits(version);
        if (seg.numChars >= 1 << ccbits) return Infinity;
        result += 4 + ccbits + seg.bitData.length;
      }
      return result;
    }

    private static toUtf8ByteArray(str: string): number[] {
      str = encodeURI(str);
      const result: number[] = [];
      for (let i = 0; i < str.length; i++) {
        if (str.charAt(i) !== '%') result.push(str.charCodeAt(i));
        else {
          result.push(parseInt(str.substring(i + 1, i + 3), 16));
          i += 2;
        }
      }
      return result;
    }

    /* -- Constants -- */

    private static readonly NUMERIC_REGEX: RegExp = /^[0-9]*$/;
    private static readonly ALPHANUMERIC_REGEX: RegExp = /^[0-9A-Z $%*+\-./:]*$/;
    private static readonly ALPHANUMERIC_CHARSET: string =
      '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
  }
}

/* Inner classes / namespaces for QrCode & QrSegment */
export namespace qrcodegen {
  export namespace QrCode {
    export class Ecc {
      public static readonly LOW = new Ecc(0, 1);
      public static readonly MEDIUM = new Ecc(1, 0);
      public static readonly QUARTILE = new Ecc(2, 3);
      public static readonly HIGH = new Ecc(3, 2);

      private constructor(
        public readonly ordinal: number,
        public readonly formatBits: number
      ) {}
    }
  }

  export namespace QrSegment {
    export class Mode {
      public static readonly NUMERIC = new Mode(0x1, [10, 12, 14]);
      public static readonly ALPHANUMERIC = new Mode(0x2, [9, 11, 13]);
      public static readonly BYTE = new Mode(0x4, [8, 16, 16]);
      public static readonly ECI = new Mode(0x7, [0, 0, 0]);
      public static readonly KANJI = new Mode(0x8, [8, 10, 12]);

      private constructor(
        public readonly modeBits: number,
        private readonly numBitsCharCount: ReadonlyArray<number>
      ) {}

      public numCharCountBits(ver: number): number {
        return this.numBitsCharCount[Math.floor((ver + 7) / 17)]!;
      }
    }
  }
}
