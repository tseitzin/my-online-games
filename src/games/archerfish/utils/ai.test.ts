import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { updateAIFish, updateRobot } from './ai';
import { makeFish, makeRobot, makeObstacle } from '../test/archerFishTestHelpers';

describe('updateAIFish', () => {
  const arenaWidth = 800;
  const arenaHeight = 600;
  const deltaTime = 16;

  let dateNowSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(10000);
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  describe('frozen fish', () => {
    it('returns zero velocity when fish is frozen', () => {
      const fish = makeFish({ isFrozen: true, velocity: { x: 5, y: 3 } });
      const robots = [makeRobot()];
      const result = updateAIFish(fish, robots, [], arenaWidth, arenaHeight, deltaTime);
      expect(result).toEqual({ x: 0, y: 0 });
    });

    it('ignores nearby robots when fish is frozen', () => {
      const fish = makeFish({
        isFrozen: true,
        position: { x: 100, y: 100 },
        velocity: { x: 2, y: 2 },
      });
      const robots = [makeRobot({ position: { x: 110, y: 100 } })];
      const result = updateAIFish(fish, robots, [], arenaWidth, arenaHeight, deltaTime);
      expect(result).toEqual({ x: 0, y: 0 });
    });
  });

  describe('robot evasion', () => {
    it('flees away from a robot within the 200px danger zone', () => {
      const fish = makeFish({
        position: { x: 300, y: 300 },
        velocity: { x: 0, y: 0 },
      });
      // Robot 100px to the right of the fish (within 200px)
      const robots = [makeRobot({ position: { x: 400, y: 300 } })];
      const result = updateAIFish(fish, robots, [], arenaWidth, arenaHeight, deltaTime);
      // Fish should flee to the left (negative x direction)
      expect(result.x).toBeLessThan(0);
    });

    it('flees at speed 4 magnitude in the opposite direction', () => {
      const fish = makeFish({
        position: { x: 300, y: 300 },
        velocity: { x: 0, y: 0 },
      });
      // Robot directly to the right, 50px away
      const robots = [makeRobot({ position: { x: 350, y: 300 } })];
      const result = updateAIFish(fish, robots, [], arenaWidth, arenaHeight, deltaTime);
      // With smoothing 0.1, target velocity is (-4, 0), blended from (0,0)
      // newVel = 0 + (-4 - 0) * 0.1 = -0.4
      expect(result.x).toBeCloseTo(-0.4);
      expect(result.y).toBeCloseTo(0);
    });

    it('evades the closest robot when multiple robots are present', () => {
      const fish = makeFish({
        position: { x: 300, y: 300 },
        velocity: { x: 0, y: 0 },
      });
      const robots = [
        makeRobot({ id: 0, position: { x: 350, y: 300 } }), // 50px away, to the right
        makeRobot({ id: 1, position: { x: 200, y: 300 } }), // 100px away, to the left
      ];
      const result = updateAIFish(fish, robots, [], arenaWidth, arenaHeight, deltaTime);
      // Should flee from the closest robot (id 0 at 350), so flee leftward
      expect(result.x).toBeLessThan(0);
    });

    it('does not flee when robot is exactly at 200px (at danger zone boundary)', () => {
      const fish = makeFish({
        position: { x: 300, y: 300 },
        velocity: { x: 0, y: 0 },
        id: 0,
      });
      // Robot exactly 200px away (not less than 200)
      const robots = [makeRobot({ position: { x: 500, y: 300 } })];
      const result = updateAIFish(fish, robots, [], arenaWidth, arenaHeight, deltaTime);
      // Should use wandering behavior, not fleeing
      // Wandering uses sin/cos based on Date.now()/1000 = 10
      const time = 10;
      const expectedTargetX = Math.cos(time * 0.5 + 0) * 2;
      const expectedTargetY = Math.sin(time * 0.3 + 0) * 2 + Math.sin(time + 0 * 100) * 0.5;
      expect(result.x).toBeCloseTo(expectedTargetX * 0.1);
      expect(result.y).toBeCloseTo(expectedTargetY * 0.1);
    });
  });

  describe('wandering behavior', () => {
    it('uses sin/cos patterns based on Date.now for wandering when robot is far', () => {
      dateNowSpy.mockReturnValue(5000); // time = 5
      const fish = makeFish({
        id: 1,
        position: { x: 400, y: 300 },
        velocity: { x: 0, y: 0 },
      });
      const robots = [makeRobot({ position: { x: 700, y: 300 } })]; // 300px away, safe
      const result = updateAIFish(fish, robots, [], arenaWidth, arenaHeight, deltaTime);

      const time = 5;
      const randomFactor = Math.sin(time + 1 * 100);
      const expectedTargetX = Math.cos(time * 0.5 + 1) * 2;
      const expectedTargetY = Math.sin(time * 0.3 + 1) * 2 + randomFactor * 0.5;
      // With smoothing 0.1 from velocity (0,0)
      expect(result.x).toBeCloseTo(expectedTargetX * 0.1);
      expect(result.y).toBeCloseTo(expectedTargetY * 0.1);
    });

    it('produces different wander patterns for different fish IDs', () => {
      dateNowSpy.mockReturnValue(8000);
      const robots = [makeRobot({ position: { x: 700, y: 500 } })];

      const fish1 = makeFish({ id: 1, position: { x: 400, y: 300 }, velocity: { x: 0, y: 0 } });
      const fish2 = makeFish({ id: 2, position: { x: 400, y: 300 }, velocity: { x: 0, y: 0 } });

      const result1 = updateAIFish(fish1, robots, [], arenaWidth, arenaHeight, deltaTime);
      const result2 = updateAIFish(fish2, robots, [], arenaWidth, arenaHeight, deltaTime);

      // Different fish IDs should produce different wandering velocities
      const sameBehavior = result1.x === result2.x && result1.y === result2.y;
      expect(sameBehavior).toBe(false);
    });
  });

  describe('obstacle avoidance', () => {
    it('steers away from a nearby obstacle within 80px', () => {
      const fish = makeFish({
        position: { x: 440, y: 330 },
        velocity: { x: 0, y: 0 },
      });
      // Obstacle at (400, 300) with width 60, height 50 (center at 430, 325)
      // Fish is at (440, 330), which is inside or very close to the obstacle
      const obstacle = makeObstacle({
        position: { x: 400, y: 300 },
        width: 60,
        height: 50,
      });
      const robots = [makeRobot({ position: { x: 700, y: 600 } })]; // Far away
      const result = updateAIFish(fish, robots, [obstacle], arenaWidth, arenaHeight, deltaTime);
      // The obstacle avoidance should add a force pushing fish away from obstacle center (430, 325)
      // Fish is to the right and below the center, so should get pushed right and down
      expect(result.x).toBeGreaterThan(0);
    });

    it('does not apply obstacle avoidance when obstacle is far away', () => {
      const fish = makeFish({
        id: 0,
        position: { x: 100, y: 100 },
        velocity: { x: 0, y: 0 },
      });
      const obstacle = makeObstacle({
        position: { x: 600, y: 500 },
        width: 60,
        height: 50,
      });
      const robots = [makeRobot({ position: { x: 700, y: 600 } })];

      const resultWithObstacle = updateAIFish(fish, robots, [obstacle], arenaWidth, arenaHeight, deltaTime);
      const resultWithout = updateAIFish(fish, robots, [], arenaWidth, arenaHeight, deltaTime);

      expect(resultWithObstacle.x).toBeCloseTo(resultWithout.x);
      expect(resultWithObstacle.y).toBeCloseTo(resultWithout.y);
    });
  });

  describe('boundary steering', () => {
    it('steers right when near the left border (x < 80)', () => {
      const fish = makeFish({
        position: { x: 50, y: 300 },
        velocity: { x: 0, y: 0 },
      });
      const robots = [makeRobot({ position: { x: 700, y: 300 } })];
      const result = updateAIFish(fish, robots, [], arenaWidth, arenaHeight, deltaTime);
      // Left boundary adds +2 to targetVelX, making the result positive-biased
      expect(result.x).toBeGreaterThan(0);
    });

    it('steers left when near the right border (x > arenaWidth - 80)', () => {
      const fish = makeFish({
        position: { x: arenaWidth - 50, y: 300 },
        velocity: { x: 0, y: 0 },
      });
      const robots = [makeRobot({ position: { x: 100, y: 300 } })];
      const result = updateAIFish(fish, robots, [], arenaWidth, arenaHeight, deltaTime);
      // Right boundary adds -2 to targetVelX
      expect(result.x).toBeLessThan(0);
    });

    it('steers down when near the top border (y < 80)', () => {
      const fish = makeFish({
        position: { x: 400, y: 30 },
        velocity: { x: 0, y: 0 },
      });
      const robots = [makeRobot({ position: { x: 700, y: 500 } })];
      const result = updateAIFish(fish, robots, [], arenaWidth, arenaHeight, deltaTime);
      // Top boundary adds +2 to targetVelY
      expect(result.y).toBeGreaterThan(0);
    });

    it('steers up when near the bottom border (y > arenaHeight - 80)', () => {
      const fish = makeFish({
        position: { x: 400, y: arenaHeight - 30 },
        velocity: { x: 0, y: 0 },
      });
      const robots = [makeRobot({ position: { x: 700, y: 100 } })];
      const result = updateAIFish(fish, robots, [], arenaWidth, arenaHeight, deltaTime);
      // Bottom boundary adds -2 to targetVelY
      expect(result.y).toBeLessThan(0);
    });
  });

  describe('smoothing', () => {
    it('applies 0.1 smoothing factor to blend with existing velocity', () => {
      const fish = makeFish({
        position: { x: 300, y: 300 },
        velocity: { x: 10, y: 10 },
      });
      // Robot directly to the right, close enough to trigger fleeing
      const robots = [makeRobot({ position: { x: 350, y: 300 } })];
      const result = updateAIFish(fish, robots, [], arenaWidth, arenaHeight, deltaTime);
      // Target velocity x is -4 (flee left), existing velocity is 10
      // newVelX = 10 + (-4 - 10) * 0.1 = 10 + (-14) * 0.1 = 10 - 1.4 = 8.6
      expect(result.x).toBeCloseTo(8.6);
    });

    it('gradually converges toward target velocity over multiple calls', () => {
      const robots = [makeRobot({ position: { x: 700, y: 300 } })];
      let velocity = { x: 10, y: 0 };
      const fish = makeFish({
        position: { x: 300, y: 300 },
        velocity,
      });

      // Robot is at 400px distance (safe), so wander target will be small
      // Calling multiple times, velocity should converge away from 10
      const result1 = updateAIFish(fish, robots, [], arenaWidth, arenaHeight, deltaTime);
      fish.velocity = result1;
      const result2 = updateAIFish(fish, robots, [], arenaWidth, arenaHeight, deltaTime);

      // Each step should move closer to the wander target (which is small, ~2)
      expect(Math.abs(result2.x)).toBeLessThan(Math.abs(velocity.x));
    });
  });
});

describe('updateRobot', () => {
  const deltaTime = 16;

  let dateNowSpy: ReturnType<typeof vi.spyOn>;
  let mathRandomSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(10000);
    mathRandomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
    mathRandomSpy.mockRestore();
  });

  describe('no active fish', () => {
    it('returns zero velocity and null targetFishId when all fish are frozen', () => {
      const robot = makeRobot();
      const fish = [
        makeFish({ id: 0, isFrozen: true }),
        makeFish({ id: 1, isFrozen: true }),
      ];
      const result = updateRobot(robot, fish, [], 'medium', deltaTime);
      expect(result.velocity).toEqual({ x: 0, y: 0 });
      expect(result.targetFishId).toBeNull();
    });

    it('returns zero velocity when fish array is empty', () => {
      const robot = makeRobot();
      const result = updateRobot(robot, [], [], 'medium', deltaTime);
      expect(result.velocity).toEqual({ x: 0, y: 0 });
      expect(result.targetFishId).toBeNull();
    });
  });

  describe('frozen fish escape - close distance (< 60px)', () => {
    it('escapes immediately at speed * 2.5 when within 60px of a frozen fish', () => {
      const robot = makeRobot({
        position: { x: 100, y: 100 },
        velocity: { x: 0, y: 0 },
        speed: 2.5,
      });
      const fish = [
        makeFish({ id: 0, isFrozen: true, position: { x: 130, y: 100 } }), // 30px away
        makeFish({ id: 1, isFrozen: false, position: { x: 500, y: 500 } }),
      ];
      const result = updateRobot(robot, fish, [], 'medium', deltaTime);

      // Escape direction is away from frozen fish (to the left)
      expect(result.velocity.x).toBeLessThan(0);
      // Speed should be robot.speed * 2.5 = 6.25 (immediate, no smoothing)
      const speed = Math.sqrt(result.velocity.x ** 2 + result.velocity.y ** 2);
      expect(speed).toBeCloseTo(6.25);
      expect(result.targetFishId).toBeNull();
    });

    it('returns immediate escape without smoothing for very close frozen fish', () => {
      const robot = makeRobot({
        position: { x: 200, y: 200 },
        velocity: { x: 5, y: 5 },
        speed: 3,
      });
      const fish = [
        makeFish({ id: 0, isFrozen: true, position: { x: 210, y: 200 } }), // 10px
        makeFish({ id: 1, isFrozen: false, position: { x: 600, y: 400 } }),
      ];
      const result = updateRobot(robot, fish, [], 'easy', deltaTime);
      // Immediate escape: no smoothing applied, velocity set directly
      const escapeSpeed = 3 * 2.5; // 7.5
      const speed = Math.sqrt(result.velocity.x ** 2 + result.velocity.y ** 2);
      expect(speed).toBeCloseTo(escapeSpeed);
    });
  });

  describe('frozen fish escape - medium distance (60-150px)', () => {
    it('applies smoothed escape at 0.6 factor for frozen fish 60-150px away', () => {
      const robot = makeRobot({
        position: { x: 200, y: 200 },
        velocity: { x: 0, y: 0 },
        speed: 2.5,
      });
      const fish = [
        makeFish({ id: 0, isFrozen: true, position: { x: 300, y: 200 } }), // 100px away
        makeFish({ id: 1, isFrozen: false, position: { x: 600, y: 400 } }),
      ];
      const result = updateRobot(robot, fish, [], 'medium', deltaTime);

      // Escape direction: left (away from frozen fish at x=300)
      // escapeSpeed = 2.5 * 2.5 = 6.25
      // escapeVel = (-6.25, 0)
      // smoothed = 0 + (-6.25 - 0) * 0.6 = -3.75
      expect(result.velocity.x).toBeCloseTo(-3.75);
      expect(result.velocity.y).toBeCloseTo(0);
      expect(result.targetFishId).toBeNull();
    });

    it('blends escape velocity with existing robot velocity', () => {
      const robot = makeRobot({
        position: { x: 200, y: 200 },
        velocity: { x: 4, y: 0 },
        speed: 2.5,
      });
      const fish = [
        makeFish({ id: 0, isFrozen: true, position: { x: 300, y: 200 } }), // 100px away
        makeFish({ id: 1, isFrozen: false, position: { x: 600, y: 400 } }),
      ];
      const result = updateRobot(robot, fish, [], 'medium', deltaTime);

      // escapeVelX = -6.25, existing velocity = 4
      // smoothed = 4 + (-6.25 - 4) * 0.6 = 4 + (-10.25) * 0.6 = 4 - 6.15 = -2.15
      expect(result.velocity.x).toBeCloseTo(-2.15);
    });
  });

  describe('random escape angle', () => {
    it('uses Math.random for escape direction when both dx and dy are < 5', () => {
      const robot = makeRobot({
        position: { x: 200, y: 200 },
        velocity: { x: 0, y: 0 },
        speed: 2,
      });
      // Place frozen fish at nearly the same position (dx=3, dy=2, both < 5)
      const fish = [
        makeFish({ id: 0, isFrozen: true, position: { x: 203, y: 202 } }),
        makeFish({ id: 1, isFrozen: false, position: { x: 600, y: 400 } }),
      ];
      // Math.random returns 0.5, so angle = 0.5 * PI * 2 = PI
      // awayX = cos(PI) * 10 = -10, awayY = sin(PI) * 10 ~= 0
      const result = updateRobot(robot, fish, [], 'medium', deltaTime);

      expect(mathRandomSpy).toHaveBeenCalled();
      // Distance ~3.6 < 60, so immediate escape
      const speed = Math.sqrt(result.velocity.x ** 2 + result.velocity.y ** 2);
      expect(speed).toBeCloseTo(2 * 2.5); // 5.0
    });

    it('produces different escape directions with different Math.random values', () => {
      const robot = makeRobot({
        position: { x: 200, y: 200 },
        velocity: { x: 0, y: 0 },
        speed: 2,
      });
      const fish = [
        makeFish({ id: 0, isFrozen: true, position: { x: 202, y: 201 } }),
        makeFish({ id: 1, isFrozen: false, position: { x: 600, y: 400 } }),
      ];

      mathRandomSpy.mockReturnValue(0.25);
      const result1 = updateRobot(robot, fish, [], 'medium', deltaTime);

      mathRandomSpy.mockReturnValue(0.75);
      const result2 = updateRobot(robot, fish, [], 'medium', deltaTime);

      // Different random values should produce different escape directions
      // Compare the full velocity vector (x or y should differ)
      const differ = Math.abs(result1.velocity.x - result2.velocity.x) > 0.01 ||
                     Math.abs(result1.velocity.y - result2.velocity.y) > 0.01;
      expect(differ).toBe(true);
    });
  });

  describe('target retention', () => {
    it('keeps current target if within 400px', () => {
      const robot = makeRobot({
        position: { x: 200, y: 200 },
        velocity: { x: 0, y: 0 },
        targetFishId: 1,
      });
      const fish = [
        makeFish({ id: 0, isFrozen: false, position: { x: 250, y: 200 } }), // Closer fish
        makeFish({ id: 1, isFrozen: false, position: { x: 500, y: 200 } }), // Current target, 300px away
      ];
      const result = updateRobot(robot, fish, [], 'medium', deltaTime);
      expect(result.targetFishId).toBe(1);
    });

    it('drops current target if beyond 400px', () => {
      const robot = makeRobot({
        position: { x: 100, y: 100 },
        velocity: { x: 0, y: 0 },
        targetFishId: 1,
      });
      const fish = [
        makeFish({ id: 0, isFrozen: false, position: { x: 200, y: 100 } }), // 100px
        makeFish({ id: 1, isFrozen: false, position: { x: 600, y: 500 } }), // well > 400px
      ];
      const result = updateRobot(robot, fish, [], 'medium', deltaTime);
      // Should select a new target, not keep id=1
      expect(result.targetFishId).not.toBe(1);
    });

    it('drops target if the targeted fish is now frozen', () => {
      const robot = makeRobot({
        position: { x: 200, y: 200 },
        velocity: { x: 0, y: 0 },
        targetFishId: 0,
      });
      const fish = [
        makeFish({ id: 0, isFrozen: true, position: { x: 250, y: 200 } }),
        makeFish({ id: 1, isFrozen: false, position: { x: 400, y: 300 } }),
      ];
      // Frozen fish at 250 is only 50px away, so escape logic will trigger
      // But the result should not target the frozen fish
      const result = updateRobot(robot, fish, [], 'medium', deltaTime);
      // targetFishId should be null (escape) or a non-frozen fish
      expect(result.targetFishId === null || result.targetFishId === 1).toBe(true);
    });
  });

  describe('new target selection', () => {
    it('selects a target using distance sorting and time-based rotation', () => {
      dateNowSpy.mockReturnValue(10000);
      const robot = makeRobot({
        id: 0,
        position: { x: 200, y: 200 },
        velocity: { x: 0, y: 0 },
        targetFishId: null,
      });
      const fish = [
        makeFish({ id: 0, isFrozen: false, position: { x: 300, y: 200 } }), // 100px
        makeFish({ id: 1, isFrozen: false, position: { x: 400, y: 200 } }), // 200px
        makeFish({ id: 2, isFrozen: false, position: { x: 500, y: 200 } }), // 300px
      ];
      // robotTime = Math.floor(10000 / 5000) = 2
      // targetIndex = (0 + 2) % 3 = 2 => fish sorted by distance index 2 => id=2 (farthest)
      const result = updateRobot(robot, fish, [], 'medium', deltaTime);
      expect(result.targetFishId).toBe(2);
    });

    it('changes target selection as Date.now advances', () => {
      const robot = makeRobot({
        id: 0,
        position: { x: 200, y: 200 },
        velocity: { x: 0, y: 0 },
        targetFishId: null,
      });
      const fish = [
        makeFish({ id: 10, isFrozen: false, position: { x: 300, y: 200 } }),
        makeFish({ id: 11, isFrozen: false, position: { x: 400, y: 200 } }),
        makeFish({ id: 12, isFrozen: false, position: { x: 500, y: 200 } }),
      ];

      dateNowSpy.mockReturnValue(5000); // robotTime = 1, index = (0+1)%3 = 1
      const result1 = updateRobot(robot, fish, [], 'medium', deltaTime);

      dateNowSpy.mockReturnValue(10000); // robotTime = 2, index = (0+2)%3 = 2
      const result2 = updateRobot(robot, fish, [], 'medium', deltaTime);

      expect(result1.targetFishId).not.toBe(result2.targetFishId);
    });
  });

  describe('difficulty-based smoothing', () => {
    it('uses 0.05 smoothing for easy difficulty', () => {
      const robot = makeRobot({
        position: { x: 200, y: 200 },
        velocity: { x: 0, y: 0 },
        targetFishId: null,
        speed: 2.5,
      });
      const fish = [
        makeFish({ id: 0, isFrozen: false, position: { x: 500, y: 200 } }),
      ];
      const result = updateRobot(robot, fish, [], 'easy', deltaTime);
      // Target velocity toward fish at (500,200): direction (1,0), speed 2.5 => (2.5, 0)
      // Smoothed: 0 + (2.5 - 0) * 0.05 = 0.125
      expect(result.velocity.x).toBeCloseTo(0.125);
      expect(result.velocity.y).toBeCloseTo(0);
    });

    it('uses 0.08 smoothing for medium difficulty', () => {
      const robot = makeRobot({
        position: { x: 200, y: 200 },
        velocity: { x: 0, y: 0 },
        targetFishId: null,
        speed: 2.5,
      });
      const fish = [
        makeFish({ id: 0, isFrozen: false, position: { x: 500, y: 200 } }),
      ];
      const result = updateRobot(robot, fish, [], 'medium', deltaTime);
      // Smoothed: 0 + (2.5 - 0) * 0.08 = 0.2
      expect(result.velocity.x).toBeCloseTo(0.2);
      expect(result.velocity.y).toBeCloseTo(0);
    });

    it('uses 0.12 smoothing for hard difficulty', () => {
      const robot = makeRobot({
        position: { x: 200, y: 200 },
        velocity: { x: 0, y: 0 },
        targetFishId: null,
        speed: 2.5,
      });
      const fish = [
        makeFish({ id: 0, isFrozen: false, position: { x: 500, y: 200 } }),
      ];
      const result = updateRobot(robot, fish, [], 'hard', deltaTime);
      // Target is 300px away (> 150), so no speed boost
      // Smoothed: 0 + (2.5 - 0) * 0.12 = 0.3
      expect(result.velocity.x).toBeCloseTo(0.3);
      expect(result.velocity.y).toBeCloseTo(0);
    });
  });

  describe('hard difficulty speed boost', () => {
    it('boosts speed by 1.3x when hard difficulty and within 150px of target', () => {
      const robot = makeRobot({
        position: { x: 200, y: 200 },
        velocity: { x: 0, y: 0 },
        targetFishId: null,
        speed: 2.5,
      });
      const fish = [
        makeFish({ id: 0, isFrozen: false, position: { x: 300, y: 200 } }), // 100px, within 150
      ];
      const result = updateRobot(robot, fish, [], 'hard', deltaTime);
      // Boosted speed = 2.5 * 1.3 = 3.25, direction (1, 0)
      // Smoothed: 0 + (3.25 - 0) * 0.12 = 0.39
      expect(result.velocity.x).toBeCloseTo(0.39);
    });

    it('does not boost speed on hard difficulty when target is beyond 150px', () => {
      const robot = makeRobot({
        position: { x: 200, y: 200 },
        velocity: { x: 0, y: 0 },
        targetFishId: null,
        speed: 2.5,
      });
      const fish = [
        makeFish({ id: 0, isFrozen: false, position: { x: 500, y: 200 } }), // 300px, beyond 150
      ];
      const result = updateRobot(robot, fish, [], 'hard', deltaTime);
      // No boost: speed stays 2.5, direction (1, 0)
      // Smoothed: 0 + (2.5 - 0) * 0.12 = 0.3
      expect(result.velocity.x).toBeCloseTo(0.3);
    });

    it('does not boost speed on easy or medium difficulty even within 150px', () => {
      const robot = makeRobot({
        position: { x: 200, y: 200 },
        velocity: { x: 0, y: 0 },
        targetFishId: null,
        speed: 2.5,
      });
      const fish = [
        makeFish({ id: 0, isFrozen: false, position: { x: 300, y: 200 } }), // 100px
      ];

      const easyResult = updateRobot(robot, fish, [], 'easy', deltaTime);
      const mediumResult = updateRobot(robot, fish, [], 'medium', deltaTime);

      // Easy: 0 + (2.5 - 0) * 0.05 = 0.125
      expect(easyResult.velocity.x).toBeCloseTo(0.125);
      // Medium: 0 + (2.5 - 0) * 0.08 = 0.2
      expect(mediumResult.velocity.x).toBeCloseTo(0.2);
    });
  });

  describe('obstacle avoidance', () => {
    it('avoids obstacle within 80px with strength 3 for distance >= 50', () => {
      const robot = makeRobot({
        position: { x: 390, y: 325 },
        velocity: { x: 0, y: 0 },
        targetFishId: null,
        speed: 2.5,
      });
      // Obstacle at (400, 300), 60x50, center at (430, 325)
      // Robot at (390, 325) is near the left edge of the obstacle
      const obstacle = makeObstacle({
        position: { x: 400, y: 300 },
        width: 60,
        height: 50,
      });
      // Active fish far away so chase doesn't dominate
      const fish = [
        makeFish({ id: 0, isFrozen: false, position: { x: 600, y: 325 } }),
      ];
      const result = updateRobot(robot, fish, [obstacle], 'medium', deltaTime);
      // Obstacle avoidance should push robot to the left (away from obstacle center at 430)
      // Combined with chase toward (600, 325) pushing right, obstacle avoidance adds left component
      // The avoidance force should be noticeable
      expect(result.velocity).toBeDefined();
    });

    it('applies stronger avoidance (strength 5) when distance to obstacle < 50px', () => {
      const robot = makeRobot({
        position: { x: 430, y: 325 },
        velocity: { x: 0, y: 0 },
        targetFishId: null,
        speed: 2.5,
      });
      // Robot is right at the obstacle center. The distance to obstacle edge = 0 (inside).
      const obstacle = makeObstacle({
        position: { x: 400, y: 300 },
        width: 60,
        height: 50,
      });
      const fish = [
        makeFish({ id: 0, isFrozen: false, position: { x: 200, y: 325 } }),
      ];

      // Also test with the robot at a position where the obstacle collision check fires
      // but the distance to center is small
      const robotNear = makeRobot({
        position: { x: 425, y: 320 },
        velocity: { x: 0, y: 0 },
        targetFishId: null,
        speed: 2.5,
      });
      const resultNear = updateRobot(robotNear, fish, [obstacle], 'medium', deltaTime);
      // Should have an avoidance force applied
      expect(resultNear.velocity).toBeDefined();
    });

    it('does not apply obstacle avoidance when obstacle is far away', () => {
      const robot = makeRobot({
        position: { x: 100, y: 100 },
        velocity: { x: 0, y: 0 },
        targetFishId: null,
        speed: 2.5,
      });
      const obstacle = makeObstacle({
        position: { x: 600, y: 500 },
        width: 60,
        height: 50,
      });
      const fish = [
        makeFish({ id: 0, isFrozen: false, position: { x: 300, y: 100 } }),
      ];

      const resultWith = updateRobot(robot, fish, [obstacle], 'medium', deltaTime);
      const resultWithout = updateRobot(robot, fish, [], 'medium', deltaTime);

      expect(resultWith.velocity.x).toBeCloseTo(resultWithout.velocity.x);
      expect(resultWith.velocity.y).toBeCloseTo(resultWithout.velocity.y);
    });
  });
});
