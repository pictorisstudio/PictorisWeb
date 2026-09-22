import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";

const clockTextureCache = new Map();

export function getClockTexture(assetPath) {
  if (clockTextureCache.has(assetPath)) {
    return clockTextureCache.get(assetPath);
  }

  const texture = new THREE.TextureLoader().load(assetPath, (loadedTexture) => {
    loadedTexture.colorSpace = THREE.SRGBColorSpace;
    loadedTexture.needsUpdate = true;
  });
  texture.colorSpace = THREE.SRGBColorSpace;
  clockTextureCache.set(assetPath, texture);
  return texture;
}

export function createClockGeometry(config, scale = 1) {
  const height = config.clockHeight * scale;
  const width = height * config.clockAspectRatio;
  return new THREE.PlaneGeometry(width, height);
}

export function createClockMaterial(texture, opacity = 1) {
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  material.userData.baseOpacity = opacity;
  return material;
}
