import { describe, expect, it, vi, afterEach } from 'vitest'
import { initializeFish, initializeRobots, initializeObstacles } from './gameInitializer'
import { makeGameConfig } from '../test/archerFishTestHelpers'

const ARENA_WIDTH = 1200
const ARENA_HEIGHT = 700

describe('initializeFish', () => {
  it('creates the correct number of fish for 2 players', () => {
    const config = makeGameConfig({ numPlayers: 2 })
    const fish = initializeFish(config, ARENA_WIDTH, ARENA_HEIGHT)
    expect(fish).toHaveLength(2)
  })

  it('creates the correct number of fish for 3 players', () => {
    const config = makeGameConfig({
      numPlayers: 3,
      humanPlayers: [true, true, false],
      playerNames: ['P1', 'P2', 'AI'],
    })
    const fish = initializeFish(config, ARENA_WIDTH, ARENA_HEIGHT)
    expect(fish).toHaveLength(3)
  })

  it('creates the correct number of fish for 4 players', () => {
    const config = makeGameConfig({
      numPlayers: 4,
      humanPlayers: [true, true, false, false],
      playerNames: ['P1', 'P2', 'AI1', 'AI2'],
    })
    const fish = initializeFish(config, ARENA_WIDTH, ARENA_HEIGHT)
    expect(fish).toHaveLength(4)
  })

  it('assigns controlKeys to human players', () => {
    const config = makeGameConfig({
      numPlayers: 2,
      humanPlayers: [true, false],
    })
    const fish = initializeFish(config, ARENA_WIDTH, ARENA_HEIGHT)
    const humanFish = fish.find(f => f.isHuman)!
    expect(humanFish.controlKeys).toBeDefined()
    expect(humanFish.controlKeys).toHaveProperty('up')
    expect(humanFish.controlKeys).toHaveProperty('down')
    expect(humanFish.controlKeys).toHaveProperty('left')
    expect(humanFish.controlKeys).toHaveProperty('right')
    expect(humanFish.controlKeys).toHaveProperty('boost')
    expect(humanFish.controlKeys).toHaveProperty('shoot')
  })

  it('does not assign controlKeys to AI players', () => {
    const config = makeGameConfig({
      numPlayers: 2,
      humanPlayers: [true, false],
    })
    const fish = initializeFish(config, ARENA_WIDTH, ARENA_HEIGHT)
    const aiFish = fish.find(f => !f.isHuman)!
    expect(aiFish.controlKeys).toBeUndefined()
  })

  it('sets position.x to 100 for all fish', () => {
    const config = makeGameConfig({
      numPlayers: 3,
      humanPlayers: [true, false, true],
      playerNames: ['P1', 'AI', 'P2'],
    })
    const fish = initializeFish(config, ARENA_WIDTH, ARENA_HEIGHT)
    fish.forEach(f => {
      expect(f.position.x).toBe(100)
    })
  })

  it('distributes fish y positions evenly across the arena height', () => {
    const config = makeGameConfig({
      numPlayers: 3,
      humanPlayers: [true, false, true],
      playerNames: ['P1', 'AI', 'P2'],
    })
    const fish = initializeFish(config, ARENA_WIDTH, ARENA_HEIGHT)
    // For 3 players: y = (700 / 4) * 1, (700 / 4) * 2, (700 / 4) * 3
    expect(fish[0].position.y).toBe(ARENA_HEIGHT / 4)
    expect(fish[1].position.y).toBe((ARENA_HEIGHT / 4) * 2)
    expect(fish[2].position.y).toBe((ARENA_HEIGHT / 4) * 3)
  })

  it('uses config playerColors when provided', () => {
    const config = makeGameConfig({
      numPlayers: 2,
      playerColors: ['#ff0000', '#00ff00'],
    })
    const fish = initializeFish(config, ARENA_WIDTH, ARENA_HEIGHT)
    expect(fish[0].color).toBe('#ff0000')
    expect(fish[1].color).toBe('#00ff00')
  })

  it('falls back to default FISH_COLORS when playerColors are not provided', () => {
    const config = makeGameConfig({
      numPlayers: 2,
    })
    // Ensure no playerColors in config
    delete config.playerColors
    const fish = initializeFish(config, ARENA_WIDTH, ARENA_HEIGHT)
    expect(fish[0].color).toBe('#10b981')
    expect(fish[1].color).toBe('#3b82f6')
  })

  it('uses config playerNames', () => {
    const config = makeGameConfig({
      numPlayers: 2,
      playerNames: ['Alice', 'Bob'],
    })
    const fish = initializeFish(config, ARENA_WIDTH, ARENA_HEIGHT)
    expect(fish[0].name).toBe('Alice')
    expect(fish[1].name).toBe('Bob')
  })

  it('initializes all fish as not frozen', () => {
    const config = makeGameConfig({
      numPlayers: 3,
      humanPlayers: [true, false, true],
      playerNames: ['P1', 'AI', 'P2'],
    })
    const fish = initializeFish(config, ARENA_WIDTH, ARENA_HEIGHT)
    fish.forEach(f => {
      expect(f.isFrozen).toBe(false)
      expect(f.frozenUntil).toBe(0)
      expect(f.survivalTime).toBe(0)
      expect(f.frozenTime).toBe(0)
    })
  })
})

describe('initializeRobots', () => {
  it('creates the correct number of robots', () => {
    const robots = initializeRobots(3, 'medium', ARENA_WIDTH, ARENA_HEIGHT)
    expect(robots).toHaveLength(3)
  })

  it('sets speed to 1.5 for easy difficulty', () => {
    const robots = initializeRobots(2, 'easy', ARENA_WIDTH, ARENA_HEIGHT)
    robots.forEach(r => {
      expect(r.speed).toBe(1.5)
    })
  })

  it('sets speed to 2.5 for medium difficulty', () => {
    const robots = initializeRobots(2, 'medium', ARENA_WIDTH, ARENA_HEIGHT)
    robots.forEach(r => {
      expect(r.speed).toBe(2.5)
    })
  })

  it('sets speed to 3.5 for hard difficulty', () => {
    const robots = initializeRobots(2, 'hard', ARENA_WIDTH, ARENA_HEIGHT)
    robots.forEach(r => {
      expect(r.speed).toBe(3.5)
    })
  })

  it('positions robots at x = arenaWidth - 100', () => {
    const robots = initializeRobots(2, 'medium', ARENA_WIDTH, ARENA_HEIGHT)
    robots.forEach(r => {
      expect(r.position.x).toBe(ARENA_WIDTH - 100)
    })
  })

  it('distributes robots y positions evenly', () => {
    const robots = initializeRobots(3, 'medium', ARENA_WIDTH, ARENA_HEIGHT)
    // For 3 robots: y = (700 / 4) * 1, (700 / 4) * 2, (700 / 4) * 3
    expect(robots[0].position.y).toBe(ARENA_HEIGHT / 4)
    expect(robots[1].position.y).toBe((ARENA_HEIGHT / 4) * 2)
    expect(robots[2].position.y).toBe((ARENA_HEIGHT / 4) * 3)
  })

  it('initializes velocity to {0, 0} for all robots', () => {
    const robots = initializeRobots(2, 'medium', ARENA_WIDTH, ARENA_HEIGHT)
    robots.forEach(r => {
      expect(r.velocity).toEqual({ x: 0, y: 0 })
    })
  })

  it('initializes isStuck to false for all robots', () => {
    const robots = initializeRobots(2, 'medium', ARENA_WIDTH, ARENA_HEIGHT)
    robots.forEach(r => {
      expect(r.isStuck).toBe(false)
      expect(r.stuckUntil).toBe(0)
      expect(r.stuckToObstacleId).toBeNull()
    })
  })
})

describe('initializeObstacles', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns exactly 6 obstacles', () => {
    const obstacles = initializeObstacles(ARENA_WIDTH, ARENA_HEIGHT)
    expect(obstacles).toHaveLength(6)
  })

  it('includes at least 1 magnet when Math.random returns < 0.5', () => {
    // First call determines numMagnets: < 0.5 means 1 magnet
    // Subsequent calls are for type selection and positions
    vi.spyOn(Math, 'random').mockReturnValue(0.3)

    const obstacles = initializeObstacles(ARENA_WIDTH, ARENA_HEIGHT)
    const magnets = obstacles.filter(o => o.type === 'magnet')
    expect(magnets.length).toBe(1)
  })

  it('includes 2 magnets when Math.random returns >= 0.5', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.7)

    const obstacles = initializeObstacles(ARENA_WIDTH, ARENA_HEIGHT)
    const magnets = obstacles.filter(o => o.type === 'magnet')
    expect(magnets.length).toBe(2)
  })

  it('places all obstacles within the safe zone boundaries', () => {
    const obstacles = initializeObstacles(ARENA_WIDTH, ARENA_HEIGHT)
    const safeZoneLeft = 250
    const safeZoneRight = ARENA_WIDTH - 250
    const safeZoneTop = 150
    const safeZoneBottom = ARENA_HEIGHT - 150

    obstacles.forEach(o => {
      expect(o.position.x).toBeGreaterThanOrEqual(safeZoneLeft)
      expect(o.position.x).toBeLessThanOrEqual(safeZoneRight)
      expect(o.position.y).toBeGreaterThanOrEqual(safeZoneTop)
      expect(o.position.y).toBeLessThanOrEqual(safeZoneBottom)
    })
  })

  it('assigns correct dimensions for seaweed (35x80)', () => {
    // Force: numMagnets = 1 (random < 0.5), then type index = 0 => 'seaweed'
    const mockRandom = vi.spyOn(Math, 'random')
    // Call 1: numMagnets => 0.3 < 0.5 => 1 magnet
    // Obstacle 0 (i < 1): magnet, needs x, y positions
    // Obstacle 1 (i >= 1): regularTypes[floor(random*4)] => need 0.0 => seaweed
    // Then x and y positions for obstacle 1
    let callCount = 0
    mockRandom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return 0.3   // numMagnets = 1
      // For positions and type selection, return 0.0 to get seaweed and safe zone left/top
      return 0.0
    })

    const obstacles = initializeObstacles(ARENA_WIDTH, ARENA_HEIGHT)
    const seaweed = obstacles.find(o => o.type === 'seaweed')
    if (seaweed) {
      expect(seaweed.width).toBe(35)
      expect(seaweed.height).toBe(80)
    }
  })

  it('assigns correct dimensions for island (100x70)', () => {
    let callCount = 0
    vi.spyOn(Math, 'random').mockImplementation(() => {
      callCount++
      if (callCount === 1) return 0.3   // numMagnets = 1
      // For type selection, return 0.25 to get index 1 => 'island'
      // For positions, return 0.5
      return 0.25
    })

    const obstacles = initializeObstacles(ARENA_WIDTH, ARENA_HEIGHT)
    const island = obstacles.find(o => o.type === 'island')
    if (island) {
      expect(island.width).toBe(100)
      expect(island.height).toBe(70)
    }
  })

  it('assigns correct dimensions for iceberg (80x80)', () => {
    let callCount = 0
    vi.spyOn(Math, 'random').mockImplementation(() => {
      callCount++
      if (callCount === 1) return 0.3   // numMagnets = 1
      // For type selection: floor(0.5 * 4) = 2 => 'iceberg'
      return 0.5
    })

    const obstacles = initializeObstacles(ARENA_WIDTH, ARENA_HEIGHT)
    const iceberg = obstacles.find(o => o.type === 'iceberg')
    if (iceberg) {
      expect(iceberg.width).toBe(80)
      expect(iceberg.height).toBe(80)
    }
  })

  it('assigns correct dimensions for magnet (70x50)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.3)

    const obstacles = initializeObstacles(ARENA_WIDTH, ARENA_HEIGHT)
    const magnet = obstacles.find(o => o.type === 'magnet')!
    expect(magnet.width).toBe(70)
    expect(magnet.height).toBe(50)
  })

  it('assigns correct dimensions for coral (60x50)', () => {
    let callCount = 0
    vi.spyOn(Math, 'random').mockImplementation(() => {
      callCount++
      if (callCount === 1) return 0.3   // numMagnets = 1
      // For type selection: floor(0.75 * 4) = 3 => 'coral'
      return 0.75
    })

    const obstacles = initializeObstacles(ARENA_WIDTH, ARENA_HEIGHT)
    const coral = obstacles.find(o => o.type === 'coral')
    if (coral) {
      expect(coral.width).toBe(60)
      expect(coral.height).toBe(50)
    }
  })

  it('assigns sequential ids starting from 0', () => {
    const obstacles = initializeObstacles(ARENA_WIDTH, ARENA_HEIGHT)
    obstacles.forEach((o, i) => {
      expect(o.id).toBe(i)
    })
  })
})
