import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";

const planetTextureCache = new Map();
const planetMaterialCache = new Map();

function getPlanetTexture(assetPath) {
  if (planetTextureCache.has(assetPath)) {
    return planetTextureCache.get(assetPath);
  }

  const texture = new THREE.TextureLoader().load(assetPath, (loadedTexture) => {
    loadedTexture.colorSpace = THREE.SRGBColorSpace;
    loadedTexture.needsUpdate = true;
  });
  texture.colorSpace = THREE.SRGBColorSpace;
  planetTextureCache.set(assetPath, texture);
  return texture;
}

function getPlanetMaterial(config) {
  const key = `${config.assetPath}-${config.opacity ?? 1}`;

  if (planetMaterialCache.has(key)) {
    return planetMaterialCache.get(key);
  }

  const material = new THREE.MeshBasicMaterial({
    map: getPlanetTexture(config.assetPath),
    transparent: true,
    opacity: config.opacity ?? 1,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  planetMaterialCache.set(key, material);
  return material;
}

export class SmallPlanet {
  constructor({ config }) {
    this.config = config;
    this.group = new THREE.Group();
    this.geometries = [];
    this.baseRotation = 0;
    this.create();
  }

  create() {
    const height = this.config.size;
    const width = height * this.config.aspectRatio;
    const planetGeometry = new THREE.PlaneGeometry(width, height);
    const planet = new THREE.Mesh(planetGeometry, getPlanetMaterial(this.config));
    planet.renderOrder = -2;
    this.group.add(planet);
    this.group.position.set(0, this.config.y, -0.8);
    this.geometries.push(planetGeometry);
  }

  update({ torsoTilt = 0, progress = 1 } = {}) {
    const targetTilt = this.config.torsoReaction ? torsoTilt * this.config.maxTilt : 0;
    this.baseRotation += (targetTilt - this.baseRotation) * 0.08;
    this.group.rotation.z = this.baseRotation;
    this.group.scale.setScalar(progress);
  }

  getOrbitCenter() {
    return this.group.position.clone();
  }

  getSurfaceY() {
    return this.group.position.y + this.config.size / 2;
  }

  dispose() {
    this.geometries.forEach((geometry) => geometry.dispose());
    this.group.clear();
  }
}
