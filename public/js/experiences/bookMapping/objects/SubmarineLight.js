import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.178.0/build/three.module.js";

function makeLightTexture() {
  const canvas = document.createElement("canvas");
  const size = 256;
  const center = size / 2;
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, "rgba(216,243,255,0.72)");
  gradient.addColorStop(0.42, "rgba(216,243,255,0.26)");
  gradient.addColorStop(1, "rgba(216,243,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export class SubmarineLight {
  constructor({ config, camera }) {
    this.config = config;
    this.camera = camera;
    this.group = new THREE.Group();
    this.position = new THREE.Vector3(0, 0, -0.5);
    this.target = new THREE.Vector3(0, 0, -0.5);
    this.texture = makeLightTexture();
    this.material = new THREE.SpriteMaterial({
      map: this.texture,
      transparent: true,
      opacity: 0.92,
      depthWrite: false
    });
    this.sprite = new THREE.Sprite(this.material);
    this.sprite.scale.setScalar(this.config.radius * 2.65);
    this.group.add(this.sprite);
  }

  update(input) {
    const palmWorld = input?.primaryHand?.palm?.world;

    if (palmWorld) {
      this.target.set(palmWorld.x, palmWorld.y, -0.46);
    }

    this.position.lerp(this.target, this.config.smoothing);
    this.sprite.position.copy(this.position);
  }

  getPosition() {
    return this.position;
  }

  getRadius() {
    return this.config.radius;
  }

  dispose() {
    this.texture.dispose();
    this.material.dispose();
    this.group.clear();
  }
}
