import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";
import { clamp, handPointToWorld } from "../utils/math.js";

const pageTextureCache = new Map();
const pageMaterialCache = new Map();

function getPageTexture(assetPath) {
  if (pageTextureCache.has(assetPath)) {
    return pageTextureCache.get(assetPath);
  }

  const texture = new THREE.TextureLoader().load(assetPath, (loadedTexture) => {
    loadedTexture.colorSpace = THREE.SRGBColorSpace;
    loadedTexture.needsUpdate = true;
  });
  texture.colorSpace = THREE.SRGBColorSpace;
  pageTextureCache.set(assetPath, texture);
  return texture;
}

function getPageMaterial(config) {
  const key = `${config.assetPath}-${config.opacity}`;

  if (pageMaterialCache.has(key)) {
    return pageMaterialCache.get(key);
  }

  const material = new THREE.MeshBasicMaterial({
    map: getPageTexture(config.assetPath),
    transparent: true,
    opacity: config.opacity,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  pageMaterialCache.set(key, material);
  return material;
}

export class PlayerPage {
  constructor({ camera, config }) {
    this.camera = camera;
    this.config = config;
    this.group = new THREE.Group();
    this.target = new THREE.Vector3(0, 0, -1.1);
    this.velocity = new THREE.Vector3();
    this.lastPosition = new THREE.Vector3();
    this.rawPalm = { x: null, y: null };
    this.pulseElapsed = 9999;
    this.pulseDuration = 260;
    this.hasInputLock = false;
    this.geometries = [];
    this.materials = [];
    this.build();
  }

  update(deltaTime, input) {
    const delta = deltaTime / 1000;
    const palm = input?.primaryHand?.palm;
    const targetWorld = palm?.world ?? handPointToWorld(palm, input?.source, this.camera, this.config);

    if (targetWorld) {
      this.rawPalm.x = palm.x;
      this.rawPalm.y = palm.y;
      this.target.set(targetWorld.x, targetWorld.y, -1.1);

      if (!this.hasInputLock) {
        this.group.position.copy(this.target);
        this.hasInputLock = true;
      }
    } else {
      this.rawPalm.x = null;
      this.rawPalm.y = null;
      this.hasInputLock = false;
      this.target.x += (0 - this.target.x) * this.config.returnToCenter;
      this.target.y += (0 - this.target.y) * this.config.returnToCenter;
    }

    this.target.x = clamp(this.target.x, this.config.minX, this.config.maxX);
    this.target.y = clamp(this.target.y, this.config.minY, this.config.maxY);
    this.lastPosition.copy(this.group.position);
    this.group.position.x += (this.target.x - this.group.position.x) * this.config.smoothing;
    this.group.position.y += (this.target.y - this.group.position.y) * this.config.smoothing;
    this.group.position.z = -1.1;
    this.velocity.copy(this.group.position).sub(this.lastPosition);

    const tiltZ = clamp(-this.velocity.x * 3.6, -this.config.maxTiltZ, this.config.maxTiltZ);
    const tiltX = clamp(this.velocity.y * 1.8, -this.config.maxTiltX, this.config.maxTiltX);
    this.group.rotation.z += (tiltZ - this.group.rotation.z) * 0.16;
    this.group.rotation.x += (tiltX - this.group.rotation.x) * 0.14;
    this.group.rotation.y = Math.sin(performance.now() * 0.0018) * 0.035;

    this.pulseElapsed += deltaTime;
    const pulseProgress = Math.min(this.pulseElapsed / this.pulseDuration, 1);
    const pulse = pulseProgress < 1 ? Math.sin(pulseProgress * Math.PI) * 0.08 : 0;
    this.group.scale.setScalar(1 + pulse);
    this.glow.material.opacity = 0.08 + pulse * 2.2;
  }

  triggerCollectFeedback(duration) {
    this.pulseElapsed = 0;
    this.pulseDuration = duration || this.pulseDuration;
  }

  getPosition() {
    return this.group.position;
  }

  reset() {
    this.target.set(0, 0, -1.1);
    this.group.position.set(0, 0, -1.1);
    this.group.rotation.set(0, 0, 0);
    this.group.scale.setScalar(1);
    this.pulseElapsed = 9999;
    this.hasInputLock = false;
  }

  getDebugState() {
    return {
      rawPalmX: this.rawPalm.x,
      rawPalmY: this.rawPalm.y,
      targetX: this.target.x,
      targetY: this.target.y,
      pageX: this.group.position.x,
      pageY: this.group.position.y
    };
  }

  dispose() {
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.group.clear();
  }

  build() {
    const pageWidth = this.config.width;
    const pageHeight = pageWidth / this.config.aspectRatio;
    const pageGeometry = new THREE.PlaneGeometry(pageWidth, pageHeight);
    const glowGeometry = new THREE.PlaneGeometry(pageWidth * 1.2, pageHeight * 1.12);
    const pageMaterial = getPageMaterial(this.config);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: "#3650CF",
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.geometries.push(pageGeometry, glowGeometry);
    this.materials.push(glowMaterial);

    this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.glow.position.z = -0.02;
    this.glow.renderOrder = 30;
    this.group.add(this.glow);

    const page = new THREE.Mesh(pageGeometry, pageMaterial);
    page.renderOrder = 33;
    this.group.add(page);
    this.reset();
  }
}
