import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createCar, updateCar, getAIInput, calculatePositions, updateRaceState } from './GameEngine'
import { makeCar, makeCarConfig, makeInput } from '../test/raceTestHelpers'
import { CAR_PHYSICS } from '../../../constants/race'

// ─── Helpers ─────────────────────────────────────────────────────────────────

let randomSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5)
})

afterEach(() => {
  randomSpy.mockRestore()
})

// ─── createCar ───────────────────────────────────────────────────────────────

describe('createCar', () => {
  it('applies the CarConfig properties onto the returned Car', () => {
    const config = makeCarConfig({ id: 'test-1', color: '#00FF00', number: 7, isAI: false, playerIndex: 2 })
    const car = createCar(config, 3, false)

    expect(car.id).toBe('test-1')
    expect(car.color).toBe('#00FF00')
    expect(car.number).toBe(7)
    expect(car.isAI).toBe(false)
    expect(car.playerIndex).toBe(2)
  })

  it('gives AI cars a speed debuff relative to human cars', () => {
    // With Math.random() = 0, aiSpeedVariation = 0 so the debuff is pure penalty
    // Human: baseMaxSpeed + speedVariation = baseMaxSpeed - speedVariation
    // AI: baseMaxSpeed + speedVariation - baseMaxSpeed*(1-aiSpeedFactor)
    randomSpy.mockReturnValue(0)
    const humanCar = createCar(makeCarConfig(), 0, false)
    const aiCar = createCar(makeCarConfig({ isAI: true }), 1, true)

    expect(aiCar.maxSpeed).toBeLessThan(humanCar.maxSpeed)
  })

  it('assigns the provided lane number', () => {
    const car = createCar(makeCarConfig(), 5, false)
    expect(car.lane).toBe(5)
  })

  it('incorporates random speed variation', () => {
    // random=0 => speedVariation = (0-0.5)*var*2 = -var
    randomSpy.mockReturnValue(0)
    const slowCar = createCar(makeCarConfig(), 0, false)

    // random=1 => speedVariation = (1-0.5)*var*2 = +var
    randomSpy.mockReturnValue(1)
    const fastCar = createCar(makeCarConfig(), 0, false)

    expect(fastCar.maxSpeed).toBeGreaterThan(slowCar.maxSpeed)
    const expectedRange = CAR_PHYSICS.speedVariation * 2
    expect(fastCar.maxSpeed - slowCar.maxSpeed).toBeCloseTo(expectedRange, 10)
  })

  it('initialises dynamic state fields to zero / false', () => {
    const car = createCar(makeCarConfig(), 0, false)

    expect(car.trackProgress).toBe(0)
    expect(car.laneOffset).toBe(0)
    expect(car.speed).toBe(0)
    expect(car.lapsCompleted).toBe(0)
    expect(car.lastCheckpoint).toBe(0)
    expect(car.finished).toBe(false)
    expect(car.steeringAngle).toBe(0)
    expect(car.heading).toBe(0)
  })
})

// ─── updateCar ───────────────────────────────────────────────────────────────

describe('updateCar', () => {
  const dt = 16 // typical 60-fps frame

  it('increases speed when accelerating', () => {
    const car = makeCar({ speed: 0 })
    const result = updateCar(car, dt, makeInput({ accelerate: true }))

    expect(result.speed).toBeGreaterThan(0)
    expect(result.speed).toBeCloseTo(car.acceleration * dt, 10)
  })

  it('decreases speed when braking', () => {
    const car = makeCar({ speed: 0.0001 })
    const result = updateCar(car, dt, makeInput({ brake: true }))

    expect(result.speed).toBeLessThan(0.0001)
  })

  it('applies coast deceleration when neither accelerating nor braking', () => {
    const car = makeCar({ speed: 0.0001 })
    const result = updateCar(car, dt, makeInput())

    expect(result.speed).toBeLessThan(0.0001)
    const expected = 0.0001 - CAR_PHYSICS.coastDeceleration * dt
    expect(result.speed).toBeCloseTo(expected, 10)
  })

  it('returns finished car unchanged', () => {
    const car = makeCar({ finished: true, speed: 0.0001, trackProgress: 0.5 })
    const result = updateCar(car, dt, makeInput({ accelerate: true }))

    expect(result).toBe(car) // identity — same reference
  })

  it('clamps speed at maxSpeed', () => {
    const car = makeCar({ speed: CAR_PHYSICS.baseMaxSpeed - 0.000001, maxSpeed: CAR_PHYSICS.baseMaxSpeed })
    const result = updateCar(car, 10000, makeInput({ accelerate: true }))

    expect(result.speed).toBe(car.maxSpeed)
  })

  it('clamps speed at zero (no negative speed)', () => {
    const car = makeCar({ speed: 0.000001 })
    const result = updateCar(car, 10000, makeInput({ brake: true }))

    expect(result.speed).toBe(0)
  })

  it('shifts lane offset left and adjusts steering when turning left', () => {
    const car = makeCar({ speed: 0.0001, laneOffset: 0, steeringAngle: 0 })
    const result = updateCar(car, dt, makeInput({ turnLeft: true }))

    expect(result.laneOffset).toBeLessThan(0)
    expect(result.steeringAngle).toBeLessThan(0)
  })

  it('shifts lane offset right and adjusts steering when turning right', () => {
    const car = makeCar({ speed: 0.0001, laneOffset: 0, steeringAngle: 0 })
    const result = updateCar(car, dt, makeInput({ turnRight: true }))

    expect(result.laneOffset).toBeGreaterThan(0)
    expect(result.steeringAngle).toBeGreaterThan(0)
  })

  it('clamps lane offset to the maximum', () => {
    const maxOffset = CAR_PHYSICS.laneWidth * CAR_PHYSICS.maxLaneOffsetMultiplier
    const car = makeCar({ laneOffset: maxOffset + 100 })
    const result = updateCar(car, dt, makeInput())

    expect(result.laneOffset).toBe(maxOffset)
  })

  it('normalises heading into the 0–2pi range', () => {
    // Give car a very negative heading that, after turn, should wrap
    const car = makeCar({
      speed: 0.0001,
      heading: -0.01,
      maxSpeed: CAR_PHYSICS.baseMaxSpeed,
    })
    const result = updateCar(car, dt, makeInput({ turnLeft: true }))

    expect(result.heading).toBeGreaterThanOrEqual(0)
    expect(result.heading).toBeLessThan(Math.PI * 2)
  })

  it('applies steering damping when not turning', () => {
    const car = makeCar({ steeringAngle: 0.3 })
    const result = updateCar(car, dt, makeInput())

    expect(Math.abs(result.steeringAngle)).toBeLessThan(0.3)
    expect(result.steeringAngle).toBeGreaterThan(0) // not fully zeroed in one frame
  })

  it('advances checkpoint from 0 to 1 when trackProgress > 0.25', () => {
    const car = makeCar({ trackProgress: 0.3, lastCheckpoint: 0 })
    const result = updateCar(car, dt, makeInput())

    expect(result.lastCheckpoint).toBe(1)
  })

  it('advances checkpoint from 1 to 2 when trackProgress > 0.75', () => {
    const car = makeCar({ trackProgress: 0.8, lastCheckpoint: 1 })
    const result = updateCar(car, dt, makeInput())

    expect(result.lastCheckpoint).toBe(2)
  })

  it('increments lapsCompleted when crossing start with checkpoint 2', () => {
    // Car near the finish line with checkpoint 2, with enough speed to cross
    const car = makeCar({
      trackProgress: 0.99,
      speed: 0.001,
      maxSpeed: 0.01,
      lastCheckpoint: 2,
      lapsCompleted: 0,
    })
    const result = updateCar(car, dt, makeInput())

    expect(result.lapsCompleted).toBe(1)
    expect(result.lastCheckpoint).toBe(0)
    expect(result.trackProgress).toBeLessThan(1)
  })

  it('does NOT increment lapsCompleted when crossing start without checkpoint 2', () => {
    // lastCheckpoint: 0 at trackProgress 0.99 — checkpoint won't advance to 2 in one frame
    // (checkpoint 0→1 requires 0.25 < progress < 0.75, which fails at 0.99)
    const car = makeCar({
      trackProgress: 0.99,
      speed: 0.001,
      maxSpeed: 0.01,
      lastCheckpoint: 0,
      lapsCompleted: 0,
    })
    const result = updateCar(car, dt, makeInput())

    expect(result.lapsCompleted).toBe(0)
    // progress wraps but no lap credit
    expect(result.trackProgress).toBeLessThan(1)
  })
})

// ─── getAIInput ──────────────────────────────────────────────────────────────

describe('getAIInput', () => {
  it('accelerates when below target speed', () => {
    // random=0.5 => targetSpeed = maxSpeed * (0.85 + 0.5*0.1) = maxSpeed * 0.9
    const car = makeCar({ speed: 0, maxSpeed: CAR_PHYSICS.baseMaxSpeed, isAI: true })
    const input = getAIInput(car)

    expect(input.accelerate).toBe(true)
    expect(input.brake).toBe(false)
  })

  it('does not accelerate when at or above target speed', () => {
    // random=0.5 => targetSpeed = maxSpeed * 0.9
    const car = makeCar({ speed: CAR_PHYSICS.baseMaxSpeed, maxSpeed: CAR_PHYSICS.baseMaxSpeed, isAI: true })
    const input = getAIInput(car)

    expect(input.accelerate).toBe(false)
  })

  it('turns left when lane offset is greater than 5', () => {
    const car = makeCar({ laneOffset: 10, isAI: true })
    const input = getAIInput(car)

    expect(input.turnLeft).toBe(true)
    expect(input.turnRight).toBe(false)
  })

  it('turns right when lane offset is less than -5', () => {
    const car = makeCar({ laneOffset: -10, isAI: true })
    const input = getAIInput(car)

    expect(input.turnRight).toBe(true)
    expect(input.turnLeft).toBe(false)
  })

  it('does not turn when lane offset is between -5 and 5', () => {
    const car = makeCar({ laneOffset: 3, isAI: true })
    const input = getAIInput(car)

    expect(input.turnLeft).toBe(false)
    expect(input.turnRight).toBe(false)
  })
})

// ─── calculatePositions ─────────────────────────────────────────────────────

describe('calculatePositions', () => {
  it('sorts unfinished cars by laps then trackProgress (leader first)', () => {
    const trailing = makeCar({ id: 'a', trackProgress: 0.2, lapsCompleted: 1 })
    const leading = makeCar({ id: 'b', trackProgress: 0.8, lapsCompleted: 1 })
    const result = calculatePositions([trailing, leading])

    expect(result[0].id).toBe('b')
    expect(result[1].id).toBe('a')
  })

  it('places finished cars before unfinished cars, ordered by finishPosition', () => {
    const unfinished = makeCar({ id: 'a', finished: false, trackProgress: 0.9, lapsCompleted: 2 })
    const second = makeCar({ id: 'b', finished: true, finishPosition: 2 })
    const first = makeCar({ id: 'c', finished: true, finishPosition: 1 })

    const result = calculatePositions([unfinished, second, first])

    expect(result[0].id).toBe('c')
    expect(result[1].id).toBe('b')
    expect(result[2].id).toBe('a')
  })

  it('assigns 1-based position numbers to each car', () => {
    const cars = [
      makeCar({ id: 'a', trackProgress: 0.1 }),
      makeCar({ id: 'b', trackProgress: 0.5 }),
      makeCar({ id: 'c', trackProgress: 0.3 }),
    ]
    const result = calculatePositions(cars)

    expect(result.map(c => c.position)).toEqual([1, 2, 3])
  })

  it('handles a mix of finished and unfinished with different lap counts', () => {
    const finishedFirst = makeCar({ id: 'f1', finished: true, finishPosition: 1, lapsCompleted: 3 })
    const lapTwo = makeCar({ id: 'l2', finished: false, lapsCompleted: 2, trackProgress: 0.6 })
    const lapOne = makeCar({ id: 'l1', finished: false, lapsCompleted: 1, trackProgress: 0.9 })

    const result = calculatePositions([lapOne, finishedFirst, lapTwo])

    expect(result[0].id).toBe('f1')
    expect(result[0].position).toBe(1)
    expect(result[1].id).toBe('l2')
    expect(result[1].position).toBe(2)
    expect(result[2].id).toBe('l1')
    expect(result[2].position).toBe(3)
  })
})

// ─── updateRaceState ────────────────────────────────────────────────────────

describe('updateRaceState', () => {
  const dt = 16

  it('uses getAIInput for AI cars', () => {
    // AI car with zero speed; getAIInput should produce { accelerate: true }
    const aiCar = makeCar({ id: 'ai', isAI: true, speed: 0, maxSpeed: CAR_PHYSICS.baseMaxSpeed })
    const { cars } = updateRaceState([aiCar], dt, {}, 3)

    // Should have accelerated (speed > 0)
    expect(cars[0].speed).toBeGreaterThan(0)
  })

  it('uses playerInputs for human cars', () => {
    const humanCar = makeCar({ id: 'h', isAI: false, playerIndex: 0, speed: 0.0001 })
    const inputs = { 0: makeInput({ brake: true }) }
    const { cars } = updateRaceState([humanCar], dt, inputs, 3)

    expect(cars[0].speed).toBeLessThan(0.0001)
  })

  it('applies default (no-op) input when playerInputs entry is missing', () => {
    const humanCar = makeCar({ id: 'h', isAI: false, playerIndex: 1, speed: 0.0001 })
    // playerInputs is empty - no entry for index 1
    const { cars } = updateRaceState([humanCar], dt, {}, 3)

    // Coast deceleration should apply
    const expected = 0.0001 - CAR_PHYSICS.coastDeceleration * dt
    expect(cars[0].speed).toBeCloseTo(expected, 10)
  })

  it('detects finish when lapsCompleted reaches targetLaps', () => {
    // Car about to complete final lap (already completed 2, needs 3 total)
    const car = makeCar({
      id: 'racer',
      isAI: false,
      playerIndex: 0,
      trackProgress: 0.99,
      speed: 0.001,
      maxSpeed: 0.01,
      lastCheckpoint: 2,
      lapsCompleted: 2,
    })
    const { cars, finishOrder } = updateRaceState([car], dt, { 0: makeInput() }, 3)

    expect(cars[0].finished).toBe(true)
    expect(cars[0].finishPosition).toBe(1)
    expect(cars[0].finishTime).toBeDefined()
    expect(finishOrder).toBe(1)
  })

  it('increments finishOrder correctly for multiple finishers', () => {
    // One car already finished, another about to finish
    const finished = makeCar({ id: 'done', finished: true, finishPosition: 1 })
    const almostDone = makeCar({
      id: 'close',
      isAI: false,
      playerIndex: 0,
      trackProgress: 0.99,
      speed: 0.001,
      maxSpeed: 0.01,
      lastCheckpoint: 2,
      lapsCompleted: 2,
    })
    const { cars, finishOrder } = updateRaceState([finished, almostDone], dt, { 0: makeInput() }, 3)

    expect(finishOrder).toBe(2)
    expect(cars[1].finishPosition).toBe(2)
  })

  it('sets finished flag to true only when all cars have finished', () => {
    const done = makeCar({ id: 'done', finished: true, finishPosition: 1 })
    const racing = makeCar({ id: 'racing', speed: 0.0001, lapsCompleted: 0 })

    const { finished } = updateRaceState([done, racing], dt, {}, 3)
    expect(finished).toBe(false)

    // Now both finished
    const done1 = makeCar({ id: 'd1', finished: true, finishPosition: 1 })
    const done2 = makeCar({ id: 'd2', finished: true, finishPosition: 2 })
    const allDone = updateRaceState([done1, done2], dt, {}, 3)
    expect(allDone.finished).toBe(true)
  })

  it('does not update already-finished cars', () => {
    const finished = makeCar({
      id: 'done',
      finished: true,
      finishPosition: 1,
      speed: 0.0001,
      trackProgress: 0.5,
    })
    const { cars } = updateRaceState([finished], dt, {}, 3)

    // Should be returned unchanged
    expect(cars[0].speed).toBe(0.0001)
    expect(cars[0].trackProgress).toBe(0.5)
    expect(cars[0]).toEqual(finished)
  })
})
