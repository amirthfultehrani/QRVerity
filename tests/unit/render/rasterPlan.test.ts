import { describe, expect, it } from 'vitest';
import { planRasterSize } from '../../../src/render/raster/plan';

describe('Raster Size Planner', () => {
  it('calculates exact integer pixels per module for 29 modules', () => {
    const totalModules = 29;
    const requestedSizes = [29, 58, 100, 256, 500, 1024, 2000];

    for (const req of requestedSizes) {
      const plan = planRasterSize(totalModules, req);

      expect(Number.isInteger(plan.pixelsPerModule)).toBe(true);
      expect(plan.pixelsPerModule).toBeGreaterThanOrEqual(1);

      expect(plan.actualSizePx).toBe(plan.pixelsPerModule * totalModules);
      expect(plan.actualSizePx % totalModules).toBe(0);
    }
  });

  it('handles requested sizes smaller than totalModules with minimum 1 px/module', () => {
    const plan = planRasterSize(29, 10);
    expect(plan.pixelsPerModule).toBe(1);
    expect(plan.actualSizePx).toBe(29);
  });

  it('rounds to nearest integer px/module deterministically', () => {
    // 500 / 29 = 17.241... -> rounds to 17
    const plan500 = planRasterSize(29, 500);
    expect(plan500.pixelsPerModule).toBe(17);
    expect(plan500.actualSizePx).toBe(493);

    // 530 / 29 = 18.275... -> rounds to 18
    const plan530 = planRasterSize(29, 530);
    expect(plan530.pixelsPerModule).toBe(18);
    expect(plan530.actualSizePx).toBe(522);
  });

  it('rejects invalid requested sizes', () => {
    expect(() => planRasterSize(29, 0)).toThrow(RangeError);
    expect(() => planRasterSize(29, -100)).toThrow(RangeError);
    expect(() => planRasterSize(29, NaN)).toThrow(RangeError);
    expect(() => planRasterSize(29, Infinity)).toThrow(RangeError);
  });

  it('rejects invalid totalModules', () => {
    expect(() => planRasterSize(0, 500)).toThrow(RangeError);
    expect(() => planRasterSize(-5, 500)).toThrow(RangeError);
    expect(() => planRasterSize(29.5, 500)).toThrow(RangeError);
    expect(() => planRasterSize(NaN, 500)).toThrow(RangeError);
    expect(() => planRasterSize(Infinity, 500)).toThrow(RangeError);
  });
});
