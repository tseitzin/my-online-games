import { Car, CarConfig, PlayerInputs } from '../../../types/race';
import { CAR_PHYSICS } from '../../../constants/race';

export function createCar(config: CarConfig, lane: number, isAI: boolean): Car {
  const speedVariation = (Math.random() - 0.5) * CAR_PHYSICS.speedVariation * 2;
  const aiSpeedVariation = isAI ? (Math.random() * CAR_PHYSICS.aiSpeedVariation) : 0;

  return {
    ...config,
    trackProgress: 0,
    lane,
    laneOffset: 0,
    speed: 0,
    maxSpeed: CAR_PHYSICS.baseMaxSpeed + speedVariation - (isAI ? CAR_PHYSICS.baseMaxSpeed * (1 - CAR_PHYSICS.aiSpeedFactor) - aiSpeedVariation : 0),
    acceleration: CAR_PHYSICS.acceleration,
    deceleration: CAR_PHYSICS.deceleration,
    lapsCompleted: 0,
    lastCheckpoint: 0,
    finished: false,
    steeringAngle: 0,
    heading: 0,
  };
}

export function updateCar(
  car: Car,
  deltaTime: number,
  input: { accelerate: boolean; brake: boolean; turnLeft: boolean; turnRight: boolean }
): Car {
  if (car.finished) return car;

  let newSpeed = car.speed;

  if (input.accelerate) {
    newSpeed += car.acceleration * deltaTime;
  } else if (input.brake) {
    newSpeed -= car.deceleration * deltaTime;
  } else {
    newSpeed -= CAR_PHYSICS.coastDeceleration * deltaTime;
  }

  newSpeed = Math.max(0, Math.min(newSpeed, car.maxSpeed));

  let newLaneOffset = car.laneOffset;
  let newSteeringAngle = car.steeringAngle;
  let newHeading = car.heading;

  const steeringSpeed = 0.008;
  const steeringDamping = 0.9;

  // Speed-dependent steering: slower = sharper turns
  const speedFactor = Math.max(0.3, newSpeed / car.maxSpeed);
  const effectiveTurnRate = CAR_PHYSICS.headingTurnRate / speedFactor;

  if (input.turnLeft) {
    newLaneOffset -= CAR_PHYSICS.turnSpeed * deltaTime;
    newSteeringAngle = Math.max(newSteeringAngle - steeringSpeed * deltaTime, -CAR_PHYSICS.maxTurnAngle);
    newHeading -= effectiveTurnRate * deltaTime;
  } else if (input.turnRight) {
    newLaneOffset += CAR_PHYSICS.turnSpeed * deltaTime;
    newSteeringAngle = Math.min(newSteeringAngle + steeringSpeed * deltaTime, CAR_PHYSICS.maxTurnAngle);
    newHeading += effectiveTurnRate * deltaTime;
  } else {
    newSteeringAngle *= Math.pow(steeringDamping, deltaTime / 16);
    if (Math.abs(newSteeringAngle) < 0.001) {
      newSteeringAngle = 0;
    }
  }

  // Normalize heading to 0-2pi range
  newHeading = ((newHeading % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

  const maxLaneOffset = CAR_PHYSICS.laneWidth * CAR_PHYSICS.maxLaneOffsetMultiplier;
  newLaneOffset = Math.max(-maxLaneOffset, Math.min(maxLaneOffset, newLaneOffset));

  let newProgress = car.trackProgress + newSpeed * deltaTime;
  let newLaps = car.lapsCompleted;
  let newCheckpoint = car.lastCheckpoint;

  if (car.trackProgress > 0.75 && car.lastCheckpoint === 1) {
    newCheckpoint = 2;
  } else if (car.trackProgress > 0.25 && car.trackProgress < 0.75 && car.lastCheckpoint === 0) {
    newCheckpoint = 1;
  }

  if (newProgress >= 1) {
    if (newCheckpoint === 2) {
      newLaps += 1;
      newCheckpoint = 0;
    }
    newProgress = newProgress % 1;
  }

  return {
    ...car,
    speed: newSpeed,
    trackProgress: newProgress,
    laneOffset: newLaneOffset,
    lapsCompleted: newLaps,
    lastCheckpoint: newCheckpoint,
    steeringAngle: newSteeringAngle,
    heading: newHeading,
  };
}

export function getAIInput(car: Car): { accelerate: boolean; brake: boolean; turnLeft: boolean; turnRight: boolean } {
  const targetSpeed = car.maxSpeed * (0.85 + Math.random() * 0.1);

  let turnLeft = false;
  let turnRight = false;

  if (car.laneOffset > 5) {
    turnLeft = true;
  } else if (car.laneOffset < -5) {
    turnRight = true;
  }

  if (car.speed < targetSpeed) {
    return { accelerate: true, brake: false, turnLeft, turnRight };
  }
  return { accelerate: false, brake: false, turnLeft, turnRight };
}

export function calculatePositions(cars: Car[]): Car[] {
  const sortedCars = [...cars].sort((a, b) => {
    if (a.finished && b.finished) {
      return (a.finishPosition || 0) - (b.finishPosition || 0);
    }
    if (a.finished) return -1;
    if (b.finished) return 1;

    if (b.lapsCompleted !== a.lapsCompleted) {
      return b.lapsCompleted - a.lapsCompleted;
    }
    return b.trackProgress - a.trackProgress;
  });

  return sortedCars.map((car, index) => ({
    ...car,
    position: index + 1,
  }));
}

export function updateRaceState(
  cars: Car[],
  deltaTime: number,
  playerInputs: PlayerInputs,
  targetLaps: number
): { cars: Car[]; finished: boolean; finishOrder: number } {
  let finishOrder = cars.filter(c => c.finished).length;

  const updatedCars = cars.map(car => {
    if (car.finished) return car;

    const input = car.isAI
      ? getAIInput(car)
      : playerInputs[car.playerIndex!] || { accelerate: false, brake: false, turnLeft: false, turnRight: false };

    const updated = updateCar(car, deltaTime, input);

    if (updated.lapsCompleted >= targetLaps && !updated.finished) {
      finishOrder += 1;
      return {
        ...updated,
        finished: true,
        finishPosition: finishOrder,
        finishTime: Date.now(),
      };
    }

    return updated;
  });

  const allFinished = updatedCars.every(car => car.finished);

  return {
    cars: updatedCars,
    finished: allFinished,
    finishOrder,
  };
}
