import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";

const backgroundTextureCache = new Map();
const backgroundMaterialCache = new Map();

function getBackgroundTexture(assetPath) {
  if (backgroundTextureCache.has(assetPath)) {
    return backgroundTextureCache.get(assetPath);
  }

  const texture = new THREE.TextureLoader().load(assetPath, (loadedTexture) => {
    loadedTexture.colorSpace = THREE.SRGBColorSpace;
    loadedTexture.needsUpdate = true;
  });
  texture.colorSpace = THREE.SRGBColorSpace;
  backgroundTextureCache.set(assetPath, texture);
  return texture;
}

function getBackgroundMaterial(config) {
  const key = `${config.assetPath}-${config.opacity ?? 1}`;

  if (backgroundMaterialCache.has(key)) {
    return backgroundMaterialCache.get(key);
  }

  const material = new THREE.MeshBasicMaterial({
    map: getBackgroundTexture(config.assetPath),
    transparent: true,
    opacity: config.opacity ?? 1,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  backgroundMaterialCache.set(key, material);
  return material;
}

export class SubmarineBackground {
  constructor({ config, camera }) {
    this.config = config;
    this.camera = camera;
    this.group = new THREE.Group();
    this.geometries = [];
    this.create();
  }

  create() {
    const geometry = new THREE.PlaneGeometry(1, 1);
    this.mesh = new THREE.Mesh(geometry, getBackgroundMaterial(this.config));
    this.mesh.position.z = this.config.z;
    this.mesh.renderOrder = this.config.renderOrder;
    this.group.add(this.mesh);
    this.geometries.push(geometry);
    this.fitToCamera();
  }

  update() {
    this.fitToCamera();
  }

  fitToCamera() {
    const cameraWidth = this.camera.right - this.camera.left;
    const cameraHeight = this.camera.top - this.camera.bottom;
    const cameraAspect = cameraWidth / cameraHeight;
    const imageAspect = this.config.aspectRatio;

    if (cameraAspect > imageAspect) {
      this.mesh.scale.set(cameraWidth, cameraWidth / imageAspect, 1);
    } else {
      this.mesh.scale.set(cameraHeight * imageAspect, cameraHeight, 1);
    }

    this.mesh.position.x = (this.camera.left + this.camera.right) / 2;
    this.mesh.position.y = (this.camera.top + this.camera.bottom) / 2;
  }

  dispose() {
    this.geometries.forEach((geometry) => geometry.dispose());
    this.group.clear();
  }
}
