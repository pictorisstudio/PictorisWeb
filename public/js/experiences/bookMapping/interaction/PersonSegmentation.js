export function createPersonSegmentationInput({
  mask = null,
  width = 0,
  height = 0,
  timestamp = 0,
  fps = 0,
  modelReady = false,
  active = false,
  error = null
} = {}) {
  const age = timestamp ? performance.now() - timestamp : Infinity;

  return {
    mask,
    width,
    height,
    timestamp,
    age,
    fps,
    modelReady,
    active,
    error
  };
}

export function copyPersonMask(result) {
  const mask = result?.confidenceMasks?.[0] ?? result?.categoryMask ?? null;

  if (!mask) {
    return null;
  }

  const data = mask.getAsUint8Array();
  const width = Math.round(mask.width ?? result.width ?? Math.sqrt(data.length));
  const height = Math.round(mask.height ?? result.height ?? Math.ceil(data.length / width));

  return {
    data: new Uint8Array(data),
    width,
    height
  };
}
