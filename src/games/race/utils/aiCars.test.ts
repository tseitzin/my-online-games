import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateAICars } from './aiCars';
import { CAR_COLORS } from '../../../constants/race/index.ts';

describe('generateAICars', () => {
  it('returns the correct count of cars', () => {
    const cars = generateAICars(3, [], []);
    expect(cars).toHaveLength(3);
  });

  it('returns an empty array for count 0', () => {
    const cars = generateAICars(0, [], []);
    expect(cars).toEqual([]);
  });

  it('avoids used colors and picks from available ones', () => {
    const usedColors = ['#E53935', '#1E88E5']; // Red and Blue
    const cars = generateAICars(1, usedColors, []);
    // First available color should be Green (#43A047)
    expect(cars[0].color).toBe('#43A047');
    expect(usedColors).not.toContain(cars[0].color);
  });

  it('falls back to CAR_COLORS cycling when all colors are used', () => {
    const allColors = CAR_COLORS.map(c => c.value);
    const cars = generateAICars(2, allColors, []);
    // When no available colors, falls back to CAR_COLORS[i % length]
    expect(cars[0].color).toBe(CAR_COLORS[0].value);
    expect(cars[1].color).toBe(CAR_COLORS[1].value);
  });

  it('avoids used numbers when generating car numbers', () => {
    // Mock Math.random to return a deterministic sequence
    const mockRandom = vi.spyOn(Math, 'random');
    // First call: Math.floor(0.5 * 99) + 1 = 50
    // Since 50 is used, it retries
    // Second call: Math.floor(0.3 * 99) + 1 = 30
    mockRandom
      .mockReturnValueOnce(0.5)   // produces 50, which is used
      .mockReturnValueOnce(0.3);  // produces 30, which is available

    const cars = generateAICars(1, [], [50]);
    expect(cars[0].number).toBe(30);

    mockRandom.mockRestore();
  });

  it('generates unique numbers across multiple AI cars', () => {
    const cars = generateAICars(6, [], []);
    const numbers = cars.map(c => c.number);
    const uniqueNumbers = new Set(numbers);
    expect(uniqueNumbers.size).toBe(numbers.length);
  });

  it('generates numbers between 1 and 99 inclusive', () => {
    const cars = generateAICars(10, [], []);
    for (const car of cars) {
      expect(car.number).toBeGreaterThanOrEqual(1);
      expect(car.number).toBeLessThanOrEqual(99);
    }
  });

  it('produces unique numbers even with many used numbers', () => {
    // Use numbers 1-90, leaving only 91-99 available
    const usedNumbers = Array.from({ length: 90 }, (_, i) => i + 1);
    const cars = generateAICars(5, [], usedNumbers);
    expect(cars).toHaveLength(5);

    const allNumbers = [...usedNumbers, ...cars.map(c => c.number)];
    const uniqueNumbers = new Set(allNumbers);
    expect(uniqueNumbers.size).toBe(allNumbers.length);

    for (const car of cars) {
      expect(car.number).toBeGreaterThanOrEqual(1);
      expect(car.number).toBeLessThanOrEqual(99);
    }
  });
});
