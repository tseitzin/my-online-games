import { describe, it, expect } from 'vitest';
import {
  checkCollision,
  checkObstacleCollision,
  resolveObstacleCollision,
  keepInBounds,
  normalizeVector,
  getDistanceBetweenPoints,
  resolveRobotCollisions,
} from './physics';
import { makeRobot, makeObstacle } from '../test/archerFishTestHelpers';

describe('checkCollision', () => {
  it('returns true when two positions are within the default threshold', () => {
    const pos1 = { x: 100, y: 100 };
    const pos2 = { x: 120, y: 100 };
    expect(checkCollision(pos1, pos2)).toBe(true);
  });

  it('returns false when two positions are beyond the default threshold', () => {
    const pos1 = { x: 0, y: 0 };
    const pos2 = { x: 100, y: 100 };
    expect(checkCollision(pos1, pos2)).toBe(false);
  });

  it('returns false when distance equals the threshold exactly', () => {
    const pos1 = { x: 0, y: 0 };
    const pos2 = { x: 30, y: 0 };
    expect(checkCollision(pos1, pos2)).toBe(false);
  });

  it('returns true when positions are identical', () => {
    const pos = { x: 50, y: 50 };
    expect(checkCollision(pos, pos)).toBe(true);
  });

  it('respects a custom threshold', () => {
    const pos1 = { x: 0, y: 0 };
    const pos2 = { x: 5, y: 0 };
    expect(checkCollision(pos1, pos2, 10)).toBe(true);
    expect(checkCollision(pos1, pos2, 3)).toBe(false);
  });

  it('works with negative coordinates', () => {
    const pos1 = { x: -10, y: -10 };
    const pos2 = { x: -15, y: -10 };
    expect(checkCollision(pos1, pos2, 10)).toBe(true);
  });
});

describe('checkObstacleCollision', () => {
  it('returns true when entity center is inside the obstacle', () => {
    const obstacle = makeObstacle({ position: { x: 100, y: 100 }, width: 60, height: 50 });
    const position = { x: 130, y: 125 };
    expect(checkObstacleCollision(position, obstacle)).toBe(true);
  });

  it('returns false when entity is far from the obstacle', () => {
    const obstacle = makeObstacle({ position: { x: 100, y: 100 }, width: 60, height: 50 });
    const position = { x: 300, y: 300 };
    expect(checkObstacleCollision(position, obstacle)).toBe(false);
  });

  it('returns true when entity circle overlaps obstacle edge', () => {
    const obstacle = makeObstacle({ position: { x: 100, y: 100 }, width: 60, height: 50 });
    // Position just outside the right edge (x=160), within default entityRadius of 15
    const position = { x: 170, y: 125 };
    expect(checkObstacleCollision(position, obstacle)).toBe(true);
  });

  it('returns false when entity circle is just beyond obstacle edge', () => {
    const obstacle = makeObstacle({ position: { x: 100, y: 100 }, width: 60, height: 50 });
    // Position well outside the right edge, beyond entityRadius
    const position = { x: 180, y: 125 };
    expect(checkObstacleCollision(position, obstacle)).toBe(false);
  });

  it('respects custom entityRadius', () => {
    const obstacle = makeObstacle({ position: { x: 100, y: 100 }, width: 60, height: 50 });
    const position = { x: 180, y: 125 };
    // distance from right edge (160) is 20; radius 15 won't reach but 25 will
    expect(checkObstacleCollision(position, obstacle, 15)).toBe(false);
    expect(checkObstacleCollision(position, obstacle, 25)).toBe(true);
  });

  it('detects collision near a corner of the obstacle', () => {
    const obstacle = makeObstacle({ position: { x: 100, y: 100 }, width: 60, height: 50 });
    // Near top-left corner (100, 100), within radius
    const position = { x: 95, y: 95 };
    const dist = Math.sqrt(5 * 5 + 5 * 5); // ~7.07
    expect(dist).toBeLessThan(15);
    expect(checkObstacleCollision(position, obstacle)).toBe(true);
  });
});

describe('resolveObstacleCollision', () => {
  it('returns unchanged position and velocity when no collision occurs', () => {
    const obstacle = makeObstacle({ position: { x: 500, y: 500 }, width: 60, height: 50 });
    const position = { x: 100, y: 100 };
    const velocity = { x: 5, y: 0 };
    const result = resolveObstacleCollision(position, velocity, [obstacle]);
    expect(result.position).toEqual({ x: 105, y: 100 });
    expect(result.velocity).toEqual({ x: 5, y: 0 });
  });

  it('pushes entity out and reflects velocity on collision', () => {
    // Obstacle at (200, 95) with width 60, height 50 => spans [200,260] x [95,145]
    // Entity at (190, 120) moving right with velocity (5, 0) => next pos (195, 120)
    // Closest point on obstacle to (195, 120) is (200, 120), distance = 5 < 15
    // Normal = (-1, 0), so entity gets pushed left
    const obstacle = makeObstacle({ position: { x: 200, y: 95 }, width: 60, height: 50 });
    const position = { x: 190, y: 120 };
    const velocity = { x: 5, y: 0 };
    const result = resolveObstacleCollision(position, velocity, [obstacle]);
    // Entity should be pushed to the left of the obstacle
    expect(result.position.x).toBeLessThan(200);
    // Velocity x should be reflected (negative) and dampened
    expect(result.velocity.x).toBeLessThan(0);
  });

  it('applies 0.8 velocity dampening on reflection', () => {
    // Place obstacle so entity just barely enters from the left edge
    // Obstacle spans x: [200, 260], y: [45, 55]
    const obstacle = makeObstacle({ position: { x: 200, y: 45 }, width: 60, height: 10 });
    // Entity at (197, 50) with velocity (5, 0) => next pos (202, 50)
    // Closest point on obstacle to (202, 50) is (202, 50) itself (inside), distance=0 => skip
    // Need entity to land just outside an edge but within entityRadius
    // Entity at (190, 50), velocity (5, 0) => next pos (195, 50)
    // Closest point on obstacle [200,260]x[45,55] to (195, 50) is (200, 50), distance = 5 < 15
    // Normal = (-1, 0), overlap = 15 - 5 = 10, push left by 12 => x = 183
    // dotProduct = 5 * (-1) + 0 * 0 = -5 < 0 => reflect
    // newVelX = 5 - 2*(-5)*(-1) = 5 - 10 = -5, then *= 0.8 => -4
    const position = { x: 190, y: 50 };
    const velocity = { x: 5, y: 0 };
    const result = resolveObstacleCollision(position, velocity, [obstacle]);
    // Velocity should be reflected and dampened by 0.8
    expect(result.velocity.x).toBeCloseTo(-4);
    expect(result.velocity.y).toBeCloseTo(0);
    const speed = Math.sqrt(result.velocity.x ** 2 + result.velocity.y ** 2);
    expect(speed).toBeCloseTo(4); // 5 * 0.8
  });

  it('handles multiple non-colliding obstacles without modifying velocity', () => {
    const obstacles = [
      makeObstacle({ id: 0, position: { x: 500, y: 500 }, width: 60, height: 50 }),
      makeObstacle({ id: 1, position: { x: 800, y: 800 }, width: 60, height: 50 }),
    ];
    const position = { x: 100, y: 100 };
    const velocity = { x: 3, y: 3 };
    const result = resolveObstacleCollision(position, velocity, obstacles);
    expect(result.position).toEqual({ x: 103, y: 103 });
    expect(result.velocity).toEqual({ x: 3, y: 3 });
  });

  it('skips zero-distance collisions to avoid division by zero', () => {
    // Entity center is exactly on the closest point of the obstacle (distance = 0)
    const obstacle = makeObstacle({ position: { x: 100, y: 100 }, width: 60, height: 50 });
    // Place entity center exactly at (130, 125) which is inside the obstacle
    // The closest point will be (130, 125) itself, distance = 0
    const position = { x: 125, y: 120 };
    const velocity = { x: 5, y: 5 };
    // Should not throw and should skip the collision resolution
    const result = resolveObstacleCollision(position, velocity, [obstacle]);
    expect(result).toBeDefined();
    expect(result.position.x).toBeDefined();
    expect(result.position.y).toBeDefined();
  });
});

describe('keepInBounds', () => {
  const width = 800;
  const height = 600;

  it('returns the same position when already within bounds', () => {
    const position = { x: 400, y: 300 };
    const velocity = { x: 5, y: 5 };
    const result = keepInBounds(position, velocity, width, height);
    expect(result).toEqual({ x: 400, y: 300 });
  });

  it('clamps position to left margin', () => {
    const position = { x: 10, y: 300 };
    const velocity = { x: -5, y: 0 };
    const result = keepInBounds(position, velocity, width, height);
    expect(result.x).toBe(30);
  });

  it('clamps position to right margin', () => {
    const position = { x: 790, y: 300 };
    const velocity = { x: 5, y: 0 };
    const result = keepInBounds(position, velocity, width, height);
    expect(result.x).toBe(width - 30);
  });

  it('clamps position to top margin', () => {
    const position = { x: 400, y: 5 };
    const velocity = { x: 0, y: -5 };
    const result = keepInBounds(position, velocity, width, height);
    expect(result.y).toBe(30);
  });

  it('clamps position to bottom margin', () => {
    const position = { x: 400, y: 590 };
    const velocity = { x: 0, y: 5 };
    const result = keepInBounds(position, velocity, width, height);
    expect(result.y).toBe(height - 30);
  });

  it('clamps both axes simultaneously', () => {
    const position = { x: -50, y: 1000 };
    const velocity = { x: -10, y: 10 };
    const result = keepInBounds(position, velocity, width, height);
    expect(result).toEqual({ x: 30, y: height - 30 });
  });

  it('respects a custom margin', () => {
    const position = { x: 15, y: 300 };
    const velocity = { x: -5, y: 0 };
    const result = keepInBounds(position, velocity, width, height, 20);
    expect(result.x).toBe(20);
  });

  it('allows position exactly on the margin boundary', () => {
    const position = { x: 30, y: 30 };
    const velocity = { x: 0, y: 0 };
    const result = keepInBounds(position, velocity, width, height);
    expect(result).toEqual({ x: 30, y: 30 });
  });
});

describe('normalizeVector', () => {
  it('normalizes a horizontal vector', () => {
    const result = normalizeVector(10, 0);
    expect(result).toEqual({ x: 1, y: 0 });
  });

  it('normalizes a vertical vector', () => {
    const result = normalizeVector(0, -5);
    expect(result).toEqual({ x: 0, y: -1 });
  });

  it('normalizes a diagonal vector to unit length', () => {
    const result = normalizeVector(3, 4);
    expect(result.x).toBeCloseTo(0.6);
    expect(result.y).toBeCloseTo(0.8);
    const length = Math.sqrt(result.x ** 2 + result.y ** 2);
    expect(length).toBeCloseTo(1);
  });

  it('returns zero vector for zero input', () => {
    const result = normalizeVector(0, 0);
    expect(result).toEqual({ x: 0, y: 0 });
  });

  it('handles negative components', () => {
    const result = normalizeVector(-3, -4);
    expect(result.x).toBeCloseTo(-0.6);
    expect(result.y).toBeCloseTo(-0.8);
  });
});

describe('getDistanceBetweenPoints', () => {
  it('returns zero for identical points', () => {
    const p = { x: 42, y: 99 };
    expect(getDistanceBetweenPoints(p, p)).toBe(0);
  });

  it('returns correct horizontal distance', () => {
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 10, y: 0 };
    expect(getDistanceBetweenPoints(p1, p2)).toBe(10);
  });

  it('returns correct diagonal distance', () => {
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 3, y: 4 };
    expect(getDistanceBetweenPoints(p1, p2)).toBe(5);
  });

  it('is symmetric (order of points does not matter)', () => {
    const p1 = { x: 10, y: 20 };
    const p2 = { x: 30, y: 50 };
    expect(getDistanceBetweenPoints(p1, p2)).toBe(getDistanceBetweenPoints(p2, p1));
  });
});

describe('resolveRobotCollisions', () => {
  it('returns robots unchanged when they are far apart', () => {
    const robots = [
      makeRobot({ id: 0, position: { x: 100, y: 100 }, velocity: { x: 1, y: 0 } }),
      makeRobot({ id: 1, position: { x: 500, y: 500 }, velocity: { x: -1, y: 0 } }),
    ];
    const result = resolveRobotCollisions(robots);
    expect(result[0].position).toEqual({ x: 100, y: 100 });
    expect(result[1].position).toEqual({ x: 500, y: 500 });
    expect(result[0].velocity).toEqual({ x: 1, y: 0 });
    expect(result[1].velocity).toEqual({ x: -1, y: 0 });
  });

  it('separates overlapping robots', () => {
    const robots = [
      makeRobot({ id: 0, position: { x: 100, y: 100 }, velocity: { x: 5, y: 0 } }),
      makeRobot({ id: 1, position: { x: 140, y: 100 }, velocity: { x: -5, y: 0 } }),
    ];
    // Distance is 40, minDistance is 60 (30 * 2), so they overlap by 20
    const result = resolveRobotCollisions(robots);
    const newDist = getDistanceBetweenPoints(result[0].position, result[1].position);
    expect(newDist).toBeCloseTo(60);
  });

  it('applies elastic collision with 0.7 restitution when robots approach each other', () => {
    const robots = [
      makeRobot({ id: 0, position: { x: 100, y: 100 }, velocity: { x: 10, y: 0 } }),
      makeRobot({ id: 1, position: { x: 140, y: 100 }, velocity: { x: -10, y: 0 } }),
    ];
    const result = resolveRobotCollisions(robots);
    // Robot 0 was moving right, after collision it should move left (or slower right)
    // Robot 1 was moving left, after collision it should move right (or slower left)
    expect(result[0].velocity.x).toBeLessThan(10);
    expect(result[1].velocity.x).toBeGreaterThan(-10);
  });

  it('does not apply impulse when robots are moving apart', () => {
    const robots = [
      makeRobot({ id: 0, position: { x: 100, y: 100 }, velocity: { x: -10, y: 0 } }),
      makeRobot({ id: 1, position: { x: 140, y: 100 }, velocity: { x: 10, y: 0 } }),
    ];
    const result = resolveRobotCollisions(robots);
    // Positions should still be pushed apart, but velocities should remain unchanged
    expect(result[0].velocity).toEqual({ x: -10, y: 0 });
    expect(result[1].velocity).toEqual({ x: 10, y: 0 });
  });

  it('returns a new array with resolved robots', () => {
    const robots = [
      makeRobot({ id: 0, position: { x: 100, y: 100 }, velocity: { x: 5, y: 0 } }),
      makeRobot({ id: 1, position: { x: 120, y: 100 }, velocity: { x: -5, y: 0 } }),
    ];
    const result = resolveRobotCollisions(robots);
    // Result should have the same number of robots
    expect(result).toHaveLength(2);
    // Since they overlap (distance 20 < minDistance 60), positions should be adjusted
    expect(result[0].position.x).not.toBe(result[1].position.x);
  });

  it('handles three robots with pairwise collisions', () => {
    const robots = [
      makeRobot({ id: 0, position: { x: 100, y: 100 }, velocity: { x: 5, y: 0 } }),
      makeRobot({ id: 1, position: { x: 130, y: 100 }, velocity: { x: -5, y: 0 } }),
      makeRobot({ id: 2, position: { x: 160, y: 100 }, velocity: { x: -5, y: 0 } }),
    ];
    const result = resolveRobotCollisions(robots);
    expect(result).toHaveLength(3);
    // Each robot should have defined position and velocity
    for (const robot of result) {
      expect(robot.position.x).toBeDefined();
      expect(robot.position.y).toBeDefined();
      expect(robot.velocity.x).toBeDefined();
      expect(robot.velocity.y).toBeDefined();
    }
  });

  it('handles a single robot without errors', () => {
    const robots = [makeRobot({ id: 0 })];
    const result = resolveRobotCollisions(robots);
    expect(result).toHaveLength(1);
    expect(result[0].position).toEqual(robots[0].position);
  });

  it('handles an empty array without errors', () => {
    const result = resolveRobotCollisions([]);
    expect(result).toHaveLength(0);
  });

  it('skips pairs at exactly zero distance', () => {
    const robots = [
      makeRobot({ id: 0, position: { x: 100, y: 100 }, velocity: { x: 0, y: 0 } }),
      makeRobot({ id: 1, position: { x: 100, y: 100 }, velocity: { x: 0, y: 0 } }),
    ];
    // distance is 0, which fails the `distance > 0` check, so nothing happens
    const result = resolveRobotCollisions(robots);
    expect(result[0].position).toEqual({ x: 100, y: 100 });
    expect(result[1].position).toEqual({ x: 100, y: 100 });
  });
});
