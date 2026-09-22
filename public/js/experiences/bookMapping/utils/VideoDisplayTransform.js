export function createCoverVideoDisplayTransform({
  videoWidth = 1,
  videoHeight = 1,
  displayWidth = 1,
  displayHeight = 1,
  worldBounds = null,
  mirrorX = true
} = {}) {
  const safeVideoWidth = Math.max(videoWidth, 1);
  const safeVideoHeight = Math.max(videoHeight, 1);
  const safeDisplayWidth = Math.max(displayWidth, 1);
  const safeDisplayHeight = Math.max(displayHeight, 1);
  const scale = Math.max(safeDisplayWidth / safeVideoWidth, safeDisplayHeight / safeVideoHeight);
  const renderedWidth = safeVideoWidth * scale;
  const renderedHeight = safeVideoHeight * scale;
  const offsetX = (safeDisplayWidth - renderedWidth) / 2;
  const offsetY = (safeDisplayHeight - renderedHeight) / 2;

  return {
    videoWidth: safeVideoWidth,
    videoHeight: safeVideoHeight,
    displayWidth: safeDisplayWidth,
    displayHeight: safeDisplayHeight,
    scale,
    renderedWidth,
    renderedHeight,
    offsetX,
    offsetY,
    mirrorX,
    worldBounds
  };
}

export function normalizedVideoPointToDisplay(point, transform) {
  if (!point || !transform) {
    return null;
  }

  const normalizedX = transform.mirrorX ? 1 - point.x : point.x;
  const videoX = normalizedX * transform.videoWidth;
  const videoY = point.y * transform.videoHeight;
  const displayX = videoX * transform.scale + transform.offsetX;
  const displayY = videoY * transform.scale + transform.offsetY;

  return {
    x: displayX / transform.displayWidth,
    y: displayY / transform.displayHeight,
    z: point.z ?? 0,
    visibility: point.visibility
  };
}

export function normalizedVideoPointToWorld(point, transform) {
  const displayPoint = normalizedVideoPointToDisplay(point, transform);
  const worldBounds = transform?.worldBounds;

  if (!displayPoint || !worldBounds) {
    return null;
  }

  return {
    x: worldBounds.left + displayPoint.x * worldBounds.width,
    y: worldBounds.top - displayPoint.y * worldBounds.height,
    z: displayPoint.z ?? 0,
    visibility: displayPoint.visibility
  };
}
