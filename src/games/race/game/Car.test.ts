import { describe, it, expect, beforeEach } from 'vitest';
import '../test/raceTestHelpers'; // Path2D mock must be imported before Car
import { drawCar, drawCarPreview } from './Car';
import { createMockCanvasContext, makeCar } from '../test/raceTestHelpers';

describe('drawCar', () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    ctx = createMockCanvasContext();
  });

  it('does not throw with a mock canvas context', () => {
    const car = makeCar({ color: '#E53935', number: 7 });
    const position = { x: 100, y: 200 };
    expect(() => drawCar(ctx, car, position, 0)).not.toThrow();
  });

  it('calls ctx.save and ctx.restore', () => {
    const car = makeCar({ color: '#1E88E5', number: 3 });
    drawCar(ctx, car, { x: 50, y: 50 }, Math.PI / 4);
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });

  it('calls ctx.translate with the provided position coordinates', () => {
    const car = makeCar({ color: '#43A047', number: 12 });
    const position = { x: 320, y: 175 };
    drawCar(ctx, car, position, 0);
    expect(ctx.translate).toHaveBeenCalledWith(320, 175);
  });
});

describe('drawCarPreview', () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    ctx = createMockCanvasContext();
  });

  it('does not throw with a mock canvas context', () => {
    expect(() => drawCarPreview(ctx, '#E53935', 42, 100, 200)).not.toThrow();
  });

  it('calls ctx.scale', () => {
    drawCarPreview(ctx, '#FB8C00', 5, 60, 80, 2);
    expect(ctx.scale).toHaveBeenCalledWith(2, 2);
  });

  it('applies a default scale of 1 when scale is not provided', () => {
    drawCarPreview(ctx, '#FDD835', 99, 10, 20);
    expect(ctx.scale).toHaveBeenCalledWith(1, 1);
  });
});
