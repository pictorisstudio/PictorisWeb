import { normalizedVideoPointToWorld } from "../utils/VideoDisplayTransform.js";

const POSE_LANDMARKS = Object.freeze({
  head: 0,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24
});

const REQUIRED_POINTS = [
  "head",
  "leftShoulder",
  "rightShoulder",
  "leftElbow",
  "rightElbow",
  "leftWrist",
  "rightWrist",
  "leftHip",
  "rightHip"
];

function smoothPoint(previous, current, amount) {
  if (!previous) {
    return current;
  }

  return {
    x: previous.x + (current.x - previous.x) * amount,
    y: previous.y + (current.y - previous.y) * amount,
    z: previous.z + (current.z - previous.z) * amount,
    visibility: current.visibility
  };
}

function normalizedToWorld(point, worldBounds) {
  if (!point || !worldBounds) {
    return null;
  }

  const mirroredX = 1 - point.x;

  return {
    x: worldBounds.left + mirroredX * worldBounds.width,
    y: worldBounds.top - point.y * worldBounds.height,
    z: 0
  };
}

function pointToWorld(point, worldBounds, displayTransform) {
  return normalizedVideoPointToWorld(point, displayTransform) ?? normalizedToWorld(point, worldBounds);
}

export function createPoseInput({
  landmarks = null,
  previous = null,
  worldBounds = null,
  displayTransform = null,
  smoothing = 0.32,
  minVisibility = 0.35,
  pointer = null
} = {}) {
  if (!landmarks?.length && pointer) {
    const wrist = pointer.world ?? normalizedToWorld(pointer, worldBounds);
    const mirroredWrist = {
      x: -wrist.x,
      y: wrist.y,
      z: wrist.z
    };
    const fallbackWorld = {
      head: { x: 0, y: 1.15, z: 0 },
      leftShoulder: { x: -0.42, y: 0.62, z: 0 },
      rightShoulder: { x: 0.42, y: 0.62, z: 0 },
      leftElbow: { x: (wrist.x - 0.42) * 0.5, y: (wrist.y + 0.62) * 0.5, z: 0 },
      rightElbow: { x: (mirroredWrist.x + 0.42) * 0.5, y: (mirroredWrist.y + 0.62) * 0.5, z: 0 },
      leftWrist: wrist,
      rightWrist: mirroredWrist,
      leftHip: { x: -0.26, y: -0.15, z: 0 },
      rightHip: { x: 0.26, y: -0.15, z: 0 },
      torsoCenter: { x: 0, y: 0.24, z: 0 }
    };

    return {
      detected: true,
      stable: true,
      source: "mouse",
      confidence: 1,
      points: {},
      world: fallbackWorld,
      movement: previous?.movement ?? 0,
      rawLandmarks: null
    };
  }

  if (!landmarks?.length) {
    return {
      detected: false,
      stable: false,
      source: "none",
      confidence: 0,
      points: previous?.points ?? {},
      world: previous?.world ?? {},
      movement: 0,
      rawLandmarks: null
    };
  }

  const points = {};
  let visibilityTotal = 0;

  REQUIRED_POINTS.forEach((name) => {
    const landmark = landmarks[POSE_LANDMARKS[name]];
    const current = {
      x: landmark?.x ?? 0.5,
      y: landmark?.y ?? 0.5,
      z: landmark?.z ?? 0,
      visibility: landmark?.visibility ?? 1
    };

    visibilityTotal += current.visibility;
    points[name] = smoothPoint(previous?.points?.[name], current, smoothing);
  });

  const confidence = visibilityTotal / REQUIRED_POINTS.length;
  const stable = confidence >= minVisibility;
  const world = {};

  REQUIRED_POINTS.forEach((name) => {
    world[name] = pointToWorld(points[name], worldBounds, displayTransform);
  });

  world.torsoCenter = {
    x: (world.leftShoulder.x + world.rightShoulder.x + world.leftHip.x + world.rightHip.x) / 4,
    y: (world.leftShoulder.y + world.rightShoulder.y + world.leftHip.y + world.rightHip.y) / 4,
    z: 0
  };

  const previousLeft = previous?.world?.leftWrist;
  const previousRight = previous?.world?.rightWrist;
  const movement = previousLeft && previousRight
    ? Math.hypot(world.leftWrist.x - previousLeft.x, world.leftWrist.y - previousLeft.y)
      + Math.hypot(world.rightWrist.x - previousRight.x, world.rightWrist.y - previousRight.y)
    : 0;

  return {
    detected: true,
    stable,
    source: "pose",
    confidence,
    points,
    world,
    movement,
    rawLandmarks: landmarks
  };
}
