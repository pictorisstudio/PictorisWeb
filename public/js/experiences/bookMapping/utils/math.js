import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function smoothstep(edge0, edge1, value) {
  const x = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return x * x * (3 - 2 * x);
}

export function handPointToWorld(point, source, camera, bounds = null) {
  if (!point || !camera) {
    return null;
  }

  const normalizedX = source === "hand" ? 1 - point.x : point.x;
  const x = camera.left + normalizedX * (camera.right - camera.left);
  const y = camera.top - point.y * (camera.top - camera.bottom);

  return new THREE.Vector3(
    bounds ? clamp(x, bounds.minX, bounds.maxX) : x,
    bounds ? clamp(y, bounds.minY, bounds.maxY) : y,
    -1.1
  );
}
