import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";

const roseTextureCache = new Map();
const roseMaterialCache = new Map();

function getRoseTexture(assetPath) {
  if (roseTextureCache.has(assetPath)) {
    return roseTextureCache.get(assetPath);
  }

  const texture = new THREE.TextureLoader().load(assetPath, (loadedTexture) => {
    loadedTexture.colorSpace = THREE.SRGBColorSpace;
    loadedTexture.needsUpdate = true;
  });
  texture.colorSpace = THREE.SRGBColorSpace;
  roseTextureCache.set(assetPath, texture);
  return texture;
}

function getRoseMaterial(config) {
  const key = config.assetPath;

  if (roseMaterialCache.has(key)) {
    return roseMaterialCache.get(key);
  }

  const material = new THREE.MeshBasicMaterial({
    map: getRoseTexture(config.assetPath),
    transparent: true,
    opacity: 1,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  roseMaterialCache.set(key, material);
  return material;
}

export class Rose {
  constructor({ config, colors }) {
    this.config = config;
    this.colors = colors;
    this.group = new THREE.Group();
    this.stage = 0;
    this.geometries = [];
    this.create();
  }

  create() {
    const width = this.config.width;
    const height = width / this.config.aspectRatio;
    const geometry = new THREE.PlaneGeometry(width, height);
    this.material = getRoseMaterial(this.config);
    this.rose = new THREE.Mesh(geometry, this.material);
    this.rose.position.set(0.58, 0.48, 0.06);
    this.rose.renderOrder = 8;
    this.group.add(this.rose);
    this.geometries.push(geometry);
    this.setStage(0);
  }

  setStage(stage) {
    this.stage = stage;
    this.rose.visible = stage >= 0;
    this.rose.scale.setScalar(stage >= 2 ? 1 : stage >= 1 ? 0.74 : 0.46);
    this.material.opacity = stage >= 2 ? 1 : stage >= 1 ? 0.78 : 0.5;
  }

  update(recoveredStars) {
    const nextStage = recoveredStars >= this.config.stages[2]
      ? 2
      : recoveredStars >= this.config.stages[1]
        ? 1
        : 0;

    if (nextStage !== this.stage) {
      this.setStage(nextStage);
    }

    const pulse = 1 + Math.sin(performance.now() * 0.003) * 0.04;
    this.group.scale.setScalar(pulse);
  }

  dispose() {
    this.geometries.forEach((geometry) => geometry.dispose());
    this.group.clear();
  }
}
